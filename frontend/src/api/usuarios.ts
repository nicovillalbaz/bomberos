import { supabase } from '../lib/supabase'
import type { Perfil, PerfilCreate } from '../types'

export const getPerfiles = async () => {
  const { data, error } = await supabase.from('perfiles').select('*').order('apellido')
  if (error) throw error
  return data as Perfil[]
}

export const getActiveProfiles = async () => {
  const { data, error } = await supabase.from('perfiles').select('*').eq('estado', 'activo').order('apellido')
  if (error) throw error
  return data as Perfil[]
}

export const getPerfilById = async (id: string) => {
  const { data, error } = await supabase.from('perfiles').select('*').eq('id', id).single()
  if (error) throw error
  return data as Perfil
}

export const getConductores = async () => {
  const { data, error } = await supabase.from('perfiles').select('*').eq('es_conductor_habilitado', true).eq('estado', 'activo')
  if (error) throw error
  return data as Perfil[]
}

export const getOficiales = async () => {
  const { data, error } = await supabase.from('perfiles').select('*').eq('es_oficial_autorizante', true).eq('estado', 'activo')
  if (error) throw error
  return data as Perfil[]
}

export const createPerfil = async (perfil: PerfilCreate) => {
  const { data, error } = await supabase.from('perfiles').insert(perfil).select().single()
  if (error) throw error
  return data
}

export const updatePerfil = async (id: string, updates: Partial<Perfil>) => {
  const { data, error } = await supabase.from('perfiles').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const toggleUserStatus = async (id: string, estado: 'activo' | 'inactivo') => {
  const { data, error } = await supabase.from('perfiles').update({ estado }).eq('id', id).select().single()
  if (error) throw error
  return data
}
