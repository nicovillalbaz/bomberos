// Guardias API - Shifts and attendance management
// Handles guard creation, members, and attendance

import { supabase } from './client';
import type { 
  Guardia, 
  GuardiaCreate, 
  Asistencia, 
  AsistenciaCreate,
  TipoAccion,
  TipoGuardia 
} from './types';

// ============================================
// GUARDIAS (SHIFTS)
// ============================================

// Get all guardias
export const getGuardias = async (filters?: {
  fecha_inicio?: string;
  fecha_fin?: string;
  tipo?: TipoGuardia;
}): Promise<Guardia[]> => {
  let query = supabase
    .from('guardias')
    .select(`
      *,
      a_cargo:a_cargo_id(*),
      conductor:conductor_id(*),
      miembros:guardia_miembros(
        miembro:miembro_id(*)
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

  const { data, error } = await query;
  if (error) throw error;
  
  // Transform to include miembros array
  return data.map((item: any) => ({
    ...item,
    miembros: item.miembros?.map((m: any) => m.miembro) || []
  }));
};

// Get guardia by ID
export const getGuardiaById = async (id: string): Promise<Guardia> => {
  const { data, error } = await supabase
    .from('guardias')
    .select(`
      *,
      a_cargo:a_cargo_id(*),
      conductor:conductor_id(*),
      miembros:guardia_miembros(
        miembro:miembro_id(*)
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  
  return {
    ...data,
    miembros: data.miembros?.map((m: any) => m.miembro) || []
  };
};

// Get guardias for a specific date
export const getGuardiaByFecha = async (fecha: string): Promise<Guardia[]> => {
  const { data, error } = await supabase
    .from('guardias')
    .select(`
      *,
      a_cargo:a_cargo_id(*),
      conductor:conductor_id(*)
    `)
    .eq('fecha', fecha);
  
  if (error) throw error;
  return data;
};

// Create guardia (official/admin)
export const createGuardia = async (guardia: GuardiaCreate): Promise<Guardia> => {
  const { data: guardiaData, error: guardiaError } = await supabase
    .from('guardias')
    .insert([{
      fecha: guardia.fecha,
      tipo: guardia.tipo || 'voluntaria',
      hora_inicio: guardia.hora_inicio,
      hora_fin: guardia.hora_fin,
      a_cargo_id: guardia.a_cargo_id,
      conductor_id: guardia.conductor_id,
      conductor_rentado_nombre: guardia.conductor_rentado_nombre,
      conductor_rentado_codigo: guardia.conductor_rentado_codigo,
      es_rentado: guardia.es_rentado || false
    }])
    .select()
    .single();
  
  if (guardiaError) throw guardiaError;

  // Add members if provided
  if (guardia.miembros && guardia.miembros.length > 0) {
    const miembrosData = guardia.miembros.map(miembro_id => ({
      guardia_id: guardiaData.id,
      miembro_id
    }));

    const { error: miembrosError } = await supabase
      .from('guardia_miembros')
      .insert(miembrosData);
    
    if (miembrosError) throw miembrosError;
  }

  return getGuardiaById(guardiaData.id);
};

// Update guardia (official/admin)
export const updateGuardia = async (id: string, updates: Partial<GuardiaCreate>): Promise<Guardia> => {
  const { error } = await supabase
    .from('guardias')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
  return getGuardiaById(id);
};

// Delete guardia (official/admin)
export const deleteGuardia = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('guardias')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// ============================================
// ASISTENCIA (ATTENDANCE)
// ============================================

// Mark attendance (any active user)
export const markAsistencia = async (asistencia: AsistenciaCreate): Promise<Asistencia> => {
  const user = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('asistencia')
    .insert([{
      usuario_id: user.data.user?.id,
      tipo: asistencia.tipo,
      accion: asistencia.accion,
      observaciones: asistencia.observaciones,
      guardia_id: asistencia.guardia_id
    }])
    .select(`
      *,
      usuario:usuario_id(*),
      guardia:guardia_id(*)
    `)
    .single();
  
  if (error) throw error;

  // Create automatic novedad
  await supabase
    .from('novedades_global')
    .insert([{
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0],
      usuario_id: user.data.user?.id,
      tipo: 'asistencia',
      titulo: asistencia.accion === 'asistencia_guardia' ? 'Asistencia a guardia' : asistencia.accion,
      descripcion: `Usuario marcó ${asistencia.accion}`,
      origen: 'automatico',
      modulo_origen: 'guardia'
    }]);

  return data;
};

// Mark entry to company
export const markEntry = async (): Promise<Asistencia> => {
  return markAsistencia({
    tipo: 'ingreso',
    accion: 'ingreso'
  });
};

// Mark exit from company
export const markExit = async (): Promise<Asistencia> => {
  return markAsistencia({
    tipo: 'salida',
    accion: 'salida'
  });
};

// Mark guardia attendance
export const markGuardiaAttendance = async (guardia_id?: string): Promise<Asistencia> => {
  return markAsistencia({
    tipo: 'asistencia_guardia',
    accion: 'asistencia_guardia',
    guardia_id
  });
};

// Mark action performed
export const markActionPerformed = async (accion: string, observaciones?: string): Promise<Asistencia> => {
  return markAsistencia({
    tipo: 'accion_realizada',
    accion,
    observaciones
  });
};

// Get attendance records
export const getAsistencias = async (filters?: {
  usuario_id?: string;
  guardia_id?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}): Promise<Asistencia[]> => {
  let query = supabase
    .from('asistencia')
    .select(`
      *,
      usuario:usuario_id(*),
      guardia:guardia_id(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.usuario_id) {
    query = query.eq('usuario_id', filters.usuario_id);
  }
  if (filters?.guardia_id) {
    query = query.eq('guardia_id', filters.guardia_id);
  }
  if (filters?.fecha_inicio) {
    query = query.gte('created_at', filters.fecha_inicio);
  }
  if (filters?.fecha_fin) {
    query = query.lte('created_at', filters.fecha_fin);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Calculate shift times based on type and date
export const calculateShiftTimes = (
  fecha: string, 
  tipo: TipoGuardia
): { hora_inicio: string; hora_fin: string } => {
  const date = new Date(fecha);
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  if (tipo === 'voluntaria') {
    if (day === 0) { // Sunday
      return { hora_inicio: '14:00', hora_fin: '06:00' };
    } else if (day === 6) { // Saturday
      return { hora_inicio: '20:00', hora_fin: '14:00' };
    } else { // Monday to Friday
      return { hora_inicio: '22:00', hora_fin: '06:00' };
    }
  } else { // rentada
    if (day === 6) { // Saturday
      return { hora_inicio: '07:00', hora_fin: '15:00' };
    } else { // Monday to Friday
      return { hora_inicio: '07:00', hora_fin: '18:00' };
    }
  }
};
