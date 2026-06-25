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
type PerfilCategoria = 'Combatiente' | 'Activo'
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
  categoria: PerfilCategoria
  incluyePracticas: boolean
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
}

const percent = (asistidas: number, total: number, emptyPercent: number) =>
  total > 0 ? Math.round((asistidas / total) * 100) : emptyPercent

const averagePercentages = (items: number[]) =>
  items.length > 0 ? Math.round(items.reduce((sum, item) => sum + item, 0) / items.length) : 0

const getNombre = (perfil?: Perfil | null) => `${perfil?.apellido ?? ''} ${perfil?.nombre ?? ''}`.trim()

const isSystemAdminProfile = (perfil: Perfil) =>
  perfil.email?.toLowerCase() === 'admin@bomberos.local' ||
  `${perfil.nombre} ${perfil.apellido}`.trim().toLowerCase() === 'admin sistema'

const isGuardiaMiembroRelacion = (item: GuardiaMiembroItem): item is { miembro?: Perfil | null } =>
  Object.prototype.hasOwnProperty.call(item, 'miembro')

const getMiembroPerfil = (item: GuardiaMiembroItem): Perfil | null | undefined => {
  if (isGuardiaMiembroRelacion(item)) return item.miembro
  return item
}

const guardiaTienePersona = (guardia: GuardiaConMiembros, perfilId: string) =>
  guardia.a_cargo_id === perfilId ||
  guardia.conductor_id === perfilId ||
  (guardia.miembros || []).some((item) => getMiembroPerfil(item)?.id === perfilId)

// Citaciones y prácticas usan servicio_personal como fuente actual de asistencia/participación.
const servicioTienePersona = (servicio: Servicio, perfilId: string) =>
  (servicio.personal || []).some((item) => item.persona_id === perfilId)

const getPerfilCategoria = (perfil: Perfil): PerfilCategoria => {
  const codigo = (perfil.codigo_interno || '').trim().toUpperCase()
  if (codigo.startsWith('VA') || codigo.startsWith('BVA') || codigo.includes('ACTIVO')) return 'Activo'
  return 'Combatiente'
}

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

      setPerfiles(perfilesData.filter((perfil) => !isSystemAdminProfile(perfil)))
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
        const guardiasAsignadas = guardiasFinalizadas.filter((guardia) => guardiaTienePersona(guardia, perfil.id))
        const guardiasAsistidas = guardiasAsignadas.filter((guardia) =>
          resolveGuardiaAttendance(perfil.id, guardia, asistencias, presenceIntervals),
        ).length
        const citacionesAsistidas = citacionesFinalizadas.filter((servicio) => servicioTienePersona(servicio, perfil.id)).length
        const practicasAsistidas = practicasFinalizadas.filter((servicio) => servicioTienePersona(servicio, perfil.id)).length
        const categoria = getPerfilCategoria(perfil)
        const incluyePracticas = categoria === 'Combatiente'
        const guardiasPct = percent(guardiasAsistidas, guardiasAsignadas.length, 0)
        const citacionesPct = percent(citacionesAsistidas, citacionesFinalizadas.length, 100)
        const practicasPct = incluyePracticas ? percent(practicasAsistidas, practicasFinalizadas.length, 100) : 100
        const totalPct = averagePercentages([
          guardiasPct,
          citacionesPct,
          ...(incluyePracticas ? [practicasPct] : []),
        ])

        return {
          perfil,
          categoria,
          incluyePracticas,
          guardiasAsistidas,
          guardiasTotal: guardiasAsignadas.length,
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
        const current = map.get(key) ?? { tipo: key, total: 0 }
        current.total += 1
        map.set(key, current)
      })
    return [...map.values()].sort((a, b) => b.total - a.total || normalizeServiceType(a.tipo).localeCompare(normalizeServiceType(b.tipo)))
  }, [servicios])

  const serviceGrandTotal = useMemo(
    () => serviceTotals.reduce((sum, row) => sum + row.total, 0),
    [serviceTotals],
  )

  const monthLabel = useMemo(() => {
    const [year, monthNumber] = month.split('-').map(Number)
    return new Date(year, monthNumber - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }, [month])

  const updatePercentage = (perfilId: string, field: keyof PercentageFields, value: number) => {
    const row = visiblePercentageRows.find((item) => item.perfil.id === perfilId)
    if (!row) return
    const nextValue = clampPercent(value)

    setEditedPercentages((prev) => ({
      ...prev,
      [perfilId]: {
        ...prev[perfilId],
        [field]: nextValue,
        ...(field === 'totalPct' ? {} : {
          totalPct: averagePercentages([
            field === 'guardiasPct' ? nextValue : prev[perfilId]?.guardiasPct ?? row.guardiasPct,
            field === 'citacionesPct' ? nextValue : prev[perfilId]?.citacionesPct ?? row.citacionesPct,
            ...(row.incluyePracticas ? [field === 'practicasPct' ? nextValue : prev[perfilId]?.practicasPct ?? row.practicasPct] : []),
          ]),
        }),
      },
    }))
  }

  const buildPercentageExportRows = () => visiblePercentageRows.map((row) => ({
    nombre_completo: getNombre(row.perfil),
    codigo: row.perfil.codigo_interno ?? '',
    porcentaje_guardias: `${row.guardiasPct}%`,
    porcentaje_citaciones: `${row.citacionesPct}%`,
    porcentaje_practicas: row.incluyePracticas ? `${row.practicasPct}%` : 'No aplica',
    porcentaje_total: `${row.totalPct}%`,
  }))

  const buildServiceExportRows = () => serviceTotals.map((row) => ({
    servicio: normalizeServiceType(row.tipo),
    total: row.total,
  })).concat(serviceTotals.length > 0 ? [{ servicio: 'TOTAL', total: serviceGrandTotal }] : [])

  const handleExport = (format: 'csv' | 'pdf') => {
    const rows = activeTab === 'porcentajes' ? buildPercentageExportRows() : buildServiceExportRows()
    if (rows.length === 0) {
      setError('No hay datos para exportar en esta pestaña.')
      return
    }
    const filename = activeTab === 'porcentajes' ? `porcentajes_${month}` : `servicios_${month}`
    const title = activeTab === 'porcentajes' ? `Porcentajes ${monthLabel}` : `Servicios ${monthLabel}`
    if (format === 'pdf') {
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
          Esta sección está disponible para oficiales y administradores.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-sm text-gray-500">Reporte de {monthLabel}</p>
        </div>
        <div className="surface p-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-600">Mes del reporte</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value || toMonthInputValue())}
              className="px-3 py-2 border rounded-lg"
            />
          </label>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg"
          >
            Exportar PDF
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
                <th className="p-2 text-left">Código</th>
                <th className="p-2 text-left">Categoría</th>
                <th className="p-2 text-left">Guardias</th>
                <th className="p-2 text-left">% Guardias</th>
                <th className="p-2 text-left">Citaciones</th>
                <th className="p-2 text-left">% Citaciones</th>
                <th className="p-2 text-left">Prácticas</th>
                <th className="p-2 text-left">% Prácticas</th>
                <th className="p-2 text-left">% Total</th>
              </tr>
            </thead>
            <tbody>
              {visiblePercentageRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-4 text-center text-gray-500">Sin voluntarios activos.</td>
                </tr>
              ) : visiblePercentageRows.map((row) => (
                <tr key={row.perfil.id} className="border-t">
                  <td className="p-2 font-medium">{getNombre(row.perfil)}</td>
                  <td className="p-2 text-gray-500">{row.perfil.codigo_interno || '-'}</td>
                  <td className="p-2 text-gray-500">{row.categoria}</td>
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
                  <td className="p-2">{row.incluyePracticas ? `${row.practicasAsistidas}/${row.practicasTotal}` : 'No aplica'}</td>
                  <td className="p-2">
                    {row.incluyePracticas ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={row.practicasPct}
                        onChange={(e) => updatePercentage(row.perfil.id, 'practicasPct', Number(e.target.value))}
                        className="w-20 px-2 py-1 border rounded-md"
                      />
                    ) : (
                      <span className="text-gray-500">No aplica</span>
                    )}
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
              </tr>
            </thead>
            <tbody>
              {serviceTotals.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-4 text-center text-gray-500">Sin servicios en el mes.</td>
                </tr>
              ) : (
                <>
                  {serviceTotals.map((row) => (
                    <tr key={row.tipo} className="border-t">
                      <td className="p-2 font-medium">{normalizeServiceType(row.tipo)}</td>
                      <td className="p-2">{row.total}</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-gray-50 font-semibold">
                    <td className="p-2">TOTAL</td>
                    <td className="p-2">{serviceGrandTotal}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
