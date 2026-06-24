import { getSessionProfile, getSessionUserId, supabase } from '../lib/supabase'
import type { Asistencia, AsistenciaCreate, Guardia, GuardiaCreate } from '../types'

const assertOfficialOrAdmin = () => {
  const rol = getSessionProfile()?.rol
  if (rol !== 'oficial' && rol !== 'admin') {
    throw new Error('No tenés permisos para administrar guardias')
  }
}

export const getGuardias = async (fecha?: string, fechaDesde?: string, fechaHasta?: string) => {
  let query = (supabase as any)
    .from('guardias')
    .select('*, a_cargo:perfiles!a_cargo_id(*), conductor:perfiles!conductor_id(*), miembros:guardia_miembros(miembro:perfiles(*))')
    .order('fecha', { ascending: false })
  if (fecha) query = query.eq('fecha', fecha)
  if (fechaDesde) query = query.gte('fecha', fechaDesde)
  if (fechaHasta) query = query.lte('fecha', fechaHasta)
  const { data, error } = await query
  if (error) throw error
  return data as (Guardia & { miembros: { miembro: any }[] })[]
}

export const createGuardia = async (guardia: GuardiaCreate) => {
  assertOfficialOrAdmin()
  const actorId = getSessionUserId()
  if (!actorId) throw new Error('No hay sesión activa')

  const { miembros, ...guardiaData } = guardia
  const { data, error } = await (supabase as any)
    .from('guardias')
    .insert([{ ...guardiaData, created_by: actorId }])
    .select()
    .single()
  if (error) throw error

  if (miembros && miembros.length > 0) {
    const miembrosData = miembros.map((m: string) => ({ guardia_id: (data as any).id, miembro_id: m }))
    await (supabase as any).from('guardia_miembros').insert(miembrosData)
  }
  return data
}

export const createMultipleGuardias = async (guardias: GuardiaCreate[]) => {
  assertOfficialOrAdmin()
  const created: Guardia[] = []
  for (const guardia of guardias) {
    const data = await createGuardia(guardia)
    created.push(data as Guardia)
  }
  return created
}

export const markAsistencia = async (asistencia: AsistenciaCreate) => {
  const actorId = getSessionUserId()
  if (!actorId) throw new Error('No hay sesión activa')

  const { data, error } = await (supabase as any)
    .from('asistencia')
    .insert([{ ...asistencia, usuario_id: actorId }])
    .select()
    .single()
  if (error) throw error
  return data
}

export const getAsistencias = async (guardiaId?: string) => {
  let query = (supabase as any)
    .from('asistencia')
    .select('*, usuario:perfiles(*), guardia:guardias(*)')
    .order('created_at', { ascending: false })
  if (guardiaId) query = query.eq('guardia_id', guardiaId)
  const { data, error } = await query
  if (error) throw error
  return data as Asistencia[]
}

export const getAsistenciasForGuardias = async (guardiaIds: string[]) => {
  if (guardiaIds.length === 0) return [] as Asistencia[]

  const { data, error } = await (supabase as any)
    .from('asistencia')
    .select('*, usuario:perfiles(*), guardia:guardias(*)')
    .in('guardia_id', guardiaIds)
    .eq('tipo', 'asistencia_guardia')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Asistencia[]
}

export const setGuardiaAttendanceOverride = async (
  guardiaId: string,
  usuarioId: string,
  estado: 'auto' | 'presente' | 'ausente',
) => {
  assertOfficialOrAdmin()
  const actorId = getSessionUserId()
  if (!actorId) throw new Error('No hay sesión activa')

  const accion = `asistencia_guardia_manual_${estado}`
  const { data, error } = await (supabase as any)
    .from('asistencia')
    .insert([{
      usuario_id: usuarioId,
      guardia_id: guardiaId,
      tipo: 'asistencia_guardia',
      accion,
      observaciones: `Ajuste manual registrado por ${actorId}`,
    }])
    .select()
    .single()

  if (error) throw error
  return data as Asistencia
}
