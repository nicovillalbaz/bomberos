// Salidas API - Vehicle departures
// Handles vehicle departure (salida) operations

import { supabase } from './client';
import type { Salida, SalidaCreate } from './types';

// ============================================
// GET OPERATIONS
// ============================================

// Get all salidas with related data
export const getSalidas = async (filters?: {
  vehiculo_id?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  conductor_id?: string;
}): Promise<Salida[]> => {
  let query = supabase
    .from('salidas')
    .select(`
      *,
      vehiculo:vehiculos(*),
      conductor:conductor_id(*),
      autorizacion:autorizacion_id(*),
      cargador:usuario_carga_id(*)
    `)
    .order('fecha_salida', { ascending: false });

  if (filters?.vehiculo_id) {
    query = query.eq('vehiculo_id', filters.vehiculo_id);
  }
  if (filters?.fecha_inicio) {
    query = query.gte('fecha_salida', filters.fecha_inicio);
  }
  if (filters?.fecha_fin) {
    query = query.lte('fecha_salida', filters.fecha_fin);
  }
  if (filters?.conductor_id) {
    query = query.eq('conductor_id', filters.conductor_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get salida by ID
export const getSalidaById = async (id: string): Promise<Salida> => {
  const { data, error } = await supabase
    .from('salidas')
    .select(`
      *,
      vehiculo:vehiculos(*),
      conductor:conductor_id(*),
      autorizacion:autorizacion_id(*),
      cargador:usuario_carga_id(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Get last departure for a vehicle (for auto-filling km_salida)
export const getLastSalidaByVehiculo = async (vehiculo_id: string): Promise<Salida | null> => {
  const { data, error } = await supabase
    .from('salidas')
    .select('*')
    .eq('vehiculo_id', vehiculo_id)
    .order('fecha_salida', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data || null;
};

// Get salidas by month for reports
export const getSalidasByMonth = async (mes: string): Promise<Salida[]> => {
  const { data, error } = await supabase
    .from('salidas')
    .select(`
      *,
      vehiculo:vehiculos(nombre, dominio)
    `)
    .like('fecha_salida', `${mes}%`)
    .order('fecha_salida', { ascending: true });
  
  if (error) throw error;
  return data;
};

// ============================================
// CREATE/UPDATE OPERATIONS
// ============================================

// Create salida (any active user)
export const createSalida = async (salida: SalidaCreate): Promise<Salida> => {
  // Get last km for this vehicle if not provided
  if (!salida.km_salida) {
    const lastSalida = await getLastSalidaByVehiculo(salida.vehiculo_id);
    salida.km_salida = lastSalida?.km_llegada || 0;
  }

  const { data, error } = await supabase
    .from('salidas')
    .insert([{
      ...salida,
      fecha_salida: salida.fecha_salida || new Date().toISOString(),
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Update salida (official/admin)
export const updateSalida = async (id: string, updates: Partial<Salida>): Promise<Salida> => {
  const { data, error } = await supabase
    .from('salidas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Complete salida (add arrival info)
export const completeSalida = async (
  id: string, 
  km_llegada: number, 
  observacion?: string
): Promise<Salida> => {
  return updateSalida(id, { 
    km_llegada, 
    fecha_llegada: new Date().toISOString(),
    ...(observacion && { observacion })
  });
};

// ============================================
// DELETE OPERATIONS
// ============================================

// Delete salida (admin only)
export const deleteSalida = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('salidas')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
