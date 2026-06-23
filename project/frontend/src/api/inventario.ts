import { getSessionUserId, supabase } from '../lib/supabase'
import type {
  InventarioDestinoTipo,
  InventarioMovimiento,
  InventarioMovil,
  InventarioOrigenTipo,
  InventarioUbicacionItem,
  Material,
} from '../types'

export const getMateriales = async () => {
  const { data, error } = await (supabase as any).from('materiales').select('*').order('categoria,nombre')
  if (error) throw error
  return data as Material[]
}

export const getInventarioMovil = async (movilId: string) => {
  const { data, error } = await (supabase as any)
    .from('inventario_movil')
    .select('*, material:materiales(*)')
    .eq('movil_id', movilId)
  if (error) throw error
  return data as InventarioMovil[]
}

export const updateInventarioMovil = async (movilId: string, materialId: string, cantidad: number) => {
  const actorId = getSessionUserId()
  const { data, error } = await (supabase as any)
    .from('inventario_movil')
    .upsert({ movil_id: movilId, material_id: materialId, cantidad, updated_by: actorId }, { onConflict: 'movil_id,material_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export const getInventarioGlobal = async () => {
  const { data, error } = await (supabase as any).from('v_inventario_global').select('*')
  if (error) throw error
  return data
}

export const getInventarioCompania = async () => {
  const { data, error } = await (supabase as any).from('inventario_compania').select('*, material:materiales(*)')
  if (error) throw error
  return data as InventarioUbicacionItem[]
}

export const getInventarioDeposito = async () => {
  const { data, error } = await (supabase as any).from('inventario_deposito').select('*, material:materiales(*)')
  if (error) throw error
  return data as InventarioUbicacionItem[]
}

export const transferirInventario = async (input: {
  material_id: string
  cantidad: number
  origen_tipo: InventarioOrigenTipo
  origen_ref?: string | null
  destino_tipo: InventarioDestinoTipo
  destino_ref?: string | null
  motivo?: string | null
  observacion?: string | null
}) => {
  const actorId = getSessionUserId()
  if (!actorId) throw new Error('No hay sesión activa')

  const { data, error } = await (supabase as any).rpc('transferir_inventario', {
    p_material_id: input.material_id,
    p_cantidad: input.cantidad,
    p_origen_tipo: input.origen_tipo,
    p_origen_ref: input.origen_ref ?? null,
    p_destino_tipo: input.destino_tipo,
    p_destino_ref: input.destino_ref ?? null,
    p_motivo: input.motivo ?? null,
    p_observacion: input.observacion ?? null,
    p_usuario_id: actorId,
  })
  if (error) throw error
  return data as string
}

export const getMovimientosInventario = async (filtros?: {
  material_id?: string
  fecha_desde?: string
  fecha_hasta?: string
  ubicacion?: 'deposito' | 'compania' | 'movil'
  usuario_id?: string
}) => {
  let query = (supabase as any).from('v_inventario_movimientos').select('*').order('created_at', { ascending: false })
  if (filtros?.material_id) query = query.eq('material_id', filtros.material_id)
  if (filtros?.fecha_desde) query = query.gte('created_at', filtros.fecha_desde)
  if (filtros?.fecha_hasta) query = query.lte('created_at', `${filtros.fecha_hasta}T23:59:59`)
  if (filtros?.usuario_id) query = query.eq('usuario_id', filtros.usuario_id)
  if (filtros?.ubicacion) query = query.or(`origen_tipo.eq.${filtros.ubicacion},destino_tipo.eq.${filtros.ubicacion}`)

  const { data, error } = await query
  if (error) throw error
  return data as InventarioMovimiento[]
}
