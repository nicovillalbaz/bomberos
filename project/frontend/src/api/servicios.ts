import { supabase } from '../lib/supabase'
import type { Servicio, ServicioCreate, ServicioPersonalCreate } from '../types'

export const getServicios = async (estado?: string) => {
  let query = supabase
    .from('servicios')
    .select('*, movil:vehiculos(*), conductor:perfiles!conductor_id(*), autorizacion:perfiles!autorizacion_id(*), personal:servicio_personal(*, persona:perfiles(*))')
    .order('fecha', { ascending: false })
  if (estado) query = query.eq('estado', estado)
  const { data, error } = await query
  if (error) throw error
  return data as Servicio[]
}

export const getServicioById = async (id: string) => {
  const { data, error } = await supabase
    .from('servicios')
    .select('*, movil:vehiculos(*), conductor:perfiles!conductor_id(*), autorizacion:perfiles!autorizacion_id(*), personal:servicio_personal(*, persona:perfiles(*))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Servicio
}

export const createServicio = async (servicio: ServicioCreate) => {
  const { personal, ...servicioData } = servicio
  const { data, error } = await (supabase as any).from('servicios').insert([servicioData]).select().single()
  if (error) throw error
  if (personal && personal.length > 0) {
    const personalData = personal.map((p: ServicioPersonalCreate) => ({ servicio_id: (data as any).id, ...p }))
    await (supabase as any).from('servicio_personal').insert(personalData)
  }
  return data
}

export const updateServicio = async (id: string, updates: Partial<Servicio>) => {
  const { data, error } = await (supabase as any).from('servicios').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const getTiposServicio = async () => {
  const { data, error } = await (supabase as any).from('tipo_servicio').select('*').eq('activo', true)
  if (error) throw error
  return data
}

export const getSubtiposServicio = async (tipoServicioId?: string) => {
  let query = (supabase as any).from('subtipo_servicio').select('*, tipo_servicio:tipo_servicio_id(*)').eq('activo', true)
  if (tipoServicioId) query = query.eq('tipo_servicio_id', tipoServicioId)
  const { data, error } = await query
  if (error) throw error
  return data
}

