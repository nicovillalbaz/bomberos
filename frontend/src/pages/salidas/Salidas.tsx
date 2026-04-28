import { useEffect, useState } from 'react'
import type { Salida } from '../../types'
import { getSalidas, createSalida, completeSalida } from '../../api/salidas'
import { getVehiculosDisponibles } from '../../api/vehiculos'
import { getConductores } from '../../api/usuarios'
import type { Vehiculo, Perfil } from '../../types'

export default function Salidas() {
  const [salidas, setSalidas] = useState<Salida[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [conductores, setConductores] = useState<Perfil[]>([])
  const [showForm, setShowForm] = useState(false)
  const [completing, setCompleting] = useState<Salida | null>(null)
  const [form, setForm] = useState({ vehiculo_id:'', conductor_id:'', destino:'', motivo:'', km_salida:0 })
  const [kmLlegada, setKmLlegada] = useState('')

  const load = async () => { const data = await getSalidas(); setSalidas(data) }
  const loadAux = async () => { const [v,c] = await Promise.all([getVehiculosDisponibles(), getConductores()]); setVehiculos(v); setConductores(c) }
  useEffect(() => { load(); loadAux() }, [])

  const handleVehiculoChange = async (id: string) => {
    setForm({...form, vehiculo_id: id})
    if (id) {
      const last = await import('../../api/salidas').then(m => m.getLastSalidaByVehiculo(id))
      if (last) setForm(f => ({...f, km_salida: last.km_llegada || 0}))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createSalida({ ...form, hay_combustible: false, fecha_salida: new Date().toISOString() })
    setShowForm(false); setForm({ vehiculo_id:'', conductor_id:'', destino:'', motivo:'', km_salida:0 }); load()
  }

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (completing && Number(kmLlegada) >= (completing.km_salida || 0)) {
      await completeSalida(completing.id, Number(kmLlegada))
      setCompleting(null); setKmLlegada(''); load()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between"><h1 className="text-2xl font-bold">Salidas</h1><button onClick={()=>{setShowForm(true); loadAux()}} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Nueva Salida</button></div>
      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <select required value={form.vehiculo_id} onChange={e=>handleVehiculoChange(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">Seleccionar vehículo</option>
              {vehiculos.map(v=><option key={v.id} value={v.id}>{v.nombre} - {v.dominio}</option>)}
            </select>
            <select value={form.conductor_id} onChange={e=>setForm({...form,conductor_id:e.target.value})} className="px-3 py-2 border rounded-lg">
              <option value="">Seleccionar conductor</option>
              {conductores.map(c=><option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
            </select>
            <input required placeholder="Destino" value={form.destino} onChange={e=>setForm({...form,destino:e.target.value})} className="px-3 py-2 border rounded-lg" />
            <input required placeholder="Motivo" value={form.motivo} onChange={e=>setForm({...form,motivo:e.target.value})} className="px-3 py-2 border rounded-lg" />
            <input required type="number" placeholder="KM Salida" value={form.km_salida||''} onChange={e=>setForm({...form,km_salida:Number(e.target.value)})} className="px-3 py-2 border rounded-lg" />
            <div className="col-span-2 flex gap-2"><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Crear</button><button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button></div>
          </form>
        </div>
      )}
      {completing && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Completar Salida - KM actual: {completing.km_salida}</h3>
          <form onSubmit={handleComplete} className="flex gap-4 items-end">
            <div><label className="text-sm">KM Llegada</label><input type="number" required value={kmLlegada} onChange={e=>setKmLlegada(e.target.value)} className="px-3 py-2 border rounded-lg" /></div>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Completar</button>
            <button type="button" onClick={()=>setCompleting(null)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
          </form>
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="p-2 text-left">Fecha</th><th>Vehículo</th><th>Conductor</th><th>Destino</th><th>KM Salida</th><th>KM Llegada</th><th></th></tr></thead>
          <tbody>
            {salidas.map(s => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{new Date(s.fecha_salida).toLocaleDateString()}</td>
                <td className="p-2">{s.vehiculo?.nombre}</td>
                <td className="p-2">{s.conductor ? `${s.conductor.nombre} ${s.conductor.apellido}` : s.conductor_rentado_nombre}</td>
                <td className="p-2">{s.destino}</td>
                <td className="p-2">{s.km_salida}</td>
                <td className="p-2">{s.km_llegada || '-'}</td>
                <td className="p-2">{!s.km_llegada && <button onClick={()=>setCompleting(s)} className="text-green-600 text-xs">Completar</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
