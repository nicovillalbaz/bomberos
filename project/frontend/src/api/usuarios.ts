import { getSessionProfile, supabase } from '../lib/supabase'
import type { Perfil, PerfilCreate } from '../types'

const assertAdmin = () => {
  if (getSessionProfile()?.rol !== 'admin') {
    throw new Error('No tenés permisos para administrar usuarios')
  }
}

export const getPerfiles = async () => {
  const { data, error } = await (supabase as any).from('perfiles').select('*').order('apellido')
  if (error) throw error
  return data as Perfil[]
}

export const getActiveProfiles = async () => {
  const { data, error } = await (supabase as any).from('perfiles').select('*').eq('estado', 'activo').order('apellido')
  if (error) throw error
  return data as Perfil[]
}

export const getPerfilById = async (id: string) => {
  const { data, error } = await (supabase as any).from('perfiles').select('*').eq('id', id).single()
  if (error) throw error
  return data as Perfil
}

export const getConductores = async () => {
  const { data, error } = await (supabase as any).from('perfiles').select('*').eq('es_conductor_habilitado', true).eq('estado', 'activo')
  if (error) throw error
  return data as Perfil[]
}

export const getOficiales = async () => {
  const { data, error } = await (supabase as any).from('perfiles').select('*').eq('es_oficial_autorizante', true).eq('estado', 'activo')
  if (error) throw error
  return data as Perfil[]
}

export const createPerfil = async (perfil: PerfilCreate) => {
  assertAdmin()

  const { data: createdId, error } = await (supabase as any).rpc('create_perfil', {
    p_nombre: perfil.nombre,
    p_apellido: perfil.apellido,
    p_email: perfil.email,
    p_password: perfil.password,
    p_rol: perfil.rol || 'bombero',
    p_estado: perfil.estado || 'activo',
  })
  if (error) throw error

  const { data, error: updateError } = await (supabase as any)
    .from('perfiles')
    .update({
      codigo_interno: perfil.codigo_interno || null,
      es_conductor_habilitado: Boolean(perfil.es_conductor_habilitado),
      es_oficial_autorizante: Boolean(perfil.es_oficial_autorizante),
    })
    .eq('id', createdId)
    .select()
    .single()
  if (updateError) throw updateError

  return data as Perfil
}

export const updatePerfil = async (id: string, updates: Partial<Perfil>) => {
  assertAdmin()
  const { data, error } = await (supabase as any).from('perfiles').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Perfil
}

export const toggleUserStatus = async (id: string, estado: 'activo' | 'inactivo') => {
  assertAdmin()
  const { data, error } = await (supabase as any).from('perfiles').update({ estado }).eq('id', id).select().single()
  if (error) throw error
  return data as Perfil
}
