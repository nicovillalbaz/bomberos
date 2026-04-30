import { supabase } from '../lib/supabase'
import type { Guardia, GuardiaCreate, Asistencia, AsistenciaCreate } from '../types'

export const getGuardias = async (fecha?: string) => {
  let query = supabase
    .from('guardias')
    .select('*, a_cargo:perfiles!a_cargo_id(*), conductor:perfiles!conductor_id(*), miembros:guardia_miembros(miembro:perfiles(*))')
    .order('fecha', { ascending: false })
  if (fecha) query = query.eq('fecha', fecha)
  const { data, error } = await query
  if (error) throw error
  return data as (Guardia & { miembros: { miembro: any }[] })[]
}

export const getGuardiaById = async (id: string) => {
  const { data, error } = await supabase
    .from('guardias')
    .select('*, a_cargo:perfiles!a_cargo_id(*), conductor:perfiles!conductor_id(*), miembros:guardia_miembros(miembro:perfiles(*))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const createGuardia = async (guardia: GuardiaCreate) => {
  const { miembros, ...guardiaData } = guardia
  const { data, error } = await (supabase as any).from('guardias').insert([guardiaData]).select().single()
  if (error) throw error
  if (miembros && miembros.length > 0) {
    const miembrosData = miembros.map((m: string) => ({ guardia_id: (data as any).id, miembro_id: m }))
    await (supabase as any).from('guardia_miembros').insert(miembrosData)
  }
  return data
}

export const markAsistencia = async (asistencia: AsistenciaCreate) => {
  const { data, error } = await (supabase as any).from('asistencia').insert([asistencia]).select().single()
  if (error) throw error
  return data
}

export const getAsistencias = async (guardiaId?: string) => {
  let query = supabase
    .from('asistencia')
    .select('*, usuario:perfiles(*), guardia:guardias(*)')
    .order('created_at', { ascending: false })
  if (guardiaId) query = query.eq('guardia_id', guardiaId)
  const { data, error } = await query
  if (error) throw error
  return data as Asistencia[]
}

