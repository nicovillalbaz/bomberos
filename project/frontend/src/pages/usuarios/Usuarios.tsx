import { useEffect, useState } from 'react'
import type { Perfil, RolUsuario } from '../../types'
import { getPerfiles, createPerfil, updatePerfil, toggleUserStatus } from '../../api/usuarios'

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Perfil | null>(null)
  const [form, setForm] = useState({ nombre:'', apellido:'', codigo_interno:'', rol:'bombero' as RolUsuario, es_conductor_habilitado:false, es_oficial_autorizante:false })

  const load = async () => { const data = await getPerfiles(); setUsuarios(data) }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) await updatePerfil(editing.id, form)
    else await createPerfil({ ...form, estado:'activo' })
    setShowForm(false); setEditing(null); setForm({ nombre:'', apellido:'', codigo_interno:'', rol:'bombero', es_conductor_habilitado:false, es_oficial_autorizante:false }); load()
  }

  const handleToggleStatus = async (id: string, estado: string) => {
    const nuevo = estado==='activo'?'inactivo':'activo'
    await toggleUserStatus(id, nuevo); load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Usuarios</h1><button onClick={()=>{setEditing(null);setShowForm(true)}} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Nuevo Usuario</button></div>
      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input required placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} className="px-3 py-2 border rounded-lg" />
            <input required placeholder="Apellido" value={form.apellido} onChange={e=>setForm({...form,apellido:e.target.value})} className="px-3 py-2 border rounded-lg" />
            <input placeholder="Código Interno" value={form.codigo_interno} onChange={e=>setForm({...form,codigo_interno:e.target.value})} className="px-3 py-2 border rounded-lg" />
            <select value={form.rol} onChange={e=>setForm({...form,rol:e.target.value as RolUsuario})} className="px-3 py-2 border rounded-lg">
              <option value="bombero">Bombero</option><option value="oficial">Oficial</option><option value="admin">Admin</option>
            </select>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.es_conductor_habilitado} onChange={e=>setForm({...form,es_conductor_habilitado:e.target.checked})} /> Conductor habilitado</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.es_oficial_autorizante} onChange={e=>setForm({...form,es_oficial_autorizante:e.target.checked})} /> Oficial autorizante</label>
            <div className="col-span-2 flex gap-2"><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">{editing?'Actualizar':'Crear'}</button><button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button></div>
          </form>
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="p-2 text-left">Nombre</th><th>Apellido</th><th>Rol</th><th>Estado</th><th>Conductor</th><th>Oficial</th><th></th></tr></thead>
          <tbody>{usuarios.map(u=>(
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.nombre}</td>
              <td className="p-2">{u.apellido}</td>
              <td className="p-2 capitalize">{u.rol}</td>
              <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${u.estado==='activo'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>{u.estado}</span></td>
              <td className="p-2 text-center">{u.es_conductor_habilitado?'✓':'-'}</td>
              <td className="p-2 text-center">{u.es_oficial_autorizante?'✓':'-'}</td>
              <td className="p-2 flex gap-2">
                <button onClick={()=>{setEditing(u);setForm({nombre:u.nombre,apellido:u.apellido,codigo_interno:u.codigo_interno||'',rol:u.rol,es_conductor_habilitado:u.es_conductor_habilitado,es_oficial_autorizante:u.es_oficial_autorizante});setShowForm(true)}} className="text-blue-600 text-xs">Editar</button>
                <button onClick={()=>handleToggleStatus(u.id,u.estado)} className="text-yellow-600 text-xs">{u.estado==='activo'?'Desactivar':'Activar'}</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
