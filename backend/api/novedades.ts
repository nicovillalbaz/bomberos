// Novedades API - Global news/events management
// Handles manual and automatic news creation

import { supabase } from './client';
import type { 
  NovedadGlobal, 
  NovedadGlobalCreate, 
  VNovadedesFecha 
} from './types';

// ============================================
// GET OPERATIONS
// ============================================

// Get all novedades with filters
export const getNovedades = async (filters?: {
  fecha_inicio?: string;
  fecha_fin?: string;
  usuario_id?: string;
  modulo_origen?: string;
  origen?: string;
  search?: string;
}): Promise<NovedadGlobal[]> => {
  let query = supabase
    .from('novedades_global')
    .select(`
      *,
      usuario:usuario_id(*)
    `)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false });

  if (filters?.fecha_inicio) {
    query = query.gte('fecha', filters.fecha_inicio);
  }
  if (filters?.fecha_fin) {
    query = query.lte('fecha', filters.fecha_fin);
  }
  if (filters?.usuario_id) {
    query = query.eq('usuario_id', filters.usuario_id);
  }
  if (filters?.modulo_origen) {
    query = query.eq('modulo_origen', filters.modulo_origen);
  }
  if (filters?.origen) {
    query = query.eq('origen', filters.origen);
  }
  if (filters?.search) {
    query = query.or(`titulo.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get novedad by ID
export const getNovedadById = async (id: string): Promise<NovedadGlobal> => {
  const { data, error } = await supabase
    .from('novedades_global')
    .select(`
      *,
      usuario:usuario_id(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Get novedades by date (using view)
export const getNovedadesByFecha = async (fecha?: string): Promise<VNovadedesFecha[]> => {
  let query = supabase
    .from('v_novedades_fecha')
    .select('*');

  if (fecha) {
    query = query.eq('fecha', fecha);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get novedades by module origin
export const getNovedadesByModulo = async (modulo: string, limit?: number): Promise<NovedadGlobal[]> => {
  let query = supabase
    .from('novedades_global')
    .select(`
      *,
      usuario:usuario_id(*)
    `)
    .eq('modulo_origen', modulo)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get novedades timeline (for main view)
export const getNovedadesTimeline = async (limit: number = 50): Promise<NovedadGlobal[]> => {
  return getNovedades({}).then(data => data.slice(0, limit));
};

// ============================================
// CREATE OPERATIONS
// ============================================

// Create manual novedad (any active user)
export const createNovedadManual = async (novedad: NovedadGlobalCreate): Promise<NovedadGlobal> => {
  const user = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('novedades_global')
    .insert([{
      ...novedad,
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0],
      usuario_id: user.data.user?.id,
      origen: 'manual'
    }])
    .select(`
      *,
      usuario:usuario_id(*)
    `)
    .single();
  
  if (error) throw error;
  return data;
};

// Quick novedad creation helpers
export const createNovedadIngreso = async (): Promise<NovedadGlobal> => {
  const user = await supabase.auth.getUser();
  const profile = await supabase
    .from('perfiles')
    .select('nombre, apellido')
    .eq('id', user.data.user?.id)
    .single();

  return createNovedadManual({
    tipo: 'ingreso',
    titulo: 'Ingreso a la compañía',
    descripcion: `${profile.data?.nombre} ${profile.data?.apellido} ingresó a la compañía.`,
    modulo_origen: 'guardia'
  });
};

export const createNovedadSalida = async (): Promise<NovedadGlobal> => {
  const user = await supabase.auth.getUser();
  const profile = await supabase
    .from('perfiles')
    .select('nombre, apellido')
    .eq('id', user.data.user?.id)
    .single();

  return createNovedadManual({
    tipo: 'salida',
    titulo: 'Salida de la compañía',
    descripcion: `${profile.data?.nombre} ${profile.data?.apellido} se retiró de la compañía.`,
    modulo_origen: 'guardia'
  });
};

export const createNovedadAccion = async (accion: string, observaciones?: string): Promise<NovedadGlobal> => {
  const user = await supabase.auth.getUser();
  const profile = await supabase
    .from('perfiles')
    .select('nombre, apellido')
    .eq('id', user.data.user?.id)
    .single();

  return createNovedadManual({
    tipo: 'accion',
    titulo: `Acción realizada: ${accion}`,
    descripcion: observaciones || `${profile.data?.nombre} ${profile.data?.apellido} realizó: ${accion}`,
    modulo_origen: 'guardia'
  });
};

// ============================================
// UPDATE OPERATIONS
// ============================================

// Update novedad (admin only - trigger handles history)
export const updateNovedad = async (id: string, updates: Partial<NovedadGlobal>): Promise<NovedadGlobal> => {
  const { data, error } = await supabase
    .from('novedades_global')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      usuario:usuario_id(*)
    `)
    .single();
  
  if (error) throw error;
  return data;
};

// ============================================
// DELETE OPERATIONS
// ============================================

// Delete novedad (admin only)
export const deleteNovedad = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('novedades_global')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============================================
// STATISTICS
// ============================================

// Get novedades statistics
export const getNovedadesStats = async (fecha_inicio: string, fecha_fin: string) => {
  const novedades = await getNovedades({ fecha_inicio, fecha_fin });
  
  const stats = {
    total: novedades.length,
    por_tipo: {} as Record<string, number>,
    por_modulo: {} as Record<string, number>,
    manuales: 0,
    automaticas: 0
  };

  novedades.forEach(n => {
    stats.por_tipo[n.tipo] = (stats.por_tipo[n.tipo] || 0) + 1;
    if (n.modulo_origen) {
      stats.por_modulo[n.modulo_origen] = (stats.por_modulo[n.modulo_origen] || 0) + 1;
    }
    if (n.origen === 'manual') stats.manuales++;
    if (n.origen === 'automatico') stats.automaticas++;
  });

  return stats;
};

// Get latest novedades (for dashboard)
export const getLatestNovedades = async (count: number = 10): Promise<NovedadGlobal[]> => {
  const { data, error } = await supabase
    .from('novedades_global')
    .select(`
      *,
      usuario:usuario_id(nombre, apellido)
    `)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })
    .limit(count);
  
  if (error) throw error;
  return data;
};
