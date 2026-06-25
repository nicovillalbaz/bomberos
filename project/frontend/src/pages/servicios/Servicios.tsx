import { useEffect, useMemo, useState } from 'react'
import type { Perfil, Servicio, ServicioPersonalCreate } from '../../types'
import { createServicio, getMotivosSalidaServicio, getServiciosByDateRange } from '../../api/servicios'
import { getActiveProfiles } from '../../api/usuarios'
import { getVehiculosDisponibles } from '../../api/vehiculos'
import { exportRowsToCSV, exportRowsToPrintablePDF } from '../../lib/export'
import { formatDateOnly, getMonthRange, toMonthInputValue } from '../../lib/datetime'
import SearchableSelect, { type SearchableSelectOption } from '../../components/SearchableSelect'

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
  const [showForm, setShowForm] = useState(false)
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [motivos, setMotivos] = useState<Array<{ id: string; nombre: string }>>([])
  const [periodMonth, setPeriodMonth] = useState(toMonthInputValue())
  const [miembroSearch, setMiembroSearch] = useState('')
  const [saving, setSaving] = useState(false)
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
  })

  const isACargoRentado = form.a_cargo_id === 'rentado'
  const isConductorRentado = form.conductor_id === 'rentado'

  const perfilesFiltrados = useMemo(() => {
    const needle = miembroSearch.toLowerCase()
    return perfiles.filter((p) => `${p.nombre} ${p.apellido}`.toLowerCase().includes(needle))
  }, [perfiles, miembroSearch])
  const responsableOptions = useMemo<SearchableSelectOption[]>(() => [
    ...perfiles.map((perfil) => ({
      value: perfil.id,
      label: `${perfil.nombre} ${perfil.apellido}`.trim(),
      hint: perfil.codigo_interno ? `Código ${perfil.codigo_interno}` : undefined,
    })),
    { value: 'rentado', label: 'Rentado' },
  ], [perfiles])
  const conductorOptions = useMemo<SearchableSelectOption[]>(() => [
    ...perfiles
      .filter((perfil) => perfil.es_conductor_habilitado)
      .map((perfil) => ({
        value: perfil.id,
        label: `${perfil.nombre} ${perfil.apellido}`.trim(),
        hint: perfil.codigo_interno ? `Código ${perfil.codigo_interno}` : undefined,
      })),
    { value: 'rentado', label: 'Rentado' },
  ], [perfiles])

  const load = async () => {
    const { desde, hasta } = getMonthRange(periodMonth)
    const data = await getServiciosByDateRange(undefined, desde, hasta)
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

  useEffect(() => { load() }, [periodMonth])
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
    if (saving) return
    setSaving(true)
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

    try {
      await createServicio({
        fecha: form.fecha || new Date().toISOString(),
        tipo: form.tipo,
        lugar: form.lugar || null,
        descripcion: form.descripcion || null,
        movil_id: form.movil_id || null,
        estado: 'completo',
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
      })
      await load()
    } finally {
      setSaving(false)
    }
  }

  const getServiceExportRows = async () => {
    const { desde, hasta } = getMonthRange(periodMonth)
    const data = await getServiciosByDateRange(undefined, desde, hasta)
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

  const exportServicesCSV = async () => {
    const { rows, monthValue } = await getServiceExportRows()
    exportRowsToCSV(rows, `servicios_${monthValue}.csv`)
  }

  const exportServicesPDF = async () => {
    const { rows, monthValue } = await getServiceExportRows()
    exportRowsToPrintablePDF(`Servicios ${monthValue}`, rows)
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (format === 'pdf') {
      await exportServicesPDF()
      return
    }
    await exportServicesCSV()
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
            <SearchableSelect
              value={form.a_cargo_id}
              onChange={(value) => setForm({ ...form, a_cargo_id: value })}
              options={responsableOptions}
              placeholder="Buscar a cargo"
            />
            <SearchableSelect
              value={form.conductor_id}
              onChange={(value) => setForm({ ...form, conductor_id: value })}
              options={conductorOptions}
              placeholder="Buscar conductor"
            />
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
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-60">{saving ? 'Guardando...' : 'Crear'}</button>
              <button type="button" disabled={saving} onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-60">Cancelar</button>
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
          <button onClick={() => handleExport('csv')} className="px-3 py-2 bg-green-600 text-white rounded-lg">Exportar CSV</button>
          <button onClick={() => handleExport('pdf')} className="px-3 py-2 bg-slate-700 text-white rounded-lg">Exportar PDF</button>
          <button onClick={() => { setShowForm(true); loadAux() }} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Nuevo servicio</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 surface p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Mes del reporte</span>
          <input type="month" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value || toMonthInputValue())} className="px-3 py-2 border rounded-lg" />
        </label>
      </div>

      <div className="surface overflow-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="bg-gray-50">
            <tr><th className="p-2 text-left">Fecha</th><th>Tipo</th><th>Lugar</th><th>Vehículo</th><th>A cargo</th><th>Conductor</th></tr>
          </thead>
          <tbody>{servicios.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-2">{formatDateOnly(s.fecha)}</td>
              <td className="p-2">{s.tipo}</td>
              <td className="p-2">{s.lugar}</td>
              <td className="p-2">{s.movil?.nombre || '-'}</td>
              <td className="p-2">{getServicioACargoLabel(s) || '-'}</td>
              <td className="p-2">{getServicioConductorLabel(s) || '-'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
