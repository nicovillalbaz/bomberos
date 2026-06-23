import { useEffect, useMemo, useState } from 'react'
import type { Asistencia, Guardia, Perfil, Servicio, TipoGuardia } from '../../types'
import {
  createMultipleGuardias,
  getAsistenciasForGuardias,
  getGuardias,
  setGuardiaAttendanceOverride,
} from '../../api/guardias'
import { getCompanyPresenceEvents } from '../../api/novedades'
import { getServiciosByDateRange } from '../../api/servicios'
import { getActiveProfiles } from '../../api/usuarios'
import { exportRowsToCSV, exportRowsToPrintablePDF, exportTableToPrintablePDF } from '../../lib/export'
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
  getPreviousMonthRange,
  isDateFinished,
  isGuardiaFinalizada,
  parseDateOnly,
} from '../../lib/datetime'

type GuardiaMiembroItem = { miembro?: Perfil | null } | Perfil
type GuardiaConMiembros = Omit<Guardia, 'miembros'> & { miembros?: GuardiaMiembroItem[] }
type GuardiaRow = GuardiaConMiembros & { miembrosTexto: string }

type PorcentajeRow = {
  perfil: Perfil
  categoria: 'VK/BVC/Combatiente' | 'VA/BVA/Activo'
  incluyePracticas: boolean
  guardiasAsistidas: number
  guardiasTotal: number
  guardiasPct: number
  citacionesAsistidas: number
  citacionesTotal: number
  citacionesPct: number
  practicasAsistidas: number
  practicasTotal: number
  practicasPct: number
  generalPct: number
}

const getNombre = (perfil?: Perfil | null) =>
  `${perfil?.nombre ?? ''} ${perfil?.apellido ?? ''}`.trim()

const isGuardiaMiembroRelacion = (item: GuardiaMiembroItem): item is { miembro?: Perfil | null } =>
  Object.prototype.hasOwnProperty.call(item, 'miembro')

const getMiembroPerfil = (item: GuardiaMiembroItem): Perfil | null | undefined => {
  if (isGuardiaMiembroRelacion(item)) return item.miembro
  return item
}

const getMiembrosTexto = (guardia: Pick<GuardiaConMiembros, 'miembros'>) =>
  (guardia.miembros || [])
    .map((item) => getNombre(getMiembroPerfil(item)))
    .filter(Boolean)
    .join(', ')

const getConductorTexto = (guardia: GuardiaConMiembros) =>
  getNombre(guardia.conductor) || guardia.conductor_rentado_nombre || '-'

const getPerfilCategoria = (perfil: Perfil): PorcentajeRow['categoria'] => {
  const codigo = (perfil.codigo_interno || '').trim().toUpperCase()
  if (codigo.startsWith('VA') || codigo.startsWith('BVA') || codigo.includes('ACTIVO')) return 'VA/BVA/Activo'
  return 'VK/BVC/Combatiente'
}

const percent = (asistidas: number, total: number) => (total > 0 ? Math.round((asistidas / total) * 100) : 0)

const averageAvailable = (items: Array<{ total: number; pct: number }>) => {
  const available = items.filter((item) => item.total > 0)
  if (available.length === 0) return 0
  return Math.round(available.reduce((sum, item) => sum + item.pct, 0) / available.length)
}

const servicioTienePersona = (servicio: Servicio, perfilId: string) =>
  (servicio.personal || []).some((item) => item.persona_id === perfilId)

export default function Guardias() {
  const { isOfficialOrAdmin } = useAuth()
  const [guardias, setGuardias] = useState<GuardiaConMiembros[]>([])
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [presenceEvents, setPresenceEvents] = useState<PresenceEvent[]>([])
  const [citaciones, setCitaciones] = useState<Servicio[]>([])
  const [practicas, setPracticas] = useState<Servicio[]>([])
  const [showForm, setShowForm] = useState(false)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [error, setError] = useState('')
  const [miembroSearch, setMiembroSearch] = useState('')
  const [selectedGuardia, setSelectedGuardia] = useState<GuardiaConMiembros | null>(null)
  const [attendanceEdits, setAttendanceEdits] = useState<Record<string, ManualAttendanceState>>({})
  const [attendanceInitial, setAttendanceInitial] = useState<Record<string, ManualAttendanceState>>({})
  const [attendanceSaving, setAttendanceSaving] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv')
  const [form, setForm] = useState({
    fechas: [''],
    tipo: 'voluntaria' as TipoGuardia,
    a_cargo_id: '',
    conductor_id: '',
    miembros: [] as string[],
  })

  const isEspecial = form.tipo === 'especial'

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
    const data = await getGuardias(undefined, fechaDesde || undefined, fechaHasta || undefined)
    const guardiaData = data as GuardiaConMiembros[]
    setGuardias(guardiaData)

    const guardiaIds = guardiaData.map((guardia) => guardia.id)
    const latestGuardiaEnd = guardiaData.reduce<Date | null>((latest, guardia) => {
      const { fin } = getGuardiaInterval(guardia)
      return !latest || fin > latest ? fin : latest
    }, null)

    const [asistenciaData, presenceData, citacionesData, practicasData] = await Promise.all([
      getAsistenciasForGuardias(guardiaIds),
      getCompanyPresenceEvents(latestGuardiaEnd?.toISOString()),
      getServiciosByDateRange(undefined, fechaDesde || undefined, fechaHasta || undefined, 'citacion'),
      getServiciosByDateRange(undefined, fechaDesde || undefined, fechaHasta || undefined, 'practica'),
    ])

    setAsistencias(asistenciaData)
    setPresenceEvents(presenceData)
    setCitaciones(citacionesData)
    setPracticas(practicasData)
  }

  useEffect(() => {
    load()
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

  const guardiasFinalizadas = useMemo(
    () => parsedGuardias.filter((guardia) => isGuardiaFinalizada(guardia)),
    [parsedGuardias],
  )

  const citacionesFinalizadas = useMemo(
    () => citaciones.filter((servicio) => isDateFinished(servicio.fecha)),
    [citaciones],
  )

  const practicasFinalizadas = useMemo(
    () => practicas.filter((servicio) => isDateFinished(servicio.fecha)),
    [practicas],
  )

  const porcentajeRows = useMemo<PorcentajeRow[]>(() => {
    return perfiles
      .map((perfil) => {
        const guardiasAsistidas = guardiasFinalizadas.filter((guardia) =>
          resolveGuardiaAttendance(perfil.id, guardia, asistencias, presenceIntervals)
        ).length
        const citacionesAsistidas = citacionesFinalizadas.filter((servicio) => servicioTienePersona(servicio, perfil.id)).length
        const practicasAsistidas = practicasFinalizadas.filter((servicio) => servicioTienePersona(servicio, perfil.id)).length
        const guardiasPct = percent(guardiasAsistidas, guardiasFinalizadas.length)
        const citacionesPct = percent(citacionesAsistidas, citacionesFinalizadas.length)
        const practicasPct = percent(practicasAsistidas, practicasFinalizadas.length)
        const categoria = getPerfilCategoria(perfil)
        const incluyePracticas = categoria === 'VK/BVC/Combatiente'
        const generalPct = averageAvailable([
          { total: guardiasFinalizadas.length, pct: guardiasPct },
          { total: citacionesFinalizadas.length, pct: citacionesPct },
          ...(incluyePracticas ? [{ total: practicasFinalizadas.length, pct: practicasPct }] : []),
        ])

        return {
          perfil,
          categoria,
          incluyePracticas,
          guardiasAsistidas,
          guardiasTotal: guardiasFinalizadas.length,
          guardiasPct,
          citacionesAsistidas,
          citacionesTotal: citacionesFinalizadas.length,
          citacionesPct,
          practicasAsistidas,
          practicasTotal: practicasFinalizadas.length,
          practicasPct,
          generalPct,
        }
      })
      .sort((a, b) => `${a.perfil.apellido} ${a.perfil.nombre}`.localeCompare(`${b.perfil.apellido} ${b.perfil.nombre}`))
  }, [asistencias, citacionesFinalizadas, guardiasFinalizadas, perfiles, practicasFinalizadas, presenceIntervals])

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
    const fechasValidas = form.fechas.filter(Boolean)
    if (fechasValidas.length === 0) {
      setError('Debes seleccionar al menos una fecha.')
      return
    }
    if (!isEspecial && (!form.a_cargo_id || !form.conductor_id)) {
      setError('En guardia normal, a cargo y conductor son obligatorios.')
      return
    }

    const payload = fechasValidas.map((fecha) => {
      const times = getShiftTimes(form.tipo, fecha)
      return {
        fecha,
        tipo: form.tipo,
        ...times,
        a_cargo_id: form.a_cargo_id || null,
        conductor_id: form.conductor_id || null,
        miembros: form.miembros,
      }
    })

    await createMultipleGuardias(payload as any)
    setShowForm(false)
    setError('')
    setMiembroSearch('')
    setForm({ fechas: [''], tipo: 'voluntaria', a_cargo_id: '', conductor_id: '', miembros: [] })
    load()
  }

  const getPreviousMonthGuardias = async () => {
    const { desde, hasta, monthValue } = getPreviousMonthRange()
    const data = await getGuardias(undefined, desde, hasta)
    return {
      monthValue,
      guardiasMes: (data as GuardiaConMiembros[])
        .sort((a, b) => parseDateOnly(a.fecha).getTime() - parseDateOnly(b.fecha).getTime()),
    }
  }

  const exportCSV = async () => {
    const { guardiasMes, monthValue } = await getPreviousMonthGuardias()
    exportRowsToCSV(guardiasMes.map((guardia) => ({
      fecha: formatDateOnly(guardia.fecha),
      tipo: guardia.tipo,
      a_cargo: getNombre(guardia.a_cargo),
      conductor: getConductorTexto(guardia),
      miembros: getMiembrosTexto(guardia),
    })), `guardias_${monthValue}.csv`)
  }

  const exportPDF = async () => {
    const { guardiasMes, monthValue } = await getPreviousMonthGuardias()
    exportTableToPrintablePDF(
      `Reporte de Guardias ${monthValue}`,
      ['Fecha', 'Tipo', 'A cargo', 'Conductor', 'Miembros'],
      guardiasMes.map((guardia) => [
        formatDateOnly(guardia.fecha),
        guardia.tipo,
        getNombre(guardia.a_cargo),
        getConductorTexto(guardia),
        getMiembrosTexto(guardia),
      ])
    )
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
      setError('No hay guardias para exportar en el mes anterior.')
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
      setError('No hay guardias para exportar en el mes anterior.')
      return
    }
    exportRowsToPrintablePDF(`Guardias mes anterior ${monthValue}`, rows)
  }

  const getPreviousMonthPorcentajeRows = async () => {
    const { desde, hasta, monthValue } = getPreviousMonthRange()
    const guardiasData = await getGuardias(undefined, desde, hasta) as GuardiaConMiembros[]
    const guardiaIds = guardiasData.map((guardia) => guardia.id)
    const latestGuardiaEnd = guardiasData.reduce<Date | null>((latest, guardia) => {
      const { fin } = getGuardiaInterval(guardia)
      return !latest || fin > latest ? fin : latest
    }, null)

    const [asistenciaData, presenceData, citacionesData, practicasData] = await Promise.all([
      getAsistenciasForGuardias(guardiaIds),
      getCompanyPresenceEvents(latestGuardiaEnd?.toISOString()),
      getServiciosByDateRange(undefined, desde, hasta, 'citacion'),
      getServiciosByDateRange(undefined, desde, hasta, 'practica'),
    ])

    const previousPresenceIntervals = buildPresenceIntervals(presenceData)
    const previousGuardiasFinalizadas = guardiasData.filter((guardia) => isGuardiaFinalizada(guardia))
    const previousCitacionesFinalizadas = citacionesData.filter((servicio) => isDateFinished(servicio.fecha))
    const previousPracticasFinalizadas = practicasData.filter((servicio) => isDateFinished(servicio.fecha))

    const rows = perfiles
      .map((perfil) => {
        const guardiasAsistidas = previousGuardiasFinalizadas.filter((guardia) =>
          resolveGuardiaAttendance(perfil.id, guardia, asistenciaData, previousPresenceIntervals)
        ).length
        const citacionesAsistidas = previousCitacionesFinalizadas.filter((servicio) => servicioTienePersona(servicio, perfil.id)).length
        const practicasAsistidas = previousPracticasFinalizadas.filter((servicio) => servicioTienePersona(servicio, perfil.id)).length
        const guardiasPct = percent(guardiasAsistidas, previousGuardiasFinalizadas.length)
        const citacionesPct = percent(citacionesAsistidas, previousCitacionesFinalizadas.length)
        const practicasPct = percent(practicasAsistidas, previousPracticasFinalizadas.length)
        const categoria = getPerfilCategoria(perfil)
        const incluyePracticas = categoria === 'VK/BVC/Combatiente'
        const generalPct = averageAvailable([
          { total: previousGuardiasFinalizadas.length, pct: guardiasPct },
          { total: previousCitacionesFinalizadas.length, pct: citacionesPct },
          ...(incluyePracticas ? [{ total: previousPracticasFinalizadas.length, pct: practicasPct }] : []),
        ])

        return {
          nombre: getNombre(perfil),
          codigo: perfil.codigo_interno || '',
          categoria,
          guardias: `${guardiasAsistidas}/${previousGuardiasFinalizadas.length}`,
          porcentaje_guardias: `${guardiasPct}%`,
          citaciones: `${citacionesAsistidas}/${previousCitacionesFinalizadas.length}`,
          porcentaje_citaciones: `${citacionesPct}%`,
          practicas: incluyePracticas ? `${practicasAsistidas}/${previousPracticasFinalizadas.length}` : 'No aplica',
          porcentaje_practicas: incluyePracticas ? `${practicasPct}%` : 'No aplica',
          porcentaje_general: `${generalPct}%`,
        }
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre))

    return { rows, monthValue }
  }

  const exportPorcentajes = async () => {
    const { rows, monthValue } = await getPreviousMonthPorcentajeRows()

    if (rows.length === 0) {
      setError('No hay porcentajes para exportar.')
      return
    }

    exportRowsToCSV(rows, `porcentajes_asistencia_${monthValue}.csv`)
  }

  const exportPorcentajesPDF = async () => {
    const { rows, monthValue } = await getPreviousMonthPorcentajeRows()

    if (rows.length === 0) {
      setError('No hay porcentajes para exportar.')
      return
    }

    exportRowsToPrintablePDF(`Porcentajes de asistencia ${monthValue}`, rows)
  }

  const handleGeneralExport = async () => {
    if (exportFormat === 'pdf') {
      await exportPDF()
      return
    }
    await exportCSV()
  }

  const handleGuardiasMesExport = async () => {
    if (exportFormat === 'pdf') {
      await exportGuardiasMesPDF()
      return
    }
    await exportGuardiasMes()
  }

  const handlePorcentajesExport = async () => {
    if (exportFormat === 'pdf') {
      await exportPorcentajesPDF()
      return
    }
    await exportPorcentajes()
  }

  const getAutomaticAttendance = (perfilId: string, guardia: GuardiaConMiembros) => {
    const { inicio, fin } = getGuardiaInterval(guardia)
    return isPresentDuring(presenceIntervals, perfilId, inicio, fin)
  }

  const getGuardiaAsistentesCount = (guardia: GuardiaConMiembros) =>
    perfiles.filter((perfil) => resolveGuardiaAttendance(perfil.id, guardia, asistencias, presenceIntervals)).length

  const openAttendanceEditor = (guardia: GuardiaConMiembros) => {
    const initial = Object.fromEntries(
      perfiles.map((perfil) => [perfil.id, getManualGuardiaState(asistencias, guardia.id, perfil.id)])
    ) as Record<string, ManualAttendanceState>
    setSelectedGuardia(guardia)
    setAttendanceInitial(initial)
    setAttendanceEdits(initial)
  }

  const saveAttendanceOverrides = async () => {
    if (!selectedGuardia) return
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-2xl font-bold">Guardias</h1>
        <div className="flex flex-wrap gap-2">
          <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value as 'csv' | 'pdf')} className="px-3 py-2 border rounded-lg">
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
          <button onClick={load} className="px-3 py-2 bg-gray-200 rounded-lg">Filtrar</button>
          <button onClick={handleGeneralExport} className="px-3 py-2 bg-green-600 text-white rounded-lg">Exportar</button>
          <button onClick={handleGuardiasMesExport} className="px-3 py-2 bg-slate-700 text-white rounded-lg">Guardias</button>
          <button onClick={handlePorcentajesExport} className="px-3 py-2 bg-amber-600 text-white rounded-lg">Porcentaje</button>
          {isOfficialOrAdmin && (
            <button onClick={() => { setShowForm(true); loadProfiles() }} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Nueva guardia</button>
          )}
        </div>
      </div>

      <div className="surface p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input type="date" value={fechaDesde} onChange={(event) => setFechaDesde(event.target.value)} className="px-3 py-2 border rounded-lg" />
        <input type="date" value={fechaHasta} onChange={(event) => setFechaHasta(event.target.value)} className="px-3 py-2 border rounded-lg" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {showForm && (
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

            <select value={form.a_cargo_id} onChange={(event) => setForm({ ...form, a_cargo_id: event.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">{isEspecial ? 'A cargo (opcional)' : 'A cargo'}</option>
              {perfiles.map((perfil) => <option key={perfil.id} value={perfil.id}>{perfil.nombre} {perfil.apellido}</option>)}
            </select>

            <select value={form.conductor_id} onChange={(event) => setForm({ ...form, conductor_id: event.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">{isEspecial ? 'Conductor (opcional)' : 'Conductor'}</option>
              {perfiles.filter((perfil) => perfil.es_conductor_habilitado).map((perfil) => <option key={perfil.id} value={perfil.id}>{perfil.nombre} {perfil.apellido}</option>)}
            </select>

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
                    <input
                      type="checkbox"
                      checked={form.miembros.includes(perfil.id)}
                      onChange={() => toggleMiembro(perfil.id)}
                    />
                    <span>{perfil.nombre} {perfil.apellido}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Seleccionados: {form.miembros.length}</p>
            </div>

            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Crear</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="surface overflow-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold">Porcentajes de asistencia</h2>
          <p className="text-sm text-gray-500">Guardias finalizadas, citaciones y practicas dentro del filtro actual.</p>
        </div>
        <table className="w-full text-sm min-w-[1040px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Persona</th>
              <th className="p-2 text-left">Codigo</th>
              <th className="p-2 text-left">Categoria</th>
              <th className="p-2">Guardias</th>
              <th className="p-2">Citaciones</th>
              <th className="p-2">Practicas</th>
              <th className="p-2">General</th>
            </tr>
          </thead>
          <tbody>
            {porcentajeRows.length === 0 ? (
              <tr><td className="p-3 text-gray-500" colSpan={7}>No hay perfiles activos para calcular.</td></tr>
            ) : (
              porcentajeRows.map((row) => (
                <tr key={row.perfil.id} className="border-t">
                  <td className="p-2">{getNombre(row.perfil)}</td>
                  <td className="p-2">{row.perfil.codigo_interno || '-'}</td>
                  <td className="p-2">{row.categoria}</td>
                  <td className="p-2 text-center">{row.guardiasAsistidas}/{row.guardiasTotal} ({row.guardiasPct}%)</td>
                  <td className="p-2 text-center">{row.citacionesAsistidas}/{row.citacionesTotal} ({row.citacionesPct}%)</td>
                  <td className="p-2 text-center">
                    {row.incluyePracticas ? `${row.practicasAsistidas}/${row.practicasTotal} (${row.practicasPct}%)` : 'No aplica'}
                  </td>
                  <td className="p-2 text-center font-semibold">{row.generalPct}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="surface overflow-auto">
        <table className="w-full text-sm min-w-[920px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2">Tipo</th>
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
              return (
                <tr key={guardia.id} className="border-t">
                  <td className="p-2">{formatDateOnly(guardia.fecha)}</td>
                  <td className="p-2 capitalize">{guardia.tipo}</td>
                  <td className="p-2">{getNombre(guardia.a_cargo) || '-'}</td>
                  <td className="p-2">{getConductorTexto(guardia)}</td>
                  <td className="p-2">{guardia.miembrosTexto || '-'}</td>
                  <td className="p-2 text-center">
                    {finalizada ? `${getGuardiaAsistentesCount(guardia)} / ${perfiles.length}` : 'Pendiente'}
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

      {selectedGuardia && (
        <div className="surface p-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">Asistencia de guardia finalizada</p>
              <h2 className="text-xl font-semibold">{formatDateOnly(selectedGuardia.fecha)} - {selectedGuardia.hora_inicio} a {selectedGuardia.hora_fin}</h2>
            </div>
            <button onClick={closeAttendanceEditor} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">Cerrar</button>
          </div>

          <div className="overflow-auto border rounded-lg">
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Persona</th>
                  <th className="p-2">Automatico por ingreso</th>
                  <th className="p-2">Ajuste manual</th>
                  <th className="p-2">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {perfiles.map((perfil) => {
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
                          <option value="auto">Automatico</option>
                          <option value="presente">Presente</option>
                          <option value="ausente">Ausente</option>
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${resultado ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          {resultado ? 'Asistio' : 'No asistio'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={saveAttendanceOverrides}
              disabled={attendanceSaving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-60"
            >
              {attendanceSaving ? 'Guardando...' : 'Guardar asistencia'}
            </button>
            <button onClick={closeAttendanceEditor} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}
