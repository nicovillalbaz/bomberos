// Reportes API - Reports and exports
// Handles all reporting functionality and CSV exports

import { supabase } from './client';
import type { 
  Servicio, 
  Salida, 
  VInventarioGlobal,
  VSalidasMes,
  VServiciosMes,
  VAsistenciaGuardia,
  VNovedadesFecha,
  ReportFilter 
} from './types';

// ============================================
// GENERIC REPORT FUNCTION
// ============================================

export type ModuloReporte = 
  | 'servicios' 
  | 'salidas' 
  | 'inventario_global' 
  | 'inventario_movil'
  | 'inventario_compania'
  | 'inventario_deposito'
  | 'guardias'
  | 'asistencia'
  | 'novedades_global'
  | 'novedades_movil';

// Get report data by module
export const getReporte = async (
  modulo: ModuloReporte,
  filters?: ReportFilter
) => {
  switch (modulo) {
    case 'servicios':
      return getReporteServicios(filters);
    case 'salidas':
      return getReporteSalidas(filters);
    case 'inventario_global':
      return getReporteInventarioGlobal(filters);
    case 'inventario_movil':
      return getReporteInventarioMovil(filters);
    case 'inventario_compania':
      return getReporteInventarioCompania(filters);
    case 'inventario_deposito':
      return getReporteInventarioDeposito(filters);
    case 'guardias':
      return getReporteGuardias(filters);
    case 'asistencia':
      return getReporteAsistencia(filters);
    case 'novedades_global':
      return getReporteNovedades(filters);
    case 'novedades_movil':
      return getReporteNovedadesMovil(filters);
    default:
      throw new Error(`MÃ³dulo ${modulo} no soportado`);
  }
};

// ============================================
// SPECIFIC REPORT FUNCTIONS
// ============================================

// Services report
export const getReporteServicios = async (filters?: ReportFilter): Promise<Servicio[]> => {
  let query = supabase
    .from('servicios')
    .select(`
      *,
      movil:movil_id(nombre, dominio),
      conductor:conductor_id(nombre, apellido),
      autorizacion:autorizacion_id(nombre, apellido),
      cargador:usuario_carga_id(nombre, apellido)
    `)
    .eq('estado', 'completo')
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

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Departures report
export const getReporteSalidas = async (filters?: ReportFilter): Promise<Salida[]> => {
  let query = supabase
    .from('salidas')
    .select(`
      *,
      vehiculo:vehiculos(nombre, dominio),
      conductor:conductor_id(nombre, apellido),
      autorizacion:autorizacion_id(nombre, apellido),
      cargador:usuario_carga_id(nombre, apellido)
    `)
    .order('fecha_salida', { ascending: false });

  if (filters?.fecha_inicio) {
    query = query.gte('fecha_salida', filters.fecha_inicio);
  }
  if (filters?.fecha_fin) {
    query = query.lte('fecha_salida', filters.fecha_fin);
  }
  if (filters?.vehiculo_id) {
    query = query.eq('vehiculo_id', filters.vehiculo_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Global inventory report
export const getReporteInventarioGlobal = async (filters?: ReportFilter): Promise<VInventarioGlobal[]> => {
  const { data, error } = await supabase
    .from('v_inventario_global')
    .select('*')
    .order('material', { ascending: true });

  if (error) throw error;

  let filtered = data;

  if (filters?.ubicacion) {
    filtered = filtered.filter(item => {
      if (filters.ubicacion === 'moviles') return item.total_moviles > 0;
      if (filters.ubicacion === 'compania') return item.total_compania > 0;
      if (filters.ubicacion === 'deposito') return item.total_deposito > 0;
      return true;
    });
  }

  if (filters?.cantidad_min) {
    filtered = filtered.filter(item => item.total_general >= filters.cantidad_min);
  }
  if (filters?.cantidad_max) {
    filtered = filtered.filter(item => item.total_general <= filters.cantidad_max);
  }

  return filtered;
};

// Vehicle inventory report
export const getReporteInventarioMovil = async (movil_id?: string) => {
  let query = supabase
    .from('v_inventario_por_movil')
    .select('*')
    .order('movil', { ascending: true })
    .order('material', { ascending: true });

  if (movil_id) {
    query = query.eq('movil', movil_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Company inventory report
export const getReporteInventarioCompania = async () => {
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

// Deposit inventory report
export const getReporteInventarioDeposito = async () => {
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

// Shifts report
export const getReporteGuardias = async (filters?: ReportFilter) => {
  let query = supabase
    .from('guardias')
    .select(`
      *,
      a_cargo:a_cargo_id(nombre, apellido),
      conductor:conductor_id(nombre, apellido)
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
  return data;
};

// Attendance report
export const getReporteAsistencia = async (filters?: ReportFilter) => {
  let query = supabase
    .from('v_asistencia_guardia')
    .select('*');

  if (filters?.fecha_inicio) {
    query = query.gte('fecha', filters.fecha_inicio);
  }
  if (filters?.fecha_fin) {
    query = query.lte('fecha', filters.fecha_fin);
  }
  if (filters?.tipo_guardia) {
    query = query.eq('tipo_guardia', filters.tipo_guardia);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Global news report
export const getReporteNovedades = async (filters?: ReportFilter) => {
  return supabase
    .from('novedades_global')
    .select(`
      *,
      usuario:usuario_id(nombre, apellido)
    `)
    .order('fecha', { ascending: false })
    .order('hora', { ascending: false })
    .then(({ data, error }) => {
      if (error) throw error;
      return data;
    });
};

// Vehicle news report
export const getReporteNovedadesMovil = async (movil_id?: string) => {
  let query = supabase
    .from('novedades_movil')
    .select(`
      *,
      movil:movil_id(nombre),
      usuario:usuario_id(nombre, apellido)
    `)
    .order('created_at', { ascending: false });

  if (movil_id) {
    query = query.eq('movil_id', movil_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// ============================================
// MONTHLY REPORTS (USING VIEWS)
// ============================================

export const getReporteServiciosPorMes = async (mes?: string): Promise<VServiciosMes[]> => {
  let query = supabase
    .from('v_servicios_mes')
    .select('*')
    .order('mes', { ascending: false });

  if (mes) {
    query = query.eq('mes', mes);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getReporteSalidasPorMes = async (mes?: string): Promise<VSalidasMes[]> => {
  let query = supabase
    .from('v_salidas_mes')
    .select('*')
    .order('mes', { ascending: false });

  if (mes) {
    query = query.eq('mes', mes);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// ============================================
// CSV EXPORT
// ============================================

// Convert array of objects to CSV string
const toCSV = (data: any[], columns?: string[]): string => {
  if (data.length === 0) return '';

  const headers = columns || Object.keys(data[0]);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Handle nested objects and escape commas/quotes
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

// Export report to CSV
export const exportReporteToCSV = async (
  modulo: ModuloReporte,
  filters?: ReportFilter,
  filename?: string
): Promise<string> => {
  const data = await getReporte(modulo, filters);
  
  // Flatten nested objects for CSV
  const flattened = data.map((item: any) => {
    const flat: any = {};
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Handle nested objects like {nombre, apellido}
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          flat[`${key}_${nestedKey}`] = nestedValue;
        }
      } else {
        flat[key] = value;
      }
    }
    return flat;
  });

  const csv = toCSV(flattened);
  return csv;
};

// Download CSV file
export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Quick export functions
export const exportServiciosCSV = async (filters?: ReportFilter) => {
  const csv = await exportReporteToCSV('servicios', filters);
  downloadCSV(csv, `servicios_${new Date().toISOString().split('T')[0]}`);
};

export const exportSalidasCSV = async (filters?: ReportFilter) => {
  const csv = await exportReporteToCSV('salidas', filters);
  downloadCSV(csv, `salidas_${new Date().toISOString().split('T')[0]}`);
};

export const exportInventarioCSV = async () => {
  const csv = await exportReporteToCSV('inventario_global');
  downloadCSV(csv, `inventario_global_${new Date().toISOString().split('T')[0]}`);
};

// ============================================
// REPORT SUMMARIES (FOR DASHBOARD CARDS)
// ============================================

export const getReporteSummary = async (modulo: ModuloReporte, filters?: ReportFilter) => {
  const data = await getReporte(modulo, filters);
  
  switch (modulo) {
    case 'servicios':
      return {
        total: data.length,
        por_tipo: data.reduce((acc: any, item: any) => {
          acc[item.tipo] = (acc[item.tipo] || 0) + 1;
          return acc;
        }, {})
      };
    case 'salidas':
      return {
        total: data.length,
        total_km: data.reduce((sum: number, item: any) => sum + (item.km_recorridos || 0), 0),
        total_combustible: data.reduce((sum: number, item: any) => sum + (item.monto_combustible || 0), 0)
      };
    case 'inventario_global':
      return {
        total_materiales: data.length,
        total_general: data.reduce((sum: number, item: any) => sum + item.total_general, 0)
      };
    default:
      return { total: data.length };
  }
};

