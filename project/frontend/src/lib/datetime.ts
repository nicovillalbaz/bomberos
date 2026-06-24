import type { Guardia } from '../types'

export const toDateInputValue = (date = new Date()) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const toMonthInputValue = (date = new Date()) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}`
}

export const parseDateOnly = (date: string) => {
  const [datePart] = date.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const formatDateOnly = (date: string | null | undefined) => {
  if (!date) return '-'
  return parseDateOnly(date).toLocaleDateString('es-AR')
}

export const getMonthRange = (monthValue: string) => {
  const [year, month] = monthValue.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return {
    desde: toDateInputValue(start),
    hasta: toDateInputValue(end),
  }
}

export const getCurrentMonthRange = (date = new Date()) => {
  const range = getMonthRange(toMonthInputValue(date))
  return {
    ...range,
    monthValue: toMonthInputValue(date),
    label: date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }),
  }
}

export const combineDateAndTime = (date: string, time: string) => {
  const base = parseDateOnly(date)
  const [hours, minutes] = time.split(':').map(Number)
  base.setHours(hours || 0, minutes || 0, 0, 0)
  return base
}

export const getGuardiaInterval = (guardia: Pick<Guardia, 'fecha' | 'hora_inicio' | 'hora_fin'>) => {
  const inicio = combineDateAndTime(guardia.fecha, guardia.hora_inicio)
  const fin = combineDateAndTime(guardia.fecha, guardia.hora_fin)
  if (fin <= inicio) fin.setDate(fin.getDate() + 1)
  return { inicio, fin }
}

export const isGuardiaFinalizada = (guardia: Pick<Guardia, 'fecha' | 'hora_inicio' | 'hora_fin'>, now = new Date()) => {
  return getGuardiaInterval(guardia).fin <= now
}

export const isDateFinished = (date: string, now = new Date()) => {
  const end = parseDateOnly(date)
  end.setHours(23, 59, 59, 999)
  return end <= now
}
