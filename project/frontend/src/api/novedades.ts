import { getSessionUserId, getSessionProfile, supabase } from '../lib/supabase'
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

export const createNovedadManual = async (novedad: { tipo: string; titulo: string; descripcion: string; modulo_origen?: string }) => {
  const actorId = getSessionUserId()
  if (!actorId) throw new Error('No hay sesion activa')

  const { data, error } = await (supabase as any)
    .from('novedades_global')
    .insert([
      {
        ...novedad,
        usuario_id: actorId,
        origen: 'manual',
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0],
      },
    ])
    .select()
    .single()
  if (error) throw error
  return data
}

export const createNovedadIngresoRetiroCompania = async (accion: 'ingreso' | 'retiro') => {
  const actorId = getSessionUserId()
  if (!actorId) throw new Error('No hay sesión activa')
  const actor = getSessionProfile()
  const actorLabel = actor ? `${actor.nombre} ${actor.apellido}` : 'Usuario'
  const ahora = new Date()
  const titulo = accion === 'ingreso' ? 'Ingresé en la compañía' : 'Me retiro de la compañía'
  const descripcion = accion === 'ingreso'
    ? `${actorLabel} se registró el ingreso a la compañía.`
    : `${actorLabel} se registró el retiro de la compañía.`

  const { data, error } = await (supabase as any)
    .from('novedades_global')
    .insert([{
      tipo: 'personal',
      titulo,
      descripcion,
      modulo_origen: 'dashboard',
      usuario_id: actorId,
      origen: 'automatico',
      fecha: ahora.toISOString().split('T')[0],
      hora: ahora.toTimeString().split(' ')[0],
    }])
    .select()
    .single()
  if (error) throw error
  return data as NovedadGlobal
}
