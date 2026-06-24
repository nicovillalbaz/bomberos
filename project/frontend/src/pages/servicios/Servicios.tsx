import { useEffect, useMemo, useState } from 'react'
import type { Perfil, Servicio, ServicioPersonalCreate } from '../../types'
import { createServicio, getMotivosSalidaServicio, getServiciosByDateRange, updateServicio } from '../../api/servicios'
import { getActiveProfiles } from '../../api/usuarios'
import { getVehiculosDisponibles } from '../../api/vehiculos'
import { exportRowsToCSV, exportRowsToPrintablePDF } from '../../lib/export'
import { formatDateOnly, getMonthRange, toMonthInputValue } from '../../lib/datetime'

type RentadoForm = { nombre: string; codigo: string }

const initialRentado: RentadoForm = { nombre: '', codigo: '' }

const getPersonalRentadoLabel = (servicio: Servicio, rol: 'a_cargo' | 'conductor') => {
  const item = (servicio.personal || []).find((p) => p.es_rentado && p.rol_en_servicio === rol)
  return item ? [item.persona_nombre, item.persona_codigo].filter(Boolean).join(' - ') : ''
}

const getServicioACargoLabel = (servicio: Servicio) =>
  servicio.a_cargo ? `${servicio.a_cargo.nombre} ${servicio.a_cargo.apellido}` : getPersonalRentadoLabel(servicio, 'a_cargo')

const getServicioConductorLabel = (servicio: Servicio) =>
  servicio.conductor
    ? `${servicio.conductor.nombre} ${servicio.conductor.apellido}`
    : [servicio.conductor_rentado_nombre, servicio.conductor_rentado_codigo].filter(Boolean).join(' - ')

export default function Servicios() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [tab, setTab] = useState<'borrador' | 'completo'>('borrador')
  const [showForm, setShowForm] = useState(false)
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [motivos, setMotivos] = useState<Array<{ id: string; nombre: string }>>([])
  const [periodMonth, setPeriodMonth] = useState(toMonthInputValue())
  const [miembroSearch, setMiembroSearch] = useState('')
  const [form, setForm] = useState({
    fecha: '',
    tipo: '',
    lugar: '',
    descripcion: '',
    movil_id: '',
    a_cargo_id: '',
    a_cargo_rentado_nombre: '',
    a_cargo_rentado_codigo: '',
    conductor_id: '',
    conductor_rentado_nombre: '',
    conductor_rentado_codigo: '',
    miembros: [] as string[],
    rentados: [] as RentadoForm[],
    rentadoActual: initialRentado,
    estado: 'borrador' as 'borrador' | 'completo',
  })

  const isACargoRentado = form.a_cargo_id === 'rentado'
  const isConductorRentado = form.conductor_id === 'rentado'

  const perfilesFiltrados = useMemo(() => {
    const needle = miembroSearch.toLowerCase()
    return perfiles.filter((p) => `${p.nombre} ${p.apellido}`.toLowerCase().includes(needle))
  }, [perfiles, miembroSearch])

  const load = async () => {
    const { desde, hasta } = getMonthRange(periodMonth)
    const data = await getServiciosByDateRange(tab, desde, hasta)
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

  useEffect(() => { load() }, [tab, periodMonth])
  useEffect(() => { loadAux() }, [])

  const toggleMiembro = (miembroId: string) => {
    setForm((prev) => ({
      ...prev,
      miembros: prev.miembros.includes(miembroId)
        ? prev.miembros.filter((id) => id !== miembroId)
        : [...prev.miembros, miembroId],
    }))
  }

  const addRentado = () => {
    const nombre = form.rentadoActual.nombre.trim()
    const codigo = form.rentadoActual.codigo.trim()
    if (!nombre || !codigo) return
    setForm((prev) => ({
      ...prev,
      rentados: [...prev.rentados, { nombre, codigo }],
      rentadoActual: initialRentado,
    }))
  }

  const removeRentado = (index: number) => {
    setForm((prev) => ({
      ...prev,
      rentados: prev.rentados.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const personal: ServicioPersonalCreate[] = form.miembros
      .filter((id) => id !== form.a_cargo_id && id !== form.conductor_id)
      .map((id) => ({
      persona_id: id,
      es_rentado: false,
      rol_en_servicio: 'miembro' as const,
    }))
    if (isACargoRentado) {
      personal.push({
        persona_nombre: form.a_cargo_rentado_nombre,
        persona_codigo: form.a_cargo_rentado_codigo,
        es_rentado: true,
        rol_en_servicio: 'a_cargo' as const,
      })
    } else if (form.a_cargo_id) {
      personal.push({ persona_id: form.a_cargo_id, es_rentado: false, rol_en_servicio: 'a_cargo' as const })
    }
    if (isConductorRentado) {
      personal.push({
        persona_nombre: form.conductor_rentado_nombre,
        persona_codigo: form.conductor_rentado_codigo,
        es_rentado: true,
        rol_en_servicio: 'conductor' as const,
      })
    } else if (form.conductor_id) {
      personal.push({ persona_id: form.conductor_id, es_rentado: false, rol_en_servicio: 'conductor' as const })
    }
    form.rentados.forEach((rentado) => {
      personal.push({
        persona_nombre: rentado.nombre,
        persona_codigo: rentado.codigo,
        es_rentado: true,
        rol_en_servicio: 'miembro' as const,
      })
    })

    await createServicio({
      fecha: form.fecha || new Date().toISOString(),
      tipo: form.tipo,
      lugar: form.lugar || null,
      descripcion: form.descripcion || null,
      movil_id: form.movil_id || null,
      estado: form.estado,
      personal,
      a_cargo_id: isACargoRentado ? null : (form.a_cargo_id || null),
      conductor_id: isConductorRentado ? null : (form.conductor_id || null),
      conductor_rentado_nombre: isConductorRentado ? form.conductor_rentado_nombre : null,
      conductor_rentado_codigo: isConductorRentado ? form.conductor_rentado_codigo : null,
    })
    setShowForm(false)
    setMiembroSearch('')
    setForm({
      fecha: '',
      tipo: '',
      lugar: '',
      descripcion: '',
      movil_id: '',
      a_cargo_id: '',
      a_cargo_rentado_nombre: '',
      a_cargo_rentado_codigo: '',
      conductor_id: '',
      conductor_rentado_nombre: '',
      conductor_rentado_codigo: '',
      miembros: [],
      rentados: [],
      rentadoActual: initialRentado,
      estado: 'borrador',
    })
    load()
  }

  const handleComplete = async (id: string) => {
    await updateServicio(id, { estado: 'completo' })
    load()
  }

  const getPreviousMonthServiceSummaryRows = async () => {
    const { desde, hasta } = getMonthRange(periodMonth)
    const data = await getServiciosByDateRange('completo', desde, hasta)
    const serviciosMes = data.filter((s) => s.tipo !== 'citacion' && s.tipo !== 'practica')
    const grouped = serviciosMes.reduce<Record<string, number>>((acc, servicio) => {
      acc[servicio.tipo] = (acc[servicio.tipo] || 0) + 1
      return acc
    }, {})
    const rows = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tipo, total]) => ({ tipo, total }))

    return { rows: [...rows, { tipo: 'TOTAL', total: serviciosMes.length }], monthValue: periodMonth }
  }

  const getPreviousMonthServiceDetailRows = async () => {
    const { desde, hasta } = getMonthRange(periodMonth)
    const data = await getServiciosByDateRange('completo', desde, hasta)
    const rows = data
      .filter((s) => s.tipo !== 'citacion' && s.tipo !== 'practica')
      .map((s) => ({
        fecha: formatDateOnly(s.fecha),
        tipo: s.tipo,
        lugar: s.lugar ?? '',
        movil: s.movil?.nombre ?? '',
        a_cargo: getServicioACargoLabel(s),
        conductor: getServicioConductorLabel(s),
        descripcion: s.descripcion ?? '',
      }))

    return { rows, monthValue: periodMonth }
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

  const handleResumenExport = async (format: 'csv' | 'pdf') => {
    if (format === 'pdf') {
      await exportResumenPDF()
      return
    }
    await exportResumenCSV()
  }

  const handleServiciosMesExport = async (format: 'csv' | 'pdf') => {
    if (format === 'pdf') {
      await exportServiciosMesPDF()
      return
    }
    await exportServiciosMesCSV()
  }

  if (showForm) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Nuevo servicio</h1>
          <p className="text-sm text-gray-500">Cargá fecha, motivo, móvil y participantes.</p>
        </div>

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
              <option value="rentado">Rentado</option>
            </select>
            <select value={form.conductor_id} onChange={(e) => setForm({ ...form, conductor_id: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">Conductor</option>
              {perfiles.filter((p) => p.es_conductor_habilitado).map((p) => <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              <option value="rentado">Rentado</option>
            </select>
            {isACargoRentado && (
              <>
                <input required placeholder="Nombre a cargo rentado" value={form.a_cargo_rentado_nombre} onChange={(e) => setForm({ ...form, a_cargo_rentado_nombre: e.target.value })} className="px-3 py-2 border rounded-lg" />
                <input required placeholder="Código a cargo rentado" value={form.a_cargo_rentado_codigo} onChange={(e) => setForm({ ...form, a_cargo_rentado_codigo: e.target.value })} className="px-3 py-2 border rounded-lg" />
              </>
            )}
            {isConductorRentado && (
              <>
                <input required placeholder="Nombre conductor rentado" value={form.conductor_rentado_nombre} onChange={(e) => setForm({ ...form, conductor_rentado_nombre: e.target.value })} className="px-3 py-2 border rounded-lg" />
                <input required placeholder="Código conductor rentado" value={form.conductor_rentado_codigo} onChange={(e) => setForm({ ...form, conductor_rentado_codigo: e.target.value })} className="px-3 py-2 border rounded-lg" />
              </>
            )}
            <div className="sm:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <label className="text-sm font-medium">Miembros</label>
                <input placeholder="Buscar miembro" value={miembroSearch} onChange={(e) => setMiembroSearch(e.target.value)} className="px-3 py-2 border rounded-lg sm:ml-auto sm:w-64" />
              </div>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {perfilesFiltrados.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.miembros.includes(p.id)} onChange={() => toggleMiembro(p.id)} />
                    <span>{p.nombre} {p.apellido}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Seleccionados: {form.miembros.length}</p>
            </div>
            <div className="sm:col-span-2 border rounded-lg p-3 space-y-3">
              <p className="text-sm font-medium">Miembros rentados</p>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                <input placeholder="Nombre rentado" value={form.rentadoActual.nombre} onChange={(e) => setForm({ ...form, rentadoActual: { ...form.rentadoActual, nombre: e.target.value } })} className="px-3 py-2 border rounded-lg" />
                <input placeholder="Código rentado" value={form.rentadoActual.codigo} onChange={(e) => setForm({ ...form, rentadoActual: { ...form.rentadoActual, codigo: e.target.value } })} className="px-3 py-2 border rounded-lg" />
                <button type="button" onClick={addRentado} className="px-3 py-2 bg-gray-200 rounded-lg">Agregar</button>
              </div>
              {form.rentados.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.rentados.map((rentado, index) => (
                    <button key={`${rentado.codigo}-${index}`} type="button" onClick={() => removeRentado(index)} className="px-2 py-1 rounded bg-gray-100 text-xs">
                      {rentado.nombre} - {rentado.codigo} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
            <textarea placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="px-3 py-2 border rounded-lg sm:col-span-2" />
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Crear</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <h1 className="text-2xl font-bold">Servicios</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={load} className="px-3 py-2 bg-gray-200 rounded-lg">Filtrar</button>
          <button onClick={() => handleResumenExport('csv')} className="px-3 py-2 bg-green-600 text-white rounded-lg">Resumen CSV</button>
          <button onClick={() => handleResumenExport('pdf')} className="px-3 py-2 bg-slate-700 text-white rounded-lg">Resumen PDF</button>
          <button onClick={() => handleServiciosMesExport('csv')} className="px-3 py-2 bg-green-700 text-white rounded-lg">Detalle CSV</button>
          <button onClick={() => handleServiciosMesExport('pdf')} className="px-3 py-2 bg-slate-800 text-white rounded-lg">Detalle PDF</button>
          <button onClick={() => { setShowForm(true); loadAux() }} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Nuevo servicio</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 surface p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Mes del reporte</span>
          <input type="month" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value || toMonthInputValue())} className="px-3 py-2 border rounded-lg" />
        </label>
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
              <td className="p-2">{getServicioACargoLabel(s) || '-'}</td>
              <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${s.estado === 'completo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{s.estado}</span></td>
              <td className="p-2">{s.estado === 'borrador' && <button onClick={() => handleComplete(s.id)} className="text-green-600 text-xs">Completar</button>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
