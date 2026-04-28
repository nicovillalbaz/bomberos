export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-AR')
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleString('es-AR')
}

export function getInitials(nombre: string, apellido: string): string {
  return `${nombre?.[0]||''}${apellido?.[0]||''}`.toUpperCase()
}
