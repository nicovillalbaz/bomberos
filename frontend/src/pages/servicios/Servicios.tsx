import { useEffect, useState } from 'react'
import type { Servicio } from '../../types'
import { getServicios, createServicio, updateServicio } from '../../api/servicios'
import { getActiveProfiles } from '../../api/usuarios'
import { getVehiculosDisponibles } from '../../api/vehiculos'

export default function Servicios() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [tab, setTab] = useState<'borrador'|'completo'>('borrador')
  const [showForm, setShowForm] = useState(false)
  const [conductores, setConductores] = useState<any[]>([])
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [form, setForm] = useState({ fecha:'', tipo:'', lugar:'', descripcion:'', movil_id:'', conductor_id:'', estado:'borrador' as 'borrador'|'completo' })

  const load = async () => { const data = await getServicios(tab); setServicios(data) }
  const loadAux = async () => { const [c,v] = await Promise.all([getActiveProfiles(), getVehiculosDisponibles()]); setConductores(c); setVehiculos(v) }
  useEffect(() => { load() }, [tab])
  useEffect(() => { loadAux() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createServicio({ ...form, fecha: form.fecha || new Date().toISOString() })
    setShowForm(false); setForm({ fecha:'', tipo:'', lugar:'', descripcion:'', movil_id:'', conductor_id:'', estado:'borrador' }); load()
  }

  const handleComplete = async (id: string) => { await updateServicio(id, { estado:'completo' }); load() }

  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Servicios</h1><button onClick={()=>{setShowForm(true); loadAux()}} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Nuevo Servicio</button></div>
      <div className="flex gap-4">
        {(['borrador','completo'] as const).map(t=><button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-lg ${tab===t?'bg-primary-600 text-white':'bg-gray-200'}`}>{t==='borrador'?'Borradores':'Completos'}</button>)}
      </div>
      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})} className="px-3 py-2 border rounded-lg" />
            <input required placeholder="Tipo (10.40, 10.41...)" value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})} className="px-3 py-2 border rounded-lg" />
            <input placeholder="Lugar" value={form.lugar} onChange={e=>setForm({...form,lugar:e.target.value})} className="px-3 py-2 border rounded-lg" />
            <select value={form.movil_id} onChange={e=>setForm({...form,movil_id:e.target.value})} className="px-3 py-2 border rounded-lg">
              <option value="">Sin vehículo</option>{vehiculos.map(v=><option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
            <select value={form.conductor_id} onChange={e=>setForm({...form,conductor_id:e.target.value})} className="px-3 py-2 border rounded-lg">
              <option value="">Conductor</option>{conductores.map(c=><option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
            </select>
            <textarea placeholder="Descripción" value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} className="px-3 py-2 border rounded-lg col-span-2" />
            <div className="col-span-2 flex gap-2"><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Crear</button><button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button></div>
          </form>
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="p-2 text-left">Fecha</th><th>Tipo</th><th>Lugar</th><th>Vehículo</th><th>Estado</th><th></th></tr></thead>
          <tbody>{servicios.map(s=>(
            <tr key={s.id} className="border-t">
              <td className="p-2">{new Date(s.fecha).toLocaleDateString()}</td>
              <td className="p-2">{s.tipo}</td>
              <td className="p-2">{s.lugar}</td>
              <td className="p-2">{s.movil?.nombre||'-'}</td>
              <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${s.estado==='completo'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>{s.estado}</span></td>
              <td className="p-2">{s.estado==='borrador'&&<button onClick={()=>handleComplete(s.id)} className="text-green-600 text-xs">Completar</button>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
