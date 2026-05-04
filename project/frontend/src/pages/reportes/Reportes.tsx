import { useEffect, useState } from 'react'
import { getReporteServicios, getReporteSalidas, getReporteInventarioGlobal, exportToCSV } from '../../api/reportes'

const modulos = [
  { id:'servicios', label:'Servicios' },
  { id:'salidas', label:'Salidas' },
  { id:'inventario_global', label:'Inventario Global' },
]

export default function Reportes() {
  const [modulo, setModulo] = useState('servicios')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

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

  const handleExport = () => {
    exportToCSV(data, `${modulo}_${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reportes</h1>
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex gap-4 items-end">
          <div><label className="text-sm">Módulo</label>
            <select value={modulo} onChange={e=>setModulo(e.target.value)} className="px-3 py-2 border rounded-lg">
              {modulos.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div><label className="text-sm">Desde</label><input type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} className="px-3 py-2 border rounded-lg" /></div>
          <div><label className="text-sm">Hasta</label><input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} className="px-3 py-2 border rounded-lg" /></div>
          <button onClick={load} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Filtrar</button>
          <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-lg">Exportar CSV</button>
        </div>
      </div>
      {loading ? <p>Cargando...</p> : (
        <div className="bg-white rounded-lg shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{data.length>0 && Object.keys(data[0]).map(k=><th key={k} className="p-2 text-left">{k}</th>)}</tr></thead>
            <tbody>{data.map((r,i)=><tr key={i} className="border-t">{Object.values(r).map((v:any,j)=><td key={j} className="p-2">{String(v||'')}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

