import { useEffect, useState } from 'react'
import type { NovedadGlobal } from '../../types'
import { getNovedades, createNovedadManual } from '../../api/novedades'

export default function Novedades() {
  const [novedades, setNovedades] = useState<NovedadGlobal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ tipo:'general', titulo:'', descripcion:'', modulo_origen:'manual' })

  const load = async () => { const data = await getNovedades(100); setNovedades(data) }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createNovedadManual(form)
    setShowForm(false); setForm({ tipo:'general', titulo:'', descripcion:'', modulo_origen:'manual' }); load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Novedades</h1><button onClick={()=>setShowForm(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Nueva Novedad</button></div>
      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required placeholder="Título" value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} className="w-full px-3 py-2 border rounded-lg">
              <option value="general">General</option><option value="vehiculo">Vehículo</option><option value="personal">Personal</option><option value="inventario">Inventario</option><option value="servicio">Servicio</option>
            </select>
            <textarea placeholder="Descripción" value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            <div className="flex gap-2"><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Crear</button><button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button></div>
          </form>
        </div>
      )}
      <div className="space-y-3">
        {novedades.map(n => (
          <div key={n.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between"><h3 className="font-semibold">{n.titulo}</h3><span className={`text-xs px-2 py-1 rounded ${n.origen==='automatico'?'bg-blue-100 text-blue-800':'bg-gray-100'}`}>{n.origen}</span></div>
            <p className="text-sm text-gray-600 mt-1">{n.descripcion}</p>
            <p className="text-xs text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()} - {n.usuario?.nombre} {n.usuario?.apellido}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
