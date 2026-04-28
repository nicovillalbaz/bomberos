// Servicios API - Services management
// Handles services (10.40, 10.41, etc.) and personnel

import { supabase } from './client';
import type { 
  Servicio, 
  ServicioCreate, 
  ServicioPersonal,
  ServicioPersonalCreate,
  TipoServicio,
  SubtipoServicio,
  EstadoServicio 
} from './types';

// ============================================
// SERVICIOS (SERVICES)
// ============================================

// Get all services with filters
export const getServicios = async (filters?: {
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo?: string;
  subtipo?: string;
  movil_id?: string;
  estado?: EstadoServicio;
}): Promise<Servicio[]> => {
  let query = supabase
    .from('servicios')
    .select(`
      *,
      movil:movil_id(*),
      conductor:conductor_id(*),
      autorizacion:autorizacion_id(*),
      cargador:usuario_carga_id(*),
      personal:servicio_personal(
        *,
        persona:persona_id(*)
      )
    `)
    .order('fecha', { ascending: false });

  if (filters?.fecha_inicio) {
    query = query.gte('fecha', filters.fecha_inicio);
  }
  if (filters?.fecha_fin) {
    query = query.lte('fecha', filters.fecha_fin);
  }
  if (filters?.tipo) {
    query = query.eq('tipo', filters.tipo);
  }
  if (filters?.subtipo) {
    query = query.eq('subtipo', filters.subtipo);
  }
  if (filters?.movil_id) {
    query = query.eq('movil_id', filters.movil_id);
  }
  if (filters?.estado) {
    query = query.eq('estado', filters.estado);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Get service by ID
export const getServicioById = async (id: string): Promise<Servicio> => {
  const { data, error } = await supabase
    .from('servicios')
    .select(`
      *,
      movil:movil_id(*),
      conductor:conductor_id(*),
      autorizacion:autorizacion_id(*),
      cargador:usuario_carga_id(*),
      personal:servicio_personal(
        *,
        persona:persona_id(*)
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Get draft services (pending completion)
export const getDraftServicios = async (): Promise<Servicio[]> => {
  return getServicios({ estado: 'borrador' });
};

// Get completed services (for reports)
export const getCompletedServicios = async (): Promise<Servicio[]> => {
  return getServicios({ estado: 'completo' });
};

// Create service (any active user)
export const createServicio = async (servicio: ServicioCreate): Promise<Servicio> => {
  const user = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('servicios')
    .insert([{
      ...servicio,
      fecha: servicio.fecha || new Date().toISOString().split('T')[0],
      usuario_carga_id: user.data.user?.id,
      estado: servicio.estado || 'borrador'
    }])
    .select()
    .single();
  
  if (error) throw error;

  // Add personnel if provided
  if (servicio.personal && servicio.personal.length > 0) {
    const personalData = servicio.personal.map(p => ({
      servicio_id: data.id,
      persona_id: p.persona_id,
      persona_nombre: p.persona_nombre,
      persona_codigo: p.persona_codigo,
      es_rentado: p.es_rentado || false
    }));

    const { error: personalError } = await supabase
      .from('servicio_personal')
      .insert(personalData);
    
    if (personalError) throw personalError;
  }

  // Create novedad if service is complete
  if (servicio.estado === 'completo') {
    await supabase
      .from('novedades_global')
      .insert([{
        fecha: servicio.fecha || new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0],
        usuario_id: user.data.user?.id,
        tipo: 'servicio',
        titulo: `Servicio registrado: ${servicio.tipo}`,
        descripcion: `Se registró servicio ${servicio.tipo} ${servicio.subtipo || ''} en ${servicio.lugar || 'zona no especificada'}`,
        origen: 'automatico',
        modulo_origen: 'servicios',
        entidad_relacionada: 'servicio',
        entidad_id: data.id
      }]);
  }

  return getServicioById(data.id);
};

// Update service (owner or official/admin)
export const updateServicio = async (id: string, updates: Partial<ServicioCreate>): Promise<Servicio> => {
  const { error } = await supabase
    .from('servicios')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
  return getServicioById(id);
};

// Complete draft service
export const completeServicio = async (id: string, updates: Partial<ServicioCreate>): Promise<Servicio> => {
  return updateServicio(id, { ...updates, estado: 'completo' });
};

// Delete service
export const deleteServicio = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('servicios')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============================================
// SERVICIO PERSONAL
// ============================================

export const addServicioPersonal = async (
  servicio_id: string, 
  personal: ServicioPersonalCreate
): Promise<ServicioPersonal> => {
  const { data, error } = await supabase
    .from('servicio_personal')
    .insert([{
      servicio_id,
      ...personal
    }])
    .select(`
      *,
      persona:persona_id(*)
    `)
    .single();
  
  if (error) throw error;
  return data;
};

export const removeServicioPersonal = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('servicio_personal')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============================================
// CATÁLOGOS: TIPOS Y SUBTIPOS
// ============================================

export const getTiposServicio = async (): Promise<TipoServicio[]> => {
  const { data, error } = await supabase
    .from('tipo_servicio')
    .select('*')
    .eq('activo', true)
    .order('codigo', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const getSubtiposServicio = async (tipo_servicio_id?: string): Promise<SubtipoServicio[]> => {
  let query = supabase
    .from('subtipo_servicio')
    .select(`
      *,
      tipo_servicio:tipo_servicio_id(*)
    `)
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (tipo_servicio_id) {
    query = query.eq('tipo_servicio_id', tipo_servicio_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getSubtiposByTipoServicio = async (codigo: string): Promise<SubtipoServicio[]> => {
  const { data, error } = await supabase
    .from('subtipo_servicio')
    .select(`
      *,
      tipo_servicio:tipo_servicio_id!inner(*)
    `)
    .eq('tipo_servicio.codigo', codigo)
    .eq('activo', true)
    .order('nombre', { ascending: true });
  
  if (error) throw error;
  return data;
};

// ============================================
// REPORTS
// ============================================

export const getServiciosByMonth = async (mes: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('v_servicios_mes')
    .select('*')
    .eq('mes', mes);
  
  if (error) throw error;
  return data;
};

export const getServiciosStats = async (fecha_inicio: string, fecha_fin: string) => {
  const servicios = await getServicios({ fecha_inicio, fecha_fin, estado: 'completo' });
  
  const stats = {
    total: servicios.length,
    por_tipo: {} as Record<string, number>,
    por_subtipo: {} as Record<string, number>
  };

  servicios.forEach(s => {
    stats.por_tipo[s.tipo] = (stats.por_tipo[s.tipo] || 0) + 1;
    if (s.subtipo) {
      stats.por_subtipo[s.subtipo] = (stats.por_subtipo[s.subtipo] || 0) + 1;
    }
  });

  return stats;
};
