import { useEffect, useMemo, useState } from 'react'
import { getAsistenciasForGuardias, getGuardias } from '../../api/guardias'
import { getCompanyPresenceEvents } from '../../api/novedades'
import { getServiciosByDateRange } from '../../api/servicios'
import { getActiveProfiles } from '../../api/usuarios'
import { useAuth } from '../../hooks/useAuth'
import { buildPresenceIntervals, resolveGuardiaAttendance, type PresenceEvent } from '../../lib/attendance'
import { getGuardiaInterval, getMonthRange, isDateFinished, isGuardiaFinalizada, toMonthInputValue } from '../../lib/datetime'
import { exportRowsToCSV, exportRowsToPrintablePDF } from '../../lib/export'
import type { Asistencia, Guardia, Perfil, Servicio } from '../../types'

type ReportTab = 'porcentajes' | 'servicios'
type ExportFormat = 'csv' | 'pdf'
type GuardiaMiembroItem = { miembro?: Perfil | null } | Perfil
type GuardiaConMiembros = Omit<Guardia, 'miembros'> & { miembros?: GuardiaMiembroItem[] }

type PercentageFields = {
  guardiasPct: number
  citacionesPct: number
  practicasPct: number
  totalPct: number
}

type PercentageRow = PercentageFields & {
  perfil: Perfil
  guardiasAsistidas: number
  guardiasTotal: number
  citacionesAsistidas: number
  citacionesTotal: number
  practicasAsistidas: number
  practicasTotal: number
}

type ServiceTotalRow = {
  tipo: string
  total: number
  finalizados: number
  borradores: number
}

const percent = (asistidas: number, total: number) => (total > 0 ? Math.round((asistidas / total) * 100) : 0)

const averageAvailable = (items: Array<{ total: number; pct: number }>) => {
  const available = items.filter((item) => item.total > 0)
  if (available.length === 0) return 0
  return Math.round(available.reduce((sum, item) => sum + item.pct, 0) / available.length)
}

const getNombre = (perfil?: Perfil | null) => `${perfil?.apellido ?? ''} ${perfil?.nombre ?? ''}`.trim()

const servicioTienePersona = (servicio: Servicio, perfilId: string) =>
  (servicio.personal || []).some((item) => item.persona_id === perfilId)

const normalizeServiceType = (tipo: string) => {
  if (!tipo) return 'Sin tipo'
  return tipo.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const clampPercent = (value: number) => {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

export default function Reportes() {
  const { isOfficialOrAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<ReportTab>('porcentajes')
  const [month, setMonth] = useState(toMonthInputValue())
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [guardias, setGuardias] = useState<GuardiaConMiembros[]>([])
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [presenceEvents, setPresenceEvents] = useState<PresenceEvent[]>([])
  const [citaciones, setCitaciones] = useState<Servicio[]>([])
  const [practicas, setPracticas] = useState<Servicio[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [editedPercentages, setEditedPercentages] = useState<Record<string, Partial<PercentageFields>>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const range = useMemo(() => getMonthRange(month), [month])
  const presenceIntervals = useMemo(() => buildPresenceIntervals(presenceEvents), [presenceEvents])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [perfilesData, guardiasData, serviciosData, citacionesData, practicasData] = await Promise.all([
        getActiveProfiles(),
        getGuardias(undefined, range.desde, range.hasta),
        getServiciosByDateRange(undefined, range.desde, range.hasta),
        getServiciosByDateRange(undefined, range.desde, range.hasta, 'citacion'),
        getServiciosByDateRange(undefined, range.desde, range.hasta, 'practica'),
      ])
      const guardiaData = guardiasData as GuardiaConMiembros[]
      const guardiaIds = guardiaData.map((guardia) => guardia.id)
      const latestGuardiaEnd = guardiaData.reduce<Date | null>((latest, guardia) => {
        const { fin } = getGuardiaInterval(guardia)
        return !latest || fin > latest ? fin : latest
      }, null)

      const [asistenciasData, presenceData] = await Promise.all([
        getAsistenciasForGuardias(guardiaIds),
        getCompanyPresenceEvents(latestGuardiaEnd?.toISOString()),
      ])

      setPerfiles(perfilesData)
      setGuardias(guardiaData)
      setServicios(serviciosData)
      setCitaciones(citacionesData)
      setPracticas(practicasData)
      setAsistencias(asistenciasData)
      setPresenceEvents(presenceData)
      setEditedPercentages({})
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los reportes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [month])

  const guardiasFinalizadas = useMemo(
    () => guardias.filter((guardia) => isGuardiaFinalizada(guardia)),
    [guardias],
  )

  const citacionesFinalizadas = useMemo(
    () => citaciones.filter((servicio) => isDateFinished(servicio.fecha)),
    [citaciones],
  )

  const practicasFinalizadas = useMemo(
    () => practicas.filter((servicio) => isDateFinished(servicio.fecha)),
    [practicas],
  )

  const percentageRows = useMemo<PercentageRow[]>(() => {
    return perfiles
      .map((perfil) => {
        const guardiasAsistidas = guardiasFinalizadas.filter((guardia) =>
          resolveGuardiaAttendance(perfil.id, guardia, asistencias, presenceIntervals),
        ).length
        const citacionesAsistidas = citacionesFinalizadas.filter((servicio) => servicioTienePersona(servicio, perfil.id)).length
        const practicasAsistidas = practicasFinalizadas.filter((servicio) => servicioTienePersona(servicio, perfil.id)).length
        const guardiasPct = percent(guardiasAsistidas, guardiasFinalizadas.length)
        const citacionesPct = percent(citacionesAsistidas, citacionesFinalizadas.length)
        const practicasPct = percent(practicasAsistidas, practicasFinalizadas.length)
        const totalPct = averageAvailable([
          { total: guardiasFinalizadas.length, pct: guardiasPct },
          { total: citacionesFinalizadas.length, pct: citacionesPct },
          { total: practicasFinalizadas.length, pct: practicasPct },
        ])

        return {
          perfil,
          guardiasAsistidas,
          guardiasTotal: guardiasFinalizadas.length,
          guardiasPct,
          citacionesAsistidas,
          citacionesTotal: citacionesFinalizadas.length,
          citacionesPct,
          practicasAsistidas,
          practicasTotal: practicasFinalizadas.length,
          practicasPct,
          totalPct,
        }
      })
      .sort((a, b) => getNombre(a.perfil).localeCompare(getNombre(b.perfil)))
  }, [asistencias, citacionesFinalizadas, guardiasFinalizadas, perfiles, practicasFinalizadas, presenceIntervals])

  const visiblePercentageRows = useMemo(() => {
    return percentageRows.map((row) => ({
      ...row,
      ...editedPercentages[row.perfil.id],
    }))
  }, [editedPercentages, percentageRows])

  const serviceTotals = useMemo<ServiceTotalRow[]>(() => {
    const map = new Map<string, ServiceTotalRow>()
    servicios
      .filter((servicio) => servicio.tipo !== 'citacion' && servicio.tipo !== 'practica')
      .forEach((servicio) => {
        const key = servicio.tipo || 'sin_tipo'
        const current = map.get(key) ?? { tipo: key, total: 0, finalizados: 0, borradores: 0 }
        current.total += 1
        if (servicio.estado === 'completo') current.finalizados += 1
        else current.borradores += 1
        map.set(key, current)
      })
    return [...map.values()].sort((a, b) => b.total - a.total || normalizeServiceType(a.tipo).localeCompare(normalizeServiceType(b.tipo)))
  }, [servicios])

  const monthLabel = useMemo(() => {
    const [year, monthNumber] = month.split('-').map(Number)
    return new Date(year, monthNumber - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }, [month])

  const updatePercentage = (perfilId: string, field: keyof PercentageFields, value: number) => {
    setEditedPercentages((prev) => ({
      ...prev,
      [perfilId]: {
        ...prev[perfilId],
        [field]: clampPercent(value),
      },
    }))
  }

  const buildPercentageExportRows = () => visiblePercentageRows.map((row) => ({
    voluntario: getNombre(row.perfil),
    codigo: row.perfil.codigo_interno ?? '',
    guardias: `${row.guardiasAsistidas}/${row.guardiasTotal}`,
    porcentaje_guardias: `${row.guardiasPct}%`,
    citaciones: `${row.citacionesAsistidas}/${row.citacionesTotal}`,
    porcentaje_citaciones: `${row.citacionesPct}%`,
    practicas: `${row.practicasAsistidas}/${row.practicasTotal}`,
    porcentaje_practicas: `${row.practicasPct}%`,
    porcentaje_total: `${row.totalPct}%`,
  }))

  const buildServiceExportRows = () => serviceTotals.map((row) => ({
    servicio: normalizeServiceType(row.tipo),
    total: row.total,
    finalizados: row.finalizados,
    borradores: row.borradores,
  }))

  const handleExport = () => {
    const rows = activeTab === 'porcentajes' ? buildPercentageExportRows() : buildServiceExportRows()
    if (rows.length === 0) {
      setError('No hay datos para exportar en esta pestana.')
      return
    }
    const filename = activeTab === 'porcentajes' ? `porcentajes_${month}` : `servicios_${month}`
    const title = activeTab === 'porcentajes' ? `Porcentajes ${monthLabel}` : `Servicios ${monthLabel}`
    if (exportFormat === 'pdf') {
      exportRowsToPrintablePDF(title, rows)
      return
    }
    exportRowsToCSV(rows, `${filename}.csv`)
  }

  if (!isOfficialOrAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <div className="surface p-4 text-sm text-gray-600">
          Esta seccion esta disponible para oficiales y administradores.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-sm text-gray-500">Vista operativa de {monthLabel}</p>
        </div>
        <div className="surface p-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600">Mes</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value || toMonthInputValue())}
              className="px-3 py-2 border rounded-lg"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600">Formato</span>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Exportar
          </button>
        </div>
      </div>

      <div className="surface p-1 flex gap-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('porcentajes')}
          className={`px-4 py-2 rounded-md text-sm ${activeTab === 'porcentajes' ? 'bg-red-50 text-red-800 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Porcentajes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('servicios')}
          className={`px-4 py-2 rounded-md text-sm ${activeTab === 'servicios' ? 'bg-red-50 text-red-800 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Servicios
        </button>
      </div>

      {error && <div className="surface p-3 text-sm text-red-700 bg-red-50 border border-red-100">{error}</div>}

      {loading ? (
        <div className="surface p-4 text-sm text-gray-500">Cargando reportes...</div>
      ) : activeTab === 'porcentajes' ? (
        <div className="surface overflow-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Voluntario</th>
                <th className="p-2 text-left">Codigo</th>
                <th className="p-2 text-left">Guardias</th>
                <th className="p-2 text-left">% Guardias</th>
                <th className="p-2 text-left">Citaciones</th>
                <th className="p-2 text-left">% Citaciones</th>
                <th className="p-2 text-left">Practicas</th>
                <th className="p-2 text-left">% Practicas</th>
                <th className="p-2 text-left">% Total</th>
              </tr>
            </thead>
            <tbody>
              {visiblePercentageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-500">Sin voluntarios activos.</td>
                </tr>
              ) : visiblePercentageRows.map((row) => (
                <tr key={row.perfil.id} className="border-t">
                  <td className="p-2 font-medium">{getNombre(row.perfil)}</td>
                  <td className="p-2 text-gray-500">{row.perfil.codigo_interno || '-'}</td>
                  <td className="p-2">{row.guardiasAsistidas}/{row.guardiasTotal}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.guardiasPct}
                      onChange={(e) => updatePercentage(row.perfil.id, 'guardiasPct', Number(e.target.value))}
                      className="w-20 px-2 py-1 border rounded-md"
                    />
                  </td>
                  <td className="p-2">{row.citacionesAsistidas}/{row.citacionesTotal}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.citacionesPct}
                      onChange={(e) => updatePercentage(row.perfil.id, 'citacionesPct', Number(e.target.value))}
                      className="w-20 px-2 py-1 border rounded-md"
                    />
                  </td>
                  <td className="p-2">{row.practicasAsistidas}/{row.practicasTotal}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.practicasPct}
                      onChange={(e) => updatePercentage(row.perfil.id, 'practicasPct', Number(e.target.value))}
                      className="w-20 px-2 py-1 border rounded-md"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.totalPct}
                      onChange={(e) => updatePercentage(row.perfil.id, 'totalPct', Number(e.target.value))}
                      className="w-20 px-2 py-1 border rounded-md font-semibold"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="surface overflow-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Servicio</th>
                <th className="p-2 text-left">Total</th>
                <th className="p-2 text-left">Finalizados</th>
                <th className="p-2 text-left">Borradores</th>
              </tr>
            </thead>
            <tbody>
              {serviceTotals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">Sin servicios en el mes.</td>
                </tr>
              ) : serviceTotals.map((row) => (
                <tr key={row.tipo} className="border-t">
                  <td className="p-2 font-medium">{normalizeServiceType(row.tipo)}</td>
                  <td className="p-2">{row.total}</td>
                  <td className="p-2">{row.finalizados}</td>
                  <td className="p-2">{row.borradores}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
