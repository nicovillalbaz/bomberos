import { useEffect, useMemo, useState } from 'react'
import type { Perfil, Servicio, ServicioPersonalCreate } from '../../types'
import { createServicio, getMotivosSalidaServicio, getServiciosByDateRange, updateServicio } from '../../api/servicios'
import { getActiveProfiles } from '../../api/usuarios'
import { getVehiculosDisponibles } from '../../api/vehiculos'
import { exportRowsToCSV, exportRowsToPrintablePDF } from '../../lib/export'
import { formatDateOnly, getPreviousMonthRange } from '../../lib/datetime'

export default function Servicios() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [tab, setTab] = useState<'borrador' | 'completo'>('borrador')
  const [showForm, setShowForm] = useState(false)
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [motivos, setMotivos] = useState<Array<{ id: string; nombre: string }>>([])
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [miembroSearch, setMiembroSearch] = useState('')
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv')
  const [form, setForm] = useState({
    fecha: '',
    tipo: '',
    lugar: '',
    descripcion: '',
    movil_id: '',
    a_cargo_id: '',
    conductor_id: '',
    miembros: [] as string[],
    estado: 'borrador' as 'borrador' | 'completo',
  })

  const perfilesFiltrados = useMemo(() => {
    const needle = miembroSearch.toLowerCase()
    return perfiles.filter((p) => `${p.nombre} ${p.apellido}`.toLowerCase().includes(needle))
  }, [perfiles, miembroSearch])

  const load = async () => {
    const data = await getServiciosByDateRange(tab, fechaDesde || undefined, fechaHasta || undefined)
    setServicios(
      data.filter((s) => s.tipo !== 'citacion' && s.tipo !== 'practica')
    )
  }

  const loadAux = async () => {
    const [p, v, m] = await Promise.all([getActiveProfiles(), getVehiculosDisponibles(), getMotivosSalidaServicio()])
    setPerfiles(p)
    setVehiculos(v)
    setMotivos(m)
  }

  useEffect(() => { load() }, [tab])
  useEffect(() => { loadAux() }, [])

  const toggleMiembro = (miembroId: string) => {
    setForm((prev) => ({
      ...prev,
      miembros: prev.miembros.includes(miembroId)
        ? prev.miembros.filter((id) => id !== miembroId)
        : [...prev.miembros, miembroId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const personal: ServicioPersonalCreate[] = form.miembros.map((id) => ({
      persona_id: id,
      es_rentado: false,
      rol_en_servicio: 'miembro' as const,
    }))
    if (form.a_cargo_id) personal.push({ persona_id: form.a_cargo_id, es_rentado: false, rol_en_servicio: 'a_cargo' as const })
    if (form.conductor_id) personal.push({ persona_id: form.conductor_id, es_rentado: false, rol_en_servicio: 'conductor' as const })

    await createServicio({
      ...form,
      fecha: form.fecha || new Date().toISOString(),
      personal,
      a_cargo_id: form.a_cargo_id || null,
      conductor_id: form.conductor_id || null,
    })
    setShowForm(false)
    setMiembroSearch('')
    setForm({ fecha: '', tipo: '', lugar: '', descripcion: '', movil_id: '', a_cargo_id: '', conductor_id: '', miembros: [], estado: 'borrador' })
    load()
  }

  const handleComplete = async (id: string) => {
    await updateServicio(id, { estado: 'completo' })
    load()
  }

  const getPreviousMonthServiceSummaryRows = async () => {
    const { desde, hasta, monthValue } = getPreviousMonthRange()
    const data = await getServiciosByDateRange('completo', desde, hasta)
    const serviciosMes = data.filter((s) => s.tipo !== 'citacion' && s.tipo !== 'practica')
    const grouped = serviciosMes.reduce<Record<string, number>>((acc, servicio) => {
      acc[servicio.tipo] = (acc[servicio.tipo] || 0) + 1
      return acc
    }, {})
    const rows = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tipo, total]) => ({ tipo, total }))

    return { rows: [...rows, { tipo: 'TOTAL', total: serviciosMes.length }], monthValue }
  }

  const getPreviousMonthServiceDetailRows = async () => {
    const { desde, hasta, monthValue } = getPreviousMonthRange()
    const data = await getServiciosByDateRange('completo', desde, hasta)
    const rows = data
      .filter((s) => s.tipo !== 'citacion' && s.tipo !== 'practica')
      .map((s) => ({
        fecha: formatDateOnly(s.fecha),
        tipo: s.tipo,
        lugar: s.lugar ?? '',
        movil: s.movil?.nombre ?? '',
        a_cargo: s.a_cargo ? `${s.a_cargo.nombre} ${s.a_cargo.apellido}` : '',
        conductor: s.conductor ? `${s.conductor.nombre} ${s.conductor.apellido}` : (s.conductor_rentado_nombre ?? ''),
        descripcion: s.descripcion ?? '',
      }))

    return { rows, monthValue }
  }

  const exportResumenCSV = async () => {
    const { rows, monthValue } = await getPreviousMonthServiceSummaryRows()
    exportRowsToCSV(rows, `resumen_servicios_${monthValue}.csv`)
  }

  const exportResumenPDF = async () => {
    const { rows, monthValue } = await getPreviousMonthServiceSummaryRows()
    exportRowsToPrintablePDF(`Resumen servicios ${monthValue}`, rows)
  }

  const exportServiciosMesCSV = async () => {
    const { rows, monthValue } = await getPreviousMonthServiceDetailRows()
    exportRowsToCSV(rows, `servicios_mes_${monthValue}.csv`)
  }

  const exportServiciosMesPDF = async () => {
    const { rows, monthValue } = await getPreviousMonthServiceDetailRows()
    exportRowsToPrintablePDF(`Servicios mes anterior ${monthValue}`, rows)
  }

  const handleResumenExport = async () => {
    if (exportFormat === 'pdf') {
      await exportResumenPDF()
      return
    }
    await exportResumenCSV()
  }

  const handleServiciosMesExport = async () => {
    if (exportFormat === 'pdf') {
      await exportServiciosMesPDF()
      return
    }
    await exportServiciosMesCSV()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <h1 className="text-2xl font-bold">Servicios</h1>
        <div className="flex flex-wrap gap-2">
          <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')} className="px-3 py-2 border rounded-lg">
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
          <button onClick={load} className="px-3 py-2 bg-gray-200 rounded-lg">Filtrar</button>
          <button onClick={handleResumenExport} className="px-3 py-2 bg-green-600 text-white rounded-lg">Exportar resumen</button>
          <button onClick={handleServiciosMesExport} className="px-3 py-2 bg-slate-700 text-white rounded-lg">Exportar servicios</button>
          <button onClick={() => { setShowForm(true); loadAux() }} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Nuevo servicio</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 surface p-4">
        <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="px-3 py-2 border rounded-lg" />
        <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="px-3 py-2 border rounded-lg" />
      </div>

      <div className="flex gap-4">
        {(['borrador', 'completo'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
          >
            {t === 'borrador' ? 'Borradores' : 'Completos'}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="surface p-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <select required value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">Motivo de salida</option>
              {motivos.map((m) => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
            </select>
            <input placeholder="Lugar" value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <select value={form.movil_id} onChange={(e) => setForm({ ...form, movil_id: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">Sin vehículo</option>
              {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
            <select value={form.a_cargo_id} onChange={(e) => setForm({ ...form, a_cargo_id: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">A cargo</option>
              {perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
            <select value={form.conductor_id} onChange={(e) => setForm({ ...form, conductor_id: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">Conductor</option>
              {perfiles.filter((p) => p.es_conductor_habilitado).map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
            <div className="sm:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <label className="text-sm font-medium">Miembros</label>
                <input
                  placeholder="Buscar miembro"
                  value={miembroSearch}
                  onChange={(e) => setMiembroSearch(e.target.value)}
                  className="px-3 py-2 border rounded-lg sm:ml-auto sm:w-64"
                />
              </div>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {perfilesFiltrados.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.miembros.includes(p.id)}
                      onChange={() => toggleMiembro(p.id)}
                    />
                    <span>{p.nombre} {p.apellido}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Seleccionados: {form.miembros.length}</p>
            </div>
            <textarea
              placeholder="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="px-3 py-2 border rounded-lg sm:col-span-2"
            />
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Crear</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="surface overflow-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="bg-gray-50">
            <tr><th className="p-2 text-left">Fecha</th><th>Tipo</th><th>Lugar</th><th>Vehículo</th><th>A cargo</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>{servicios.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-2">{formatDateOnly(s.fecha)}</td>
              <td className="p-2">{s.tipo}</td>
              <td className="p-2">{s.lugar}</td>
              <td className="p-2">{s.movil?.nombre || '-'}</td>
              <td className="p-2">{s.a_cargo ? `${s.a_cargo.nombre} ${s.a_cargo.apellido}` : '-'}</td>
              <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${s.estado === 'completo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{s.estado}</span></td>
              <td className="p-2">{s.estado === 'borrador' && <button onClick={() => handleComplete(s.id)} className="text-green-600 text-xs">Completar</button>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
