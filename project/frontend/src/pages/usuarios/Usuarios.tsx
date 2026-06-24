import { useEffect, useState } from 'react'
import { createPerfil, getPerfiles, toggleUserStatus, updatePerfil } from '../../api/usuarios'
import { useAuth } from '../../hooks/useAuth'
import type { Perfil, RolUsuario } from '../../types'

const initialForm = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  codigo_interno: '',
  rol: 'bombero' as RolUsuario,
  es_conductor_habilitado: false,
  es_oficial_autorizante: false,
}

export default function Usuarios() {
  const { isAdmin } = useAuth()
  const [usuarios, setUsuarios] = useState<Perfil[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Perfil | null>(null)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const data = await getPerfiles()
    setUsuarios(data)
  }

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin])

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <div className="surface p-4 text-sm text-gray-600">Esta sección está disponible solo para administradores.</div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await updatePerfil(editing.id, {
          nombre: form.nombre,
          apellido: form.apellido,
          codigo_interno: form.codigo_interno || null,
          rol: form.rol,
          es_conductor_habilitado: form.es_conductor_habilitado,
          es_oficial_autorizante: form.es_oficial_autorizante,
        })
      } else {
        await createPerfil({
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          password: form.password,
          codigo_interno: form.codigo_interno,
          rol: form.rol,
          es_conductor_habilitado: form.es_conductor_habilitado,
          es_oficial_autorizante: form.es_oficial_autorizante,
          estado: 'activo',
        })
      }
      setShowForm(false)
      setEditing(null)
      setForm(initialForm)
      await load()
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el usuario.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (id: string, estado: string) => {
    setError('')
    try {
      const nuevo = estado === 'activo' ? 'inactivo' : 'activo'
      await toggleUserStatus(id, nuevo)
      await load()
    } catch (err: any) {
      setError(err.message || 'No se pudo cambiar el estado del usuario.')
    }
  }

  const startEdit = (u: Perfil) => {
    setEditing(u)
    setForm({
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      password: '',
      codigo_interno: u.codigo_interno || '',
      rol: u.rol,
      es_conductor_habilitado: u.es_conductor_habilitado,
      es_oficial_autorizante: u.es_oficial_autorizante,
    })
    setError('')
    setShowForm(true)
  }

  if (showForm) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h1>
          <p className="text-sm text-gray-500">Completá los datos principales, rol y permisos operativos.</p>
        </div>

        {error && <div className="surface p-3 text-sm text-red-700 bg-red-50 border border-red-100">{error}</div>}

        <div className="surface p-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input required placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input required placeholder="Apellido" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} className="px-3 py-2 border rounded-lg" />
            {!editing && <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="px-3 py-2 border rounded-lg" />}
            {!editing && <input required type="password" placeholder="Contraseña" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="px-3 py-2 border rounded-lg" />}
            <input placeholder="Código interno" value={form.codigo_interno} onChange={e => setForm({ ...form, codigo_interno: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value as RolUsuario })} className="px-3 py-2 border rounded-lg">
              <option value="bombero">Bombero</option>
              <option value="oficial">Oficial</option>
              <option value="admin">Admin</option>
            </select>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.es_conductor_habilitado} onChange={e => setForm({ ...form, es_conductor_habilitado: e.target.checked })} /> Conductor habilitado</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.es_oficial_autorizante} onChange={e => setForm({ ...form, es_oficial_autorizante: e.target.checked })} /> Oficial autorizante</label>
            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-60">{saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setError('') }} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-3">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <button
          onClick={() => {
            setEditing(null)
            setForm(initialForm)
            setError('')
            setShowForm(true)
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg"
        >
          Nuevo usuario
        </button>
      </div>

      {error && <div className="surface p-3 text-sm text-red-700 bg-red-50 border border-red-100">{error}</div>}

      <div className="surface overflow-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-gray-50"><tr><th className="p-2 text-left">Nombre</th><th>Apellido</th><th>Email</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
          <tbody>{usuarios.map(u => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.nombre}</td>
              <td className="p-2">{u.apellido}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2 capitalize">{u.rol}</td>
              <td className="p-2">{u.estado}</td>
              <td className="p-2 flex gap-2">
                <button onClick={() => startEdit(u)} className="text-blue-600 text-xs">Editar</button>
                <button onClick={() => handleToggleStatus(u.id, u.estado)} className="text-yellow-600 text-xs">{u.estado === 'activo' ? 'Desactivar' : 'Activar'}</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
