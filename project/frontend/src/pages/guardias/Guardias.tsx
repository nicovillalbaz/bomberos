import { useEffect, useMemo, useState } from 'react'
import type { Asistencia, Guardia, Perfil, TipoGuardia } from '../../types'
import {
  createMultipleGuardias,
  getAsistenciasForGuardias,
  getGuardias,
  setGuardiaAttendanceOverride,
} from '../../api/guardias'
import { getCompanyPresenceEvents } from '../../api/novedades'
import { getActiveProfiles } from '../../api/usuarios'
import { exportRowsToCSV, exportRowsToPrintablePDF } from '../../lib/export'
import { useAuth } from '../../hooks/useAuth'
import {
  buildPresenceIntervals,
  getManualGuardiaState,
  isPresentDuring,
  resolveGuardiaAttendance,
  type ManualAttendanceState,
  type PresenceEvent,
} from '../../lib/attendance'
import {
  formatDateOnly,
  getGuardiaInterval,
  getMonthRange,
  isGuardiaFinalizada,
  parseDateOnly,
  toMonthInputValue,
} from '../../lib/datetime'
import SearchableSelect, { type SearchableSelectOption } from '../../components/SearchableSelect'

type GuardiaMiembroItem = { miembro?: Perfil | null } | Perfil
type GuardiaConMiembros = Omit<Guardia, 'miembros'> & { miembros?: GuardiaMiembroItem[] }
type GuardiaRow = GuardiaConMiembros & { miembrosTexto: string }

const getNombre = (perfil?: Perfil | null) =>
  `${perfil?.nombre ?? ''} ${perfil?.apellido ?? ''}`.trim()

const isGuardiaMiembroRelacion = (item: GuardiaMiembroItem): item is { miembro?: Perfil | null } =>
  Object.prototype.hasOwnProperty.call(item, 'miembro')

const getMiembroPerfil = (item: GuardiaMiembroItem): Perfil | null | undefined => {
  if (isGuardiaMiembroRelacion(item)) return item.miembro
  return item
}

const getGuardiaParticipantes = (guardia: GuardiaConMiembros) => {
  const participantes = new Map<string, Perfil>()
  const addPerfil = (perfil?: Perfil | null) => {
    if (perfil?.id) participantes.set(perfil.id, perfil)
  }

  addPerfil(guardia.a_cargo)
  addPerfil(guardia.conductor)
  ;(guardia.miembros || []).forEach((item) => addPerfil(getMiembroPerfil(item)))

  return [...participantes.values()]
}

const getMiembrosTexto = (guardia: GuardiaConMiembros) => {
  const principales = new Set([guardia.a_cargo_id, guardia.conductor_id].filter(Boolean))
  const miembros = new Map<string, Perfil>()

  ;(guardia.miembros || []).forEach((item) => {
    const perfil = getMiembroPerfil(item)
    if (perfil?.id && !principales.has(perfil.id)) miembros.set(perfil.id, perfil)
  })

  return [...miembros.values()].map((perfil) => getNombre(perfil)).filter(Boolean).join(', ')
}

const getConductorTexto = (guardia: GuardiaConMiembros) =>
  getNombre(guardia.conductor) || guardia.conductor_rentado_nombre || '-'

export default function Guardias() {
  const { isOfficialOrAdmin } = useAuth()
  const [guardias, setGuardias] = useState<GuardiaConMiembros[]>([])
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [presenceEvents, setPresenceEvents] = useState<PresenceEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [periodMonth, setPeriodMonth] = useState(toMonthInputValue())
  const [error, setError] = useState('')
  const [miembroSearch, setMiembroSearch] = useState('')
  const [selectedGuardia, setSelectedGuardia] = useState<GuardiaConMiembros | null>(null)
  const [attendanceEdits, setAttendanceEdits] = useState<Record<string, ManualAttendanceState>>({})
  const [attendanceInitial, setAttendanceInitial] = useState<Record<string, ManualAttendanceState>>({})
  const [saving, setSaving] = useState(false)
  const [attendanceSaving, setAttendanceSaving] = useState(false)
  const [form, setForm] = useState({
    fechas: [''],
    tipo: 'voluntaria' as TipoGuardia,
    a_cargo_id: '',
    conductor_id: '',
    conductor_rentado_nombre: '',
    conductor_rentado_codigo: '',
    miembros: [] as string[],
  })

  const isEspecial = form.tipo === 'especial'
  const isConductorRentado = form.conductor_id === 'rentado'

  const getShiftTimes = (tipo: TipoGuardia, date: string) => {
    if (tipo === 'especial') return { hora_inicio: '00:00', hora_fin: '23:59' }
    const day = parseDateOnly(date).getDay()
    if (tipo === 'rentada') return day === 6 ? { hora_inicio: '07:00', hora_fin: '15:00' } : { hora_inicio: '07:00', hora_fin: '18:00' }
    if (day === 0) return { hora_inicio: '14:00', hora_fin: '06:00' }
    if (day === 6) return { hora_inicio: '20:00', hora_fin: '14:00' }
    return { hora_inicio: '22:00', hora_fin: '06:00' }
  }

  const loadProfiles = async () => {
    const data = await getActiveProfiles()
    setPerfiles(data)
  }

  const load = async () => {
    const { desde, hasta } = getMonthRange(periodMonth)
    const data = await getGuardias(undefined, desde, hasta)
    const guardiaData = data as GuardiaConMiembros[]
    setGuardias(guardiaData)

    const guardiaIds = guardiaData.map((guardia) => guardia.id)
    const latestGuardiaEnd = guardiaData.reduce<Date | null>((latest, guardia) => {
      const { fin } = getGuardiaInterval(guardia)
      return !latest || fin > latest ? fin : latest
    }, null)

    const [asistenciaData, presenceData] = await Promise.all([
      getAsistenciasForGuardias(guardiaIds),
      getCompanyPresenceEvents(latestGuardiaEnd?.toISOString()),
    ])

    setAsistencias(asistenciaData)
    setPresenceEvents(presenceData)
  }

  useEffect(() => {
    load()
  }, [periodMonth])

  useEffect(() => {
    loadProfiles()
  }, [])

  const parsedGuardias = useMemo<GuardiaRow[]>(() => guardias.map((guardia) => ({
    ...guardia,
    miembrosTexto: getMiembrosTexto(guardia),
  })), [guardias])

  const presenceIntervals = useMemo(() => buildPresenceIntervals(presenceEvents), [presenceEvents])

  const perfilesFiltrados = useMemo(() => {
    const needle = miembroSearch.toLowerCase()
    return perfiles.filter((perfil) => `${perfil.nombre} ${perfil.apellido}`.toLowerCase().includes(needle))
  }, [perfiles, miembroSearch])
  const responsableOptions = useMemo<SearchableSelectOption[]>(() => perfiles.map((perfil) => ({
    value: perfil.id,
    label: getNombre(perfil),
    hint: perfil.codigo_interno ? `Código ${perfil.codigo_interno}` : undefined,
  })), [perfiles])
  const conductorOptions = useMemo<SearchableSelectOption[]>(() => [
    ...perfiles
      .filter((perfil) => perfil.es_conductor_habilitado)
      .map((perfil) => ({
        value: perfil.id,
        label: getNombre(perfil),
        hint: perfil.codigo_interno ? `Código ${perfil.codigo_interno}` : undefined,
      })),
    { value: 'rentado', label: 'Rentado' },
  ], [perfiles])

  const setFechaAt = (index: number, value: string) => {
    setForm((prev) => ({ ...prev, fechas: prev.fechas.map((fecha, i) => (i === index ? value : fecha)) }))
  }

  const addFecha = () => setForm((prev) => ({ ...prev, fechas: [...prev.fechas, ''] }))
  const removeFecha = (index: number) => setForm((prev) => ({ ...prev, fechas: prev.fechas.filter((_, i) => i !== index) }))
  const toggleMiembro = (miembroId: string) => {
    setForm((prev) => ({
      ...prev,
      miembros: prev.miembros.includes(miembroId)
        ? prev.miembros.filter((id) => id !== miembroId)
        : [...prev.miembros, miembroId],
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving) return
    const fechasValidas = form.fechas.filter(Boolean)
    if (fechasValidas.length === 0) {
      setError('Debes seleccionar al menos una fecha.')
      return
    }
    if (!isEspecial && (!form.a_cargo_id || !form.conductor_id)) {
      setError('En guardia normal, a cargo y conductor son obligatorios.')
      return
    }
    if (isConductorRentado && (!form.conductor_rentado_nombre.trim() || !form.conductor_rentado_codigo.trim())) {
      setError('Para conductor rentado, nombre y código son obligatorios.')
      return
    }

    const payload = fechasValidas.map((fecha) => {
      const times = getShiftTimes(form.tipo, fecha)
      return {
        fecha,
        tipo: form.tipo,
        ...times,
        a_cargo_id: form.a_cargo_id || null,
        conductor_id: isConductorRentado ? null : (form.conductor_id || null),
        conductor_rentado_nombre: isConductorRentado ? form.conductor_rentado_nombre : null,
        conductor_rentado_codigo: isConductorRentado ? form.conductor_rentado_codigo : null,
        es_rentado: isConductorRentado,
        miembros: form.miembros.filter((id) => id !== form.a_cargo_id && id !== form.conductor_id),
      }
    })

    setSaving(true)
    try {
      await createMultipleGuardias(payload as any)
      setShowForm(false)
      setError('')
      setMiembroSearch('')
      setForm({ fechas: [''], tipo: 'voluntaria', a_cargo_id: '', conductor_id: '', conductor_rentado_nombre: '', conductor_rentado_codigo: '', miembros: [] })
      await load()
    } finally {
      setSaving(false)
    }
  }

  const getPreviousMonthGuardias = async () => {
    const { desde, hasta } = getMonthRange(periodMonth)
    const data = await getGuardias(undefined, desde, hasta)
    return {
      monthValue: periodMonth,
      guardiasMes: (data as GuardiaConMiembros[])
        .sort((a, b) => parseDateOnly(a.fecha).getTime() - parseDateOnly(b.fecha).getTime()),
    }
  }

  const exportGuardiasMes = async () => {
    const { guardiasMes, monthValue } = await getPreviousMonthGuardias()
    const rows = guardiasMes.map((guardia) => ({
        dia: formatDateOnly(guardia.fecha),
        tipo: guardia.tipo,
        horario: `${guardia.hora_inicio} a ${guardia.hora_fin}`,
        a_cargo: getNombre(guardia.a_cargo),
        conductor: getConductorTexto(guardia),
        miembros: getMiembrosTexto(guardia),
      }))

    if (rows.length === 0) {
      setError('No hay guardias para exportar en el mes seleccionado.')
      return
    }
    exportRowsToCSV(rows, `guardias_mes_${monthValue}.csv`)
  }

  const exportGuardiasMesPDF = async () => {
    const { guardiasMes, monthValue } = await getPreviousMonthGuardias()
    const rows = guardiasMes.map((guardia) => ({
        dia: formatDateOnly(guardia.fecha),
        tipo: guardia.tipo,
        horario: `${guardia.hora_inicio} a ${guardia.hora_fin}`,
        a_cargo: getNombre(guardia.a_cargo),
        conductor: getConductorTexto(guardia),
        miembros: getMiembrosTexto(guardia),
      }))

    if (rows.length === 0) {
      setError('No hay guardias para exportar en el mes seleccionado.')
      return
    }
    exportRowsToPrintablePDF(`Guardias ${monthValue}`, rows)
  }

  const handleGuardiasMesExport = async (format: 'csv' | 'pdf') => {
    if (format === 'pdf') {
      await exportGuardiasMesPDF()
      return
    }
    await exportGuardiasMes()
  }

  const getAutomaticAttendance = (perfilId: string, guardia: GuardiaConMiembros) => {
    const { inicio, fin } = getGuardiaInterval(guardia)
    return isPresentDuring(presenceIntervals, perfilId, inicio, fin)
  }

  const getGuardiaAsistentesCount = (guardia: GuardiaConMiembros) =>
    getGuardiaParticipantes(guardia)
      .filter((perfil) => resolveGuardiaAttendance(perfil.id, guardia, asistencias, presenceIntervals)).length

  const openAttendanceEditor = (guardia: GuardiaConMiembros) => {
    const participantes = getGuardiaParticipantes(guardia)
    const initial = Object.fromEntries(
      participantes.map((perfil) => [perfil.id, getManualGuardiaState(asistencias, guardia.id, perfil.id)])
    ) as Record<string, ManualAttendanceState>
    setSelectedGuardia(guardia)
    setAttendanceInitial(initial)
    setAttendanceEdits(initial)
  }

  const saveAttendanceOverrides = async () => {
    if (!selectedGuardia || attendanceSaving) return
    const changes = Object.entries(attendanceEdits).filter(([perfilId, estado]) => attendanceInitial[perfilId] !== estado)

    setAttendanceSaving(true)
    try {
      await Promise.all(
        changes.map(([perfilId, estado]) => setGuardiaAttendanceOverride(selectedGuardia.id, perfilId, estado))
      )
      const updated = await getAsistenciasForGuardias(parsedGuardias.map((guardia) => guardia.id))
      setAsistencias(updated)
      setSelectedGuardia(null)
      setAttendanceInitial({})
      setAttendanceEdits({})
    } finally {
      setAttendanceSaving(false)
    }
  }

  const closeAttendanceEditor = () => {
    setSelectedGuardia(null)
    setAttendanceInitial({})
    setAttendanceEdits({})
  }

  const selectedGuardiaParticipantes = selectedGuardia ? getGuardiaParticipantes(selectedGuardia) : []

  if (showForm) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Nueva guardia</h1>
          <p className="text-sm text-gray-500">Definí fecha, responsables y miembros asignados.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="surface p-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value as TipoGuardia })} className="px-3 py-2 border rounded-lg">
              <option value="voluntaria">Voluntaria</option>
              <option value="rentada">Rentada</option>
              <option value="especial">Especial</option>
            </select>
            <div />

            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium">Fechas</label>
              {form.fechas.map((fecha, index) => (
                <div key={index} className="flex gap-2">
                  <input type="date" required value={fecha} onChange={(event) => setFechaAt(index, event.target.value)} className="px-3 py-2 border rounded-lg w-full sm:w-auto" />
                  {form.fechas.length > 1 && (
                    <button type="button" onClick={() => removeFecha(index)} className="px-3 py-2 bg-gray-200 rounded-lg">Quitar</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addFecha} className="px-3 py-2 bg-gray-200 rounded-lg text-sm">Agregar fecha</button>
            </div>

            <SearchableSelect
              value={form.a_cargo_id}
              onChange={(value) => setForm({ ...form, a_cargo_id: value })}
              options={responsableOptions}
              placeholder={isEspecial ? 'Buscar a cargo (opcional)' : 'Buscar a cargo'}
            />

            <SearchableSelect
              value={form.conductor_id}
              onChange={(value) => setForm({ ...form, conductor_id: value })}
              options={conductorOptions}
              placeholder={isEspecial ? 'Buscar conductor (opcional)' : 'Buscar conductor'}
            />

            {isConductorRentado && (
              <>
                <input required placeholder="Nombre conductor rentado" value={form.conductor_rentado_nombre} onChange={(event) => setForm({ ...form, conductor_rentado_nombre: event.target.value })} className="px-3 py-2 border rounded-lg" />
                <input required placeholder="Código conductor rentado" value={form.conductor_rentado_codigo} onChange={(event) => setForm({ ...form, conductor_rentado_codigo: event.target.value })} className="px-3 py-2 border rounded-lg" />
              </>
            )}

            <div className="sm:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <label className="text-sm font-medium">Miembros</label>
                <input
                  placeholder="Buscar miembro"
                  value={miembroSearch}
                  onChange={(event) => setMiembroSearch(event.target.value)}
                  className="px-3 py-2 border rounded-lg sm:ml-auto sm:w-64"
                />
              </div>
              <div className="mt-2 border rounded-lg p-3 max-h-56 overflow-y-auto space-y-2">
                {perfilesFiltrados.map((perfil) => (
                  <label key={perfil.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.miembros.includes(perfil.id)} onChange={() => toggleMiembro(perfil.id)} />
                    <span>{perfil.nombre} {perfil.apellido}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Seleccionados: {form.miembros.length}</p>
            </div>

            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-60">{saving ? 'Guardando...' : 'Crear'}</button>
              <button type="button" disabled={saving} onClick={() => { setShowForm(false); setError('') }} className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-60">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (selectedGuardia) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">Asistencia de guardia finalizada</p>
            <h1 className="text-2xl font-bold">{formatDateOnly(selectedGuardia.fecha)} - {selectedGuardia.hora_inicio} a {selectedGuardia.hora_fin}</h1>
          </div>
        </div>

        <div className="surface overflow-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Persona</th>
                <th className="p-2">Automático por ingreso</th>
                <th className="p-2">Ajuste manual</th>
                <th className="p-2">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {selectedGuardiaParticipantes.length === 0 ? (
                <tr>
                  <td className="p-3 text-center text-gray-500" colSpan={4}>Esta guardia no tiene integrantes asignados.</td>
                </tr>
              ) : selectedGuardiaParticipantes.map((perfil) => {
                const automatico = getAutomaticAttendance(perfil.id, selectedGuardia)
                const estado = attendanceEdits[perfil.id] || 'auto'
                const resultado = estado === 'auto' ? automatico : estado === 'presente'
                return (
                  <tr key={perfil.id} className="border-t">
                    <td className="p-2">{getNombre(perfil)}</td>
                    <td className="p-2 text-center">{automatico ? 'Presente' : 'Sin registro'}</td>
                    <td className="p-2 text-center">
                      <select
                        value={estado}
                        onChange={(event) => setAttendanceEdits((prev) => ({
                          ...prev,
                          [perfil.id]: event.target.value as ManualAttendanceState,
                        }))}
                        className="px-3 py-2 border rounded-lg"
                      >
                        <option value="auto">Automático</option>
                        <option value="presente">Presente</option>
                        <option value="ausente">Ausente</option>
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${resultado ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {resultado ? 'Asistió' : 'No asistió'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={saveAttendanceOverrides} disabled={attendanceSaving} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-60">
            {attendanceSaving ? 'Guardando...' : 'Guardar asistencia'}
          </button>
          <button onClick={closeAttendanceEditor} disabled={attendanceSaving} className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-60">Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-2xl font-bold">Guardias</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={load} className="px-3 py-2 bg-gray-200 rounded-lg">Filtrar</button>
          <button onClick={() => handleGuardiasMesExport('csv')} className="px-3 py-2 bg-green-600 text-white rounded-lg">Exportar CSV</button>
          <button onClick={() => handleGuardiasMesExport('pdf')} className="px-3 py-2 bg-slate-700 text-white rounded-lg">Exportar PDF</button>
          {isOfficialOrAdmin && (
            <button onClick={() => { setShowForm(true); loadProfiles() }} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Nueva guardia</button>
          )}
        </div>
      </div>

      <div className="surface p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Mes del reporte</span>
          <input type="month" value={periodMonth} onChange={(event) => setPeriodMonth(event.target.value || toMonthInputValue())} className="px-3 py-2 border rounded-lg" />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="surface overflow-auto">
        <table className="w-full text-sm min-w-[920px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2">A cargo</th>
              <th className="p-2">Conductor</th>
              <th className="p-2">Miembros</th>
              <th className="p-2">Asistencia</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {parsedGuardias.map((guardia) => {
              const finalizada = isGuardiaFinalizada(guardia)
              const participantesCount = getGuardiaParticipantes(guardia).length
              return (
                <tr key={guardia.id} className="border-t">
                  <td className="p-2">{formatDateOnly(guardia.fecha)}</td>
                  <td className="p-2">{getNombre(guardia.a_cargo) || '-'}</td>
                  <td className="p-2">{getConductorTexto(guardia)}</td>
                  <td className="p-2">{guardia.miembrosTexto || '-'}</td>
                  <td className="p-2 text-center">
                    {finalizada ? `${getGuardiaAsistentesCount(guardia)} / ${participantesCount}` : 'Pendiente'}
                  </td>
                  <td className="p-2">
                    {isOfficialOrAdmin && finalizada && (
                      <button onClick={() => openAttendanceEditor(guardia)} className="text-primary-600 text-xs">
                        Editar asistencia
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
