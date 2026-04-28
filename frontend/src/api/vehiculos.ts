import { supabase } from '../lib/supabase'
import type { Vehiculo, VehiculoCreate } from '../types'

export const getVehiculos = async () => {
  const { data, error } = await supabase.from('vehiculos').select('*').order('nombre')
  if (error) throw error
  return data as Vehiculo[]
}

export const getVehiculoById = async (id: string) => {
  const { data, error } = await supabase.from('vehiculos').select('*').eq('id', id).single()
  if (error) throw error
  return data as Vehiculo
}

export const getVehiculosDisponibles = async () => {
  const { data, error } = await supabase.from('vehiculos').select('*').eq('estado', 'disponible').order('nombre')
  if (error) throw error
  return data as Vehiculo[]
}

export const createVehiculo = async (vehiculo: VehiculoCreate) => {
  const { data, error } = await supabase.from('vehiculos').insert(vehiculo).select().single()
  if (error) throw error
  return data
}

export const updateVehiculo = async (id: string, updates: Partial<Vehiculo>) => {
  const { data, error } = await supabase.from('vehiculos').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const deleteVehiculo = async (id: string) => {
  const { error } = await supabase.from('vehiculos').delete().eq('id', id)
  if (error) throw error
}
