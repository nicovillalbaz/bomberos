import { getSessionProfile, supabase } from '../lib/supabase'
import type { Vehiculo, VehiculoCreate } from '../types'

const assertOfficialOrAdmin = () => {
  const rol = getSessionProfile()?.rol
  if (rol !== 'oficial' && rol !== 'admin') {
    throw new Error('No tenés permisos para administrar móviles')
  }
}

export const getVehiculos = async () => {
  const { data, error } = await (supabase as any).from('vehiculos').select('*').order('nombre')
  if (error) throw error
  return data as Vehiculo[]
}

export const getVehiculoById = async (id: string) => {
  const { data, error } = await (supabase as any).from('vehiculos').select('*').eq('id', id).single()
  if (error) throw error
  return data as Vehiculo
}

export const getVehiculosDisponibles = async () => {
  const { data, error } = await (supabase as any).from('vehiculos').select('*').eq('estado', 'disponible').order('nombre')
  if (error) throw error
  return data as Vehiculo[]
}

export const createVehiculo = async (vehiculo: VehiculoCreate) => {
  assertOfficialOrAdmin()
  const { data, error } = await (supabase as any).from('vehiculos').insert([vehiculo]).select().single()
  if (error) throw error
  return data
}

export const updateVehiculo = async (id: string, updates: Partial<Vehiculo>) => {
  assertOfficialOrAdmin()
  const { data, error } = await (supabase as any).from('vehiculos').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const deleteVehiculo = async (id: string) => {
  assertOfficialOrAdmin()
  const { error } = await (supabase as any).from('vehiculos').delete().eq('id', id)
  if (error) throw error
}

