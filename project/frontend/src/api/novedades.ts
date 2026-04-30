import { supabase } from '../lib/supabase'
import type { NovedadGlobal } from '../types'

export const getNovedades = async (limit = 50) => {
  const { data, error } = await (supabase as any)
    .from('novedades_global')
    .select('*, usuario:perfiles(nombre,apellido)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data as NovedadGlobal[]
}

export const getNovedadesByFecha = async (fecha?: string) => {
  let query = (supabase as any)
    .from('v_novedades_fecha')
    .select('*')
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })
  if (fecha) query = query.eq('fecha', fecha)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const createNovedadManual = async (novedad: { tipo: string; titulo: string; descripcion: string; modulo_origen?: string }) => {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('No user')
  const { data, error } = await (supabase as any)
    .from('novedades_global')
    .insert([{ ...novedad, usuario_id: userData.user.id, origen: 'manual' }])
    .select()
    .single()
  if (error) throw error
  return data
}

