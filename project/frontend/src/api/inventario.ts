import { getSessionUserId, supabase } from '../lib/supabase'
import type { InventarioMovil, Material } from '../types'

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
  return data
}

export const getInventarioDeposito = async () => {
  const { data, error } = await (supabase as any).from('inventario_deposito').select('*, material:materiales(*)')
  if (error) throw error
  return data
}
