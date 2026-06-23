import { useEffect, useMemo, useState } from 'react'
import { getAsistenciasForGuardias, getGuardias, markAsistencia } from '../../api/guardias'
import { getServiciosByDateRange } from '../../api/servicios'
import { useAuth } from '../../hooks/useAuth'
import { getManualGuardiaState } from '../../lib/attendance'
import { formatDateOnly, getCurrentMonthRange } from '../../lib/datetime'
import type { Asistencia, Guardia, Perfil, Servicio } from '../../types'

type GuardiaMiembroItem = { miembro?: Perfil | null } | Perfil
type GuardiaConMiembros = Omit<Guardia, 'miembros'> & { miembros?: GuardiaMiembroItem[] }

type ActividadRow = {
  id: string
  kind: 'guardia' | 'citacion' | 'practica' | 'servicio'
  fecha: string
  horario: string
  titulo: string
  detalle: string
  estado: string
  guardia?: GuardiaConMiembros
}

const getNombre = (perfil?: Perfil | null) =>
  `${perfil?.nombre ?? ''} ${perfil?.apellido ?? ''}`.trim()

const getMiembroPerfil = (item: GuardiaMiembroItem): Perfil | null | undefined => {
  if (Object.prototype.hasOwnProperty.call(item, 'miembro')) {
    return (item as { miembro?: Perfil | null }).miembro
  }
  return item as Perfil
}

const isUsuarioEnGuardia = (guardia: GuardiaConMiembros, userId: string) => {
  if (guardia.a_cargo_id === userId || guardia.conductor_id === userId) return true
  return (guardia.miembros || []).some((item) => getMiembroPerfil(item)?.id === userId)
}

const isUsuarioEnServicio = (servicio: Servicio, userId: string) => {
  if (servicio.a_cargo_id === userId || servicio.conductor_id === userId) return true
  return (servicio.personal || []).some((item) => item.persona_id === userId)
}

const getServicioKind = (servicio: Servicio): ActividadRow['kind'] => {
  if (servicio.tipo === 'citacion') return 'citacion'
  if (servicio.tipo === 'practica') return 'practica'
  return 'servicio'
}

const getServicioTitulo = (servicio: Servicio) => {
  if (servicio.tipo === 'citacion') return 'Citacion'
  if (servicio.tipo === 'practica') return 'Practica'
  return `Servicio: ${servicio.tipo}`
}

export default function MisActividades() {
  const { profile } = useAuth()
  const [guardias, setGuardias] = useState<GuardiaConMiembros[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const currentMonth = useMemo(() => getCurrentMonthRange(), [])

  const load = async () => {
    if (!profile?.id) return
    setLoading(true)
    setError('')
    try {
      const [guardiasData, serviciosData] = await Promise.all([
        getGuardias(undefined, currentMonth.desde, currentMonth.hasta),
        getServiciosByDateRange(undefined, currentMonth.desde, currentMonth.hasta),
      ])
      const propiasGuardias = (guardiasData as GuardiaConMiembros[]).filter((guardia) =>
        isUsuarioEnGuardia(guardia, profile.id)
      )
      const propiosServicios = serviciosData.filter((servicio) => isUsuarioEnServicio(servicio, profile.id))
      const asistenciaData = await getAsistenciasForGuardias(propiasGuardias.map((guardia) => guardia.id))

      setGuardias(propiasGuardias)
      setServicios(propiosServicios)
      setAsistencias(asistenciaData)
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar tus actividades.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [profile?.id])

  const rows = useMemo<ActividadRow[]>(() => {
    if (!profile?.id) return []

    const guardiaRows: ActividadRow[] = guardias.map((guardia) => {
      const asistencia = getManualGuardiaState(asistencias, guardia.id, profile.id)
      return {
        id: `guardia-${guardia.id}`,
        kind: 'guardia',
        fecha: guardia.fecha,
        horario: `${guardia.hora_inicio} a ${guardia.hora_fin}`,
        titulo: `Guardia ${guardia.tipo}`,
        detalle: [
          getNombre(guardia.a_cargo) ? `A cargo: ${getNombre(guardia.a_cargo)}` : '',
          getNombre(guardia.conductor) ? `Conductor: ${getNombre(guardia.conductor)}` : '',
        ].filter(Boolean).join(' | ') || 'Guardia asignada',
        estado: asistencia === 'presente' ? 'Asistido' : 'Pendiente',
        guardia,
      }
    })

    const servicioRows: ActividadRow[] = servicios.map((servicio) => ({
      id: `servicio-${servicio.id}`,
      kind: getServicioKind(servicio),
      fecha: servicio.fecha,
      horario: [servicio.hora_salida, servicio.hora_regreso].filter(Boolean).join(' a ') || '-',
      titulo: getServicioTitulo(servicio),
      detalle: [
        servicio.lugar ? `Lugar: ${servicio.lugar}` : '',
        servicio.movil?.nombre ? `Movil: ${servicio.movil.nombre}` : '',
        servicio.descripcion || '',
      ].filter(Boolean).join(' | ') || 'Actividad asignada',
      estado: servicio.estado,
    }))

    return [...guardiaRows, ...servicioRows].sort((a, b) => {
      const dateDiff = new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      if (dateDiff !== 0) return dateDiff
      return a.horario.localeCompare(b.horario)
    })
  }, [asistencias, guardias, profile?.id, servicios])

  const markGuardia = async (guardia: GuardiaConMiembros) => {
    setSavingId(guardia.id)
    setError('')
    try {
      await markAsistencia({
        guardia_id: guardia.id,
        tipo: 'asistencia_guardia',
        accion: 'asistencia_guardia',
        observaciones: 'Marcado desde Mis actividades',
      })
      await load()
    } catch (err: any) {
      setError(err.message || 'No se pudo marcar la asistencia.')
    } finally {
      setSavingId(null)
    }
  }

  const totals = useMemo(() => ({
    guardias: rows.filter((row) => row.kind === 'guardia').length,
    citaciones: rows.filter((row) => row.kind === 'citacion').length,
    practicas: rows.filter((row) => row.kind === 'practica').length,
    servicios: rows.filter((row) => row.kind === 'servicio').length,
  }), [rows])

  if (loading) return <div className="text-center py-8">Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="page-heading">
        <div>
          <h1 className="text-2xl font-bold">Mis actividades</h1>
          <p className="text-sm text-gray-500">Actividades asignadas en {currentMonth.label}.</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="surface p-4"><p className="text-sm text-gray-500">Guardias</p><p className="text-2xl font-bold">{totals.guardias}</p></div>
        <div className="surface p-4"><p className="text-sm text-gray-500">Citaciones</p><p className="text-2xl font-bold">{totals.citaciones}</p></div>
        <div className="surface p-4"><p className="text-sm text-gray-500">Practicas</p><p className="text-2xl font-bold">{totals.practicas}</p></div>
        <div className="surface p-4"><p className="text-sm text-gray-500">Servicios</p><p className="text-2xl font-bold">{totals.servicios}</p></div>
      </div>

      <div className="surface overflow-auto">
        <table className="w-full text-sm min-w-[920px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-left">Actividad</th>
              <th className="p-2 text-left">Detalle</th>
              <th className="p-2">Estado</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="p-3 text-gray-500" colSpan={6}>No tenes actividades asignadas este mes.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{formatDateOnly(row.fecha)}<div className="text-xs text-gray-500">{row.horario}</div></td>
                <td className="p-2 capitalize">{row.kind}</td>
                <td className="p-2 font-medium">{row.titulo}</td>
                <td className="p-2 text-gray-600">{row.detalle}</td>
                <td className="p-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${row.estado === 'Asistido' || row.estado === 'completo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {row.estado}
                  </span>
                </td>
                <td className="p-2 text-right">
                  {row.guardia && row.estado !== 'Asistido' && (
                    <button
                      onClick={() => markGuardia(row.guardia as GuardiaConMiembros)}
                      disabled={savingId === row.guardia.id}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs disabled:opacity-60"
                    >
                      {savingId === row.guardia.id ? 'Marcando...' : 'Marcar asistido'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
