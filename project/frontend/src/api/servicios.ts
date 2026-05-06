import { getSessionUserId, supabase } from '../lib/supabase'
import type { Servicio, ServicioCreate, ServicioPersonal, ServicioPersonalCreate } from '../types'

const servicioSelect = `
  *,
  movil:vehiculos(*),
  a_cargo:perfiles!a_cargo_id(*),
  conductor:perfiles!conductor_id(*),
  autorizacion:perfiles!autorizacion_id(*),
  personal:servicio_personal(*, persona:perfiles(*))
`

export const getServicios = async (estado?: string) => {
  let query = (supabase as any)
    .from('servicios')
    .select(servicioSelect)
    .order('fecha', { ascending: false })
  if (estado) query = query.eq('estado', estado)
  const { data, error } = await query
  if (error) throw error
  return data as Servicio[]
}

export const getServiciosByDateRange = async (
  estado?: string,
  fechaDesde?: string,
  fechaHasta?: string,
  tipo?: string,
) => {
  let query = (supabase as any)
    .from('servicios')
    .select(servicioSelect)
    .order('fecha', { ascending: false })
  if (estado) query = query.eq('estado', estado)
  if (tipo) query = query.eq('tipo', tipo)
  if (fechaDesde) query = query.gte('fecha', fechaDesde)
  if (fechaHasta) query = query.lte('fecha', fechaHasta)
  const { data, error } = await query
  if (error) throw error
  return data as Servicio[]
}

export const getServiciosByTipo = async (tipo: string, estado?: string) => {
  return getServiciosByDateRange(estado, undefined, undefined, tipo)
}

export const getServiciosByFilters = async (filtros?: {
  estado?: string
  tipo?: string
  fechaDesde?: string
  fechaHasta?: string
}) => {
  let query = (supabase as any)
    .from('servicios')
    .select(servicioSelect)
    .order('fecha', { ascending: false })
  if (filtros?.estado) query = query.eq('estado', filtros.estado)
  if (filtros?.tipo) query = query.eq('tipo', filtros.tipo)
  if (filtros?.fechaDesde) query = query.gte('fecha', filtros.fechaDesde)
  if (filtros?.fechaHasta) query = query.lte('fecha', filtros.fechaHasta)
  const { data, error } = await query
  if (error) throw error
  return data as Servicio[]
}

export const createServicio = async (servicio: ServicioCreate) => {
  const actorId = getSessionUserId()
  if (!actorId) throw new Error('No hay sesion activa')

  const { personal, ...servicioData } = servicio
  const { data, error } = await (supabase as any)
    .from('servicios')
    .insert([{ ...servicioData, usuario_carga_id: actorId }])
    .select()
    .single()
  if (error) throw error

  if (personal && personal.length > 0) {
    const personalData = personal.map((p: ServicioPersonalCreate) => ({
      servicio_id: (data as any).id,
      ...p,
    }))
    await (supabase as any).from('servicio_personal').insert(personalData)
  }
  return data
}

export const updateServicio = async (id: string, updates: Partial<Servicio>) => {
  const { data, error } = await (supabase as any)
    .from('servicios')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const getServicioById = async (id: string) => {
  const { data, error } = await (supabase as any)
    .from('servicios')
    .select(servicioSelect)
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Servicio
}

export const setServicioPersonal = async (
  servicioId: string,
  miembros: Array<{ persona_id: string; rol_en_servicio?: ServicioPersonal['rol_en_servicio'] }>,
) => {
  const { error: delError } = await (supabase as any)
    .from('servicio_personal')
    .delete()
    .eq('servicio_id', servicioId)
  if (delError) throw delError

  if (!miembros.length) return

  const personalData = miembros.map((m) => ({
    servicio_id: servicioId,
    persona_id: m.persona_id,
    es_rentado: false,
    rol_en_servicio: m.rol_en_servicio || 'miembro',
  }))
  const { error: insError } = await (supabase as any).from('servicio_personal').insert(personalData)
  if (insError) throw insError
}

export const getTiposServicio = async () => {
  const { data, error } = await (supabase as any).from('tipo_servicio').select('*').eq('activo', true)
  if (error) throw error
  return data
}

export const getSubtiposServicio = async (tipoServicioId?: string) => {
  let query = (supabase as any)
    .from('subtipo_servicio')
    .select('*, tipo_servicio:tipo_servicio_id(*)')
    .eq('activo', true)
  if (tipoServicioId) query = query.eq('tipo_servicio_id', tipoServicioId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getMotivosSalidaServicio = async () => {
  const { data, error } = await (supabase as any)
    .from('motivo_salida')
    .select('*')
    .eq('activo', true)
    .eq('es_servicio', true)
    .order('nombre')
  if (error) throw error
  return data as Array<{ id: string; nombre: string }>
}
