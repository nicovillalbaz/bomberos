import { supabase } from '../lib/supabase'

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))
  ].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

export const getReporteServicios = async (filtros?: { fecha_inicio?: string; fecha_fin?: string }) => {
  let query = (supabase as any).from('v_servicios_detallados').select('*')
  if (filtros?.fecha_inicio) query = query.gte('fecha', filtros.fecha_inicio)
  if (filtros?.fecha_fin) query = query.lte('fecha', filtros.fecha_fin)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getReporteSalidas = async (filtros?: { fecha_inicio?: string; fecha_fin?: string }) => {
  let query = (supabase as any).from('v_salidas_detalladas').select('*')
  if (filtros?.fecha_inicio) query = query.gte('fecha_salida', filtros.fecha_inicio)
  if (filtros?.fecha_fin) query = query.lte('fecha_salida', filtros.fecha_fin)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getReporteInventarioGlobal = async () => {
  const { data, error } = await (supabase as any).from('v_inventario_global').select('*')
  if (error) throw error
  return data
}

