import { useEffect, useState } from 'react'
import { getReporteServicios, getReporteSalidas, getReporteInventarioGlobal, exportToCSV } from '../../api/reportes'
import { getPreviousMonthRange } from '../../lib/datetime'
import { exportRowsToPrintablePDF } from '../../lib/export'

const modulos = [
  { id:'servicios', label:'Servicios' },
  { id:'salidas', label:'Salidas' },
  { id:'inventario_global', label:'Inventario Global' },
]

export default function Reportes() {
  const previousMonth = getPreviousMonthRange()
  const [modulo, setModulo] = useState('servicios')
  const [fechaInicio, setFechaInicio] = useState(previousMonth.desde)
  const [fechaFin, setFechaFin] = useState(previousMonth.hasta)
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv')

  const load = async () => {
    setLoading(true)
    try {
      const filtros = { fecha_inicio: fechaInicio||undefined, fecha_fin: fechaFin||undefined }
      if (modulo==='servicios') setData(await getReporteServicios(filtros))
      else if (modulo==='salidas') setData(await getReporteSalidas(filtros))
      else if (modulo==='inventario_global') setData(await getReporteInventarioGlobal())
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [modulo])

  const getPreviousMonthReportData = async () => {
    const { desde, hasta, monthValue } = getPreviousMonthRange()
    const filtros = { fecha_inicio: desde, fecha_fin: hasta }
    let exportData: any[] = []
    if (modulo==='servicios') exportData = await getReporteServicios(filtros)
    else if (modulo==='salidas') exportData = await getReporteSalidas(filtros)
    else if (modulo==='inventario_global') exportData = await getReporteInventarioGlobal()
    return { exportData, monthValue }
  }

  const handleExport = async () => {
    const { exportData, monthValue } = await getPreviousMonthReportData()
    if (exportFormat === 'pdf') {
      exportRowsToPrintablePDF(`${modulo} ${monthValue}`, exportData)
      return
    }
    exportToCSV(exportData, `${modulo}_${monthValue}.csv`)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reportes</h1>
      <div className="surface p-4 space-y-4">
        <div className="flex gap-4 items-end">
          <div><label className="text-sm">Módulo</label>
            <select value={modulo} onChange={e=>setModulo(e.target.value)} className="px-3 py-2 border rounded-lg">
              {modulos.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div><label className="text-sm">Desde</label><input type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} className="px-3 py-2 border rounded-lg" /></div>
          <div><label className="text-sm">Hasta</label><input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} className="px-3 py-2 border rounded-lg" /></div>
          <div><label className="text-sm">Formato</label>
            <select value={exportFormat} onChange={e=>setExportFormat(e.target.value as 'csv' | 'pdf')} className="px-3 py-2 border rounded-lg">
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          <button onClick={load} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Filtrar</button>
          <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-lg">Exportar</button>
        </div>
      </div>
      {loading ? <p>Cargando...</p> : (
        <div className="surface overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{data.length>0 && Object.keys(data[0]).map(k=><th key={k} className="p-2 text-left">{k}</th>)}</tr></thead>
            <tbody>{data.map((r,i)=><tr key={i} className="border-t">{Object.values(r).map((v:any,j)=><td key={j} className="p-2">{String(v||'')}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
