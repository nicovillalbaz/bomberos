import { FormEvent, useState } from 'react'
import { changeOwnPassword } from '../../api/perfil'
import { useAuth } from '../../hooks/useAuth'

const initialForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export default function MiPerfil() {
  const { profile } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const validate = () => {
    if (!form.currentPassword) return 'Ingresá tu contraseña actual.'
    if (form.newPassword.length < 6) return 'La nueva contraseña debe tener al menos 6 caracteres.'
    if (form.newPassword !== form.confirmPassword) return 'La confirmación no coincide con la nueva contraseña.'
    if (form.currentPassword === form.newPassword) return 'La nueva contraseña debe ser distinta a la actual.'
    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      setSuccess('')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await changeOwnPassword(form.currentPassword, form.newPassword)
      setForm(initialForm)
      setSuccess('Contraseña actualizada correctamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <p className="text-sm text-gray-500">Datos de tu usuario y acceso.</p>
      </div>

      <section className="surface p-4">
        <h2 className="text-base font-semibold mb-3">Datos personales</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">Nombre completo</dt>
            <dd className="font-medium">{profile?.nombre} {profile?.apellido}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium">{profile?.email}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Código interno</dt>
            <dd className="font-medium">{profile?.codigo_interno || '-'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Rol</dt>
            <dd className="font-medium capitalize">{profile?.rol}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Conductor habilitado</dt>
            <dd className="font-medium">{profile?.es_conductor_habilitado ? 'Sí' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Oficial autorizante</dt>
            <dd className="font-medium">{profile?.es_oficial_autorizante ? 'Sí' : 'No'}</dd>
          </div>
        </dl>
      </section>

      <section className="surface p-4">
        <h2 className="text-base font-semibold mb-3">Cambiar contraseña</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            required
            type="password"
            autoComplete="current-password"
            placeholder="Contraseña actual"
            value={form.currentPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
            className="px-3 py-2 border rounded-lg"
          />
          <div className="hidden sm:block" />
          <input
            required
            type="password"
            autoComplete="new-password"
            placeholder="Nueva contraseña"
            value={form.newPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            required
            type="password"
            autoComplete="new-password"
            placeholder="Confirmar nueva contraseña"
            value={form.confirmPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            className="px-3 py-2 border rounded-lg"
          />

          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          {success && <p className="sm:col-span-2 text-sm text-green-700">{success}</p>}

          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-60">
              {saving ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setForm(initialForm)
                setError('')
                setSuccess('')
              }}
              className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-60"
            >
              Limpiar
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
