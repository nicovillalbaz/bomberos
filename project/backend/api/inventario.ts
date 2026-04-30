// Inventario API - Inventory management
// Handles vehicle, company, and deposit inventory

import { supabase } from './client';
import type { 
  Material, 
  InventarioMovil, 
  InventarioMovilUpdate,
  InventarioCompania,
  InventarioDeposito,
  VInventarioGlobal 
} from './types';

// ============================================
// MATERIALES
// ============================================

export const getMateriales = async (): Promise<Material[]> => {
  const { data, error } = await supabase
    .from('materiales')
    .select('*')
    .order('nombre', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const createMaterial = async (nombre: string, categoria: string = 'general'): Promise<Material> => {
  const { data, error } = await supabase
    .from('materiales')
    .insert([{ nombre, categoria }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// ============================================
// INVENTARIO MÓVIL
// ============================================

export const getInventarioMovil = async (movil_id?: string): Promise<InventarioMovil[]> => {
  let query = supabase
    .from('inventario_movil')
    .select(`
      *,
      material:material_id(*),
      movil:movil_id(*)
    `)
    .order('updated_at', { ascending: false });

  if (movil_id) {
    query = query.eq('movil_id', movil_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const updateInventarioMovil = async (
  movil_id: string, 
  material_id: string, 
  cantidad: number
): Promise<InventarioMovil> => {
  // Check if record exists
  const { data: existing } = await supabase
    .from('inventario_movil')
    .select('id')
    .eq('movil_id', movil_id)
    .eq('material_id', material_id)
    .single();

  if (existing) {
    // Update
    const { data, error } = await supabase
      .from('inventario_movil')
      .update({ cantidad })
      .eq('id', existing.id)
      .select(`
        *,
        material:material_id(*),
        movil:movil_id(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Insert
    const { data, error } = await supabase
      .from('inventario_movil')
      .insert([{ movil_id, material_id, cantidad }])
      .select(`
        *,
        material:material_id(*),
        movil:movil_id(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }
};

export const incrementInventarioMovil = async (
  movil_id: string,
  material_id: string,
  amount: number = 1
): Promise<InventarioMovil> => {
  const current = await getInventarioMovil(movil_id);
  const item = current.find(i => i.material_id === material_id);
  const newCantidad = (item?.cantidad || 0) + amount;
  
  // Create novedad automatically
  await supabase
    .from('novedades_global')
    .insert([{
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0],
      usuario_id: (await supabase.auth.getUser()).data.user?.id,
      tipo: 'inventario',
      titulo: 'Actualización de inventario del móvil',
      descripcion: `Se actualizó inventario del móvil. Material: ${material_id}, cantidad: ${newCantidad}`,
      origen: 'automatico',
      modulo_origen: 'inventario_movil'
    }]);

  return updateInventarioMovil(movil_id, material_id, newCantidad);
};

// ============================================
// INVENTARIO COMPAÑÍA
// ============================================

export const getInventarioCompania = async (): Promise<InventarioCompania[]> => {
  const { data, error } = await supabase
    .from('inventario_compania')
    .select(`
      *,
      material:material_id(*)
    `)
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const updateInventarioCompania = async (
  material_id: string,
  cantidad: number
): Promise<InventarioCompania> => {
  const { data: existing } = await supabase
    .from('inventario_compania')
    .select('id')
    .eq('material_id', material_id)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('inventario_compania')
      .update({ cantidad })
      .eq('id', existing.id)
      .select(`
        *,
        material:material_id(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('inventario_compania')
      .insert([{ material_id, cantidad }])
      .select(`
        *,
        material:material_id(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// INVENTARIO DEPÓSITO
// ============================================

export const getInventarioDeposito = async (): Promise<InventarioDeposito[]> => {
  const { data, error } = await supabase
    .from('inventario_deposito')
    .select(`
      *,
      material:material_id(*)
    `)
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const updateInventarioDeposito = async (
  material_id: string,
  cantidad: number
): Promise<InventarioDeposito> => {
  const { data: existing } = await supabase
    .from('inventario_deposito')
    .select('id')
    .eq('material_id', material_id)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('inventario_deposito')
      .update({ cantidad })
      .eq('id', existing.id)
      .select(`
        *,
        material:material_id(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('inventario_deposito')
      .insert([{ material_id, cantidad }])
      .select(`
        *,
        material:material_id(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// INVENTARIO GLOBAL (VIEW)
// ============================================

export const getInventarioGlobal = async (): Promise<VInventarioGlobal[]> => {
  const { data, error } = await supabase
    .from('v_inventario_global')
    .select('*')
    .order('material', { ascending: true });
  
  if (error) throw error;
  return data;
};

// Get inventory report data
export const getInventarioReport = async (ubicacion?: string) => {
  const global = await getInventarioGlobal();
  
  if (ubicacion) {
    return global.filter(item => {
      if (ubicacion === 'moviles') return item.total_moviles > 0;
      if (ubicacion === 'compania') return item.total_compania > 0;
      if (ubicacion === 'deposito') return item.total_deposito > 0;
      return true;
    });
  }
  
  return global;
};
