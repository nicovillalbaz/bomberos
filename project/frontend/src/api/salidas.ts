import { getSessionUserId, supabase } from '../lib/supabase'
import type { Salida, SalidaCreate } from '../types'

export const getSalidas = async (vehiculoId?: string) => {
  let query = (supabase as any)
    .from('salidas')
    .select('*, vehiculo:vehiculos(*), conductor:perfiles!conductor_id(*), autorizacion:perfiles!autorizacion_id(*)')
    .order('fecha_salida', { ascending: false })
  if (vehiculoId) query = query.eq('vehiculo_id', vehiculoId)
  const { data, error } = await query
  if (error) throw error
  return data as Salida[]
}

export const getSalidasByDateRange = async (desde?: string, hasta?: string) => {
  let query = (supabase as any)
    .from('salidas')
    .select('*, vehiculo:vehiculos(*), conductor:perfiles!conductor_id(*), autorizacion:perfiles!autorizacion_id(*)')
    .order('fecha_salida', { ascending: false })
  if (desde) query = query.gte('fecha_salida', desde)
  if (hasta) query = query.lte('fecha_salida', `${hasta}T23:59:59`)
  const { data, error } = await query
  if (error) throw error
  return data as Salida[]
}

export const getLastSalidaByVehiculo = async (vehiculoId: string) => {
  const { data, error } = await (supabase as any)
    .from('salidas')
    .select('*')
    .eq('vehiculo_id', vehiculoId)
    .not('km_llegada', 'is', null)
    .order('fecha_llegada', { ascending: false })
    .limit(1)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data as Salida | null
}

export const createSalida = async (salida: SalidaCreate) => {
  const actorId = getSessionUserId()
  if (!actorId) throw new Error('No hay sesión activa')

  const { data, error } = await (supabase as any)
    .from('salidas')
    .insert([{ ...salida, usuario_carga_id: actorId }])
    .select()
    .single()
  if (error) throw error
  return data
}

export const completeSalida = async (id: string, km_llegada: number) => {
  const { data, error } = await (supabase as any)
    .from('salidas')
    .update({ km_llegada, fecha_llegada: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateSalida = async (id: string, updates: Partial<Salida>) => {
  const { data, error } = await (supabase as any).from('salidas').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Salida
}
