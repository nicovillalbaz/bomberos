import { useEffect, useState } from 'react'
import type { Vehiculo, TipoVehiculo, EstadoVehiculo } from '../../types'
import { getVehiculos, createVehiculo, updateVehiculo, deleteVehiculo } from '../../api/vehiculos'

export default function Moviles() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Vehiculo | null>(null)
  const [form, setForm] = useState({ nombre: '', dominio: '', marca: '', modelo: '', anio: 0, tipo: 'camion' as TipoVehiculo, estado: 'disponible' as EstadoVehiculo })

  const load = async () => { setLoading(true); const data = await getVehiculos(); setVehiculos(data); setLoading(false) }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) await updateVehiculo(editing.id, form)
    else await createVehiculo({ ...form, anio: form.anio || undefined })
    setShowForm(false)
    setEditing(null)
    setForm({ nombre: '', dominio: '', marca: '', modelo: '', anio: 0, tipo: 'camion', estado: 'disponible' })
    load()
  }

  const handleEdit = (v: Vehiculo) => {
    setEditing(v)
    setForm({ nombre: v.nombre, dominio: v.dominio || '', marca: v.marca || '', modelo: v.modelo || '', anio: v.anio || 0, tipo: v.tipo, estado: v.estado })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Eliminar vehculo?')) { await deleteVehiculo(id); load() }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mviles</h1>
        <button onClick={() => { setEditing(null); setForm({ nombre: '', dominio: '', marca: '', modelo: '', anio: 0, tipo: 'camion', estado: 'disponible' }); setShowForm(true) }} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Nuevo</button>
      </div>
      {showForm && (
        <div className="surface p-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input required placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input placeholder="Dominio" value={form.dominio} onChange={e => setForm({ ...form, dominio: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input placeholder="Marca" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input placeholder="Modelo" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input type="number" placeholder="Ao" value={form.anio || ''} onChange={e => setForm({ ...form, anio: Number(e.target.value) })} className="px-3 py-2 border rounded-lg" />
            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as TipoVehiculo })} className="px-3 py-2 border rounded-lg">
              <option value="camion">Camin</option><option value="ambulancia">Ambulancia</option><option value="unidad_apoyo">Unidad apoyo</option><option value="otro">Otro</option>
            </select>
            <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as EstadoVehiculo })} className="px-3 py-2 border rounded-lg">
              <option value="disponible">Disponible</option><option value="en_salida">En salida</option><option value="en_mantenimiento">En mantenimiento</option><option value="fuera_servicio">Fuera de servicio</option>
            </select>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">{editing ? 'Actualizar' : 'Crear'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
            </div>
          </form>
        </div>
      )}
      {loading ? <p>Cargando...</p> : (
        <div className="surface overflow-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50"><tr><th className="p-2 text-left">Nombre</th><th>Dominio</th><th>Tipo</th><th>Estado</th><th>KM</th><th></th></tr></thead>
            <tbody>
              {vehiculos.map(v => (
                <tr key={v.id} className="border-t">
                  <td className="p-2 font-medium">{v.nombre}</td>
                  <td className="p-2">{v.dominio}</td>
                  <td className="p-2 capitalize">{v.tipo.replace('_', ' ')}</td>
                  <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${v.estado === 'disponible' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{v.estado.replace('_', ' ')}</span></td>
                  <td className="p-2">{v.ultimo_km}</td>
                  <td className="p-2 flex gap-2">
                    <button onClick={() => handleEdit(v)} className="text-blue-600 text-xs">Editar</button>
                    <button onClick={() => handleDelete(v.id)} className="text-red-600 text-xs">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
