import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Perfil, Servicio } from '../../types'
import { createServicio, getServiciosByDateRange, getServicioById, setServicioPersonal } from '../../api/servicios'
import { getActiveProfiles } from '../../api/usuarios'
import { getMonthRange, toMonthInputValue } from '../../lib/datetime'

const getNombres = (perfil?: Perfil | null) =>
  `${perfil?.nombre ?? ''} ${perfil?.apellido ?? ''}`.trim()

type RentadoForm = { nombre: string; codigo: string }

const initialRentado: RentadoForm = { nombre: '', codigo: '' }

type BaseProps = {
  tipo: string
  titulo: string
}

function CitacionesBase({ tipo, titulo }: BaseProps) {
  const [eventos, setEventos] = useState<Servicio[]>([])
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [detalle, setDetalle] = useState<Servicio | null>(null)
  const [asistentes, setAsistentes] = useState<string[]>([])
  const [asistentesRentados, setAsistentesRentados] = useState<RentadoForm[]>([])
  const [rentadoActual, setRentadoActual] = useState<RentadoForm>(initialRentado)
  const [detalleOpen, setDetalleOpen] = useState(false)
  const [filtro, setFiltro] = useState('')
  const [miembroSearch, setMiembroSearch] = useState('')
  const [periodMonth, setPeriodMonth] = useState(toMonthInputValue())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    fecha: '',
    lugar: '',
    descripcion: '',
  })
  const [saving, setSaving] = useState(false)
  const range = useMemo(() => getMonthRange(periodMonth), [periodMonth])

  const load = async () => {
    const [datos, perfilesData] = await Promise.all([
      getServiciosByDateRange(undefined, range.desde, range.hasta, tipo),
      getActiveProfiles(),
    ])
    setEventos(datos)
    setPerfiles(perfilesData)
  }

  useEffect(() => {
    load()
  }, [tipo, range.desde, range.hasta])

  const loadDetalle = async (servicioId: string) => {
    const data = await getServicioById(servicioId)
    setDetalle(data)
    setDetalleOpen(true)
    setAsistentes((data.personal || []).map((p) => p.persona_id).filter(Boolean) as string[])
    setAsistentesRentados((data.personal || [])
      .filter((p) => p.es_rentado)
      .map((p) => ({ nombre: p.persona_nombre ?? '', codigo: p.persona_codigo ?? '' }))
      .filter((p) => p.nombre && p.codigo))
  }

  const eventosFiltradosConTexto = useMemo(() => {
    const needle = filtro.toLowerCase().trim()
    return eventos.filter((e) => {
      if (!needle) return true
      const texto = [
        getNombres(e.a_cargo),
        e.lugar ?? '',
        e.descripcion ?? '',
      ].join(' ').toLowerCase()
      return texto.includes(needle)
    })
  }, [eventos, filtro])

  const asistentesFiltrados = useMemo(() => {
    const needle = miembroSearch.toLowerCase().trim()
    return perfiles.filter((p) =>
      `${p.nombre} ${p.apellido}`.toLowerCase().includes(needle)
    )
  }, [perfiles, miembroSearch])

  const toggleAsistente = (id: string) => {
    setAsistentes((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ))
  }

  const addRentado = () => {
    const nombre = rentadoActual.nombre.trim()
    const codigo = rentadoActual.codigo.trim()
    if (!nombre || !codigo) return
    setAsistentesRentados((prev) => [...prev, { nombre, codigo }])
    setRentadoActual(initialRentado)
  }

  const removeRentado = (index: number) => {
    setAsistentesRentados((prev) => prev.filter((_, i) => i !== index))
  }

  const crearEvento = async (e: FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const creado = await createServicio({
        fecha: form.fecha || new Date().toISOString().split('T')[0],
        tipo,
        lugar: form.lugar || null,
        descripcion: form.descripcion || null,
        estado: 'borrador',
        personal: [],
      }) as Servicio
      setShowForm(false)
      setForm({ fecha: '', lugar: '', descripcion: '' })
      setFiltro('')
      await load()
      await loadDetalle(creado.id)
    } finally {
      setSaving(false)
    }
  }

  const guardarAsistencia = async (e: FormEvent) => {
    e.preventDefault()
    if (!detalle || saving) return
    setSaving(true)
    try {
      await setServicioPersonal(
        detalle.id,
        [
          ...asistentes.map((id) => ({ persona_id: id, es_rentado: false })),
          ...asistentesRentados.map((rentado) => ({
            persona_nombre: rentado.nombre,
            persona_codigo: rentado.codigo,
            es_rentado: true,
          })),
        ]
      )
      const actual = await getServicioById(detalle.id)
      setDetalle(actual)
      setEventos((prev) => prev.map((s) => (s.id === actual.id ? actual : s)))
      setAsistentes((actual.personal || []).map((p) => p.persona_id).filter(Boolean) as string[])
      setAsistentesRentados((actual.personal || [])
        .filter((p) => p.es_rentado)
        .map((p) => ({ nombre: p.persona_nombre ?? '', codigo: p.persona_codigo ?? '' }))
        .filter((p) => p.nombre && p.codigo))
    } finally {
      setSaving(false)
    }
  }

  const detalleResumen = detalle
    ? `Asistieron ${asistentes.length + asistentesRentados.length}`
    : ''

  if (showForm) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Nueva {titulo.toLowerCase()}</h1>
          <p className="text-sm text-gray-500">Cargá fecha, lugar y descripción.</p>
        </div>

        <div className="surface p-4">
          <form onSubmit={crearEvento} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span>Fecha</span>
                <input required type="date" value={form.fecha} onChange={(e) => setForm((prev) => ({ ...prev, fecha: e.target.value }))} className="px-3 py-2 border rounded-lg" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Lugar</span>
                <input value={form.lugar} onChange={(e) => setForm((prev) => ({ ...prev, lugar: e.target.value }))} className="px-3 py-2 border rounded-lg" placeholder="Ej: Sala principal" />
              </label>
            </div>
            <textarea placeholder="Descripción (opcional)" value={form.descripcion} onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" disabled={saving} onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-60">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (detalleOpen && detalle) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <p className="text-sm text-gray-500">Detalle</p>
            <h1 className="text-2xl font-bold">{new Date(detalle.fecha).toLocaleDateString()} - {detalle.tipo}</h1>
            <p className="text-sm text-gray-600">{detalle.lugar || 'Sin lugar'} | {detalleResumen}</p>
          </div>
        </div>

        <div className="surface p-4">
          <form onSubmit={guardarAsistencia} className="space-y-3">
            <input placeholder="Buscar voluntario" value={miembroSearch} onChange={(e) => setMiembroSearch(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
            <div className="max-h-72 overflow-auto border rounded-lg p-3 space-y-2">
              {asistentesFiltrados.map((p) => (
                <label key={p.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={asistentes.includes(p.id)} onChange={() => toggleAsistente(p.id)} />
                  <span>{p.nombre} {p.apellido}</span>
                </label>
              ))}
            </div>
            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-sm font-medium">Asistentes rentados</p>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                <input placeholder="Nombre rentado" value={rentadoActual.nombre} onChange={(e) => setRentadoActual((prev) => ({ ...prev, nombre: e.target.value }))} className="px-3 py-2 border rounded-lg" />
                <input placeholder="Código rentado" value={rentadoActual.codigo} onChange={(e) => setRentadoActual((prev) => ({ ...prev, codigo: e.target.value }))} className="px-3 py-2 border rounded-lg" />
                <button type="button" onClick={addRentado} className="px-3 py-2 bg-gray-200 rounded-lg">Agregar</button>
              </div>
              {asistentesRentados.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {asistentesRentados.map((rentado, index) => (
                    <button key={`${rentado.codigo}-${index}`} type="button" onClick={() => removeRentado(index)} className="px-2 py-1 rounded bg-gray-100 text-xs">
                      {rentado.nombre} - {rentado.codigo} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar asistencia'}
              </button>
              <button type="button" disabled={saving} onClick={() => { setDetalleOpen(false); setDetalle(null) }} className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-60">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <button
          aria-label={`Nueva ${titulo.toLowerCase()}`}
          data-mobile-label="+"
          onClick={() => setShowForm(true)}
          className="mobile-compact-action px-4 py-2 bg-primary-600 text-white rounded-lg"
        >
          Nuevo
        </button>
      </div>

      <div className="surface p-4 grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Mes del período</span>
          <input
            type="month"
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value || toMonthInputValue())}
            className="px-3 py-2 border rounded-lg"
          />
        </label>
        <input
          type="text"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por a cargo"
          className="px-3 py-2 border rounded-lg"
        />
      </div>

      <div className="surface overflow-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2">Lugar</th>
              <th className="p-2">A cargo</th>
              <th className="p-2">Asistentes</th>
              <th className="p-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {eventosFiltradosConTexto.length === 0 ? (
              <tr><td className="p-3 text-gray-500" colSpan={5}>No hay {titulo.toLowerCase()} con los filtros.</td></tr>
            ) : (
              eventosFiltradosConTexto.map((ev) => (
                <tr key={ev.id} className="border-t">
                  <td className="p-2">{new Date(ev.fecha).toLocaleDateString()}</td>
                  <td className="p-2">{ev.lugar || '-'}</td>
                  <td className="p-2">{getNombres(ev.a_cargo) || '-'}</td>
                  <td className="p-2">{ev.personal?.length || 0}</td>
                  <td className="p-2">
                    <button
                      onClick={() => loadDetalle(ev.id)}
                      className="text-primary-600 text-xs"
                    >
                      Abrir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}

export function Citaciones() {
  return <CitacionesBase tipo="citacion" titulo="Citaciones" />
}

export function Practicas() {
  return <CitacionesBase tipo="practica" titulo="Prácticas" />
}

