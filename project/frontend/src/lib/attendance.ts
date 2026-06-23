import type { Asistencia, Guardia, NovedadGlobal } from '../types'
import { getGuardiaInterval } from './datetime'

export type PresenceEvent = Pick<NovedadGlobal, 'id' | 'usuario_id' | 'titulo' | 'descripcion' | 'created_at' | 'usuario'>
export type ManualAttendanceState = 'auto' | 'presente' | 'ausente'

type PresenceInterval = {
  inicio: Date
  fin: Date | null
}

const normalize = (value: string | null | undefined) => (value ?? '').toLowerCase()

export const isPresenceEntry = (event: PresenceEvent) => {
  const text = normalize(`${event.titulo} ${event.descripcion}`)
  return text.includes('ingres')
}

export const isPresenceExit = (event: PresenceEvent) => {
  const text = normalize(`${event.titulo} ${event.descripcion}`)
  return text.includes('retir') || text.includes('salida de la compania') || text.includes('salida de la compañia')
}

export const buildPresenceIntervals = (events: PresenceEvent[]) => {
  const sorted = [...events].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const openEntries = new Map<string, Date>()
  const intervals = new Map<string, PresenceInterval[]>()

  sorted.forEach((event) => {
    const userId = event.usuario_id
    if (isPresenceEntry(event)) {
      if (!openEntries.has(userId)) openEntries.set(userId, new Date(event.created_at))
      return
    }

    if (isPresenceExit(event)) {
      const inicio = openEntries.get(userId)
      if (!inicio) return
      const userIntervals = intervals.get(userId) ?? []
      userIntervals.push({ inicio, fin: new Date(event.created_at) })
      intervals.set(userId, userIntervals)
      openEntries.delete(userId)
    }
  })

  openEntries.forEach((inicio, userId) => {
    const userIntervals = intervals.get(userId) ?? []
    userIntervals.push({ inicio, fin: null })
    intervals.set(userId, userIntervals)
  })

  return intervals
}

export const isPresentDuring = (
  intervalsByUser: Map<string, PresenceInterval[]>,
  userId: string,
  inicio: Date,
  fin: Date,
) => {
  const intervals = intervalsByUser.get(userId) ?? []
  return intervals.some((interval) => interval.inicio < fin && (!interval.fin || interval.fin > inicio))
}

export const getManualGuardiaState = (
  asistencias: Asistencia[],
  guardiaId: string,
  userId: string,
): ManualAttendanceState => {
  const latest = asistencias
    .filter((item) => item.guardia_id === guardiaId && item.usuario_id === userId && item.tipo === 'asistencia_guardia')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  if (!latest) return 'auto'
  if (latest.accion.includes('manual_ausente')) return 'ausente'
  if (latest.accion.includes('manual_auto')) return 'auto'
  if (latest.accion.includes('manual_presente') || latest.accion === 'asistencia_guardia') return 'presente'
  return 'auto'
}

export const resolveGuardiaAttendance = (
  userId: string,
  guardia: Pick<Guardia, 'id' | 'fecha' | 'hora_inicio' | 'hora_fin'>,
  asistencias: Asistencia[],
  intervalsByUser: Map<string, PresenceInterval[]>,
) => {
  const manual = getManualGuardiaState(asistencias, guardia.id, userId)
  if (manual === 'presente') return true
  if (manual === 'ausente') return false
  const { inicio, fin } = getGuardiaInterval(guardia)
  return isPresentDuring(intervalsByUser, userId, inicio, fin)
}
