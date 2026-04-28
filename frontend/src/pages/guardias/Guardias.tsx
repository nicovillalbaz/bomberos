import { useEffect, useState } from 'react'
import type { Guardia, Perfil } from '../../types'
import { getGuardias, createGuardia, markAsistencia } from '../../api/guardias'
import { getActiveProfiles } from '../../api/usuarios'

export default function Guardias() {
  const [guardias, setGuardias] = useState<any[]>([])
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [showForm, setShowForm] = useState(false)
  const [fecha] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState({ fecha, tipo:'voluntaria' as 'voluntaria'|'rentada', a_cargo_id:'', conductor_id:'', miembros:[] as string[] })

  const load = async () => { const data = await getGuardias(); setGuardias(data) }
  const loadProfiles = async () => { const data = await getActiveProfiles(); setPerfiles(data) }
  useEffect(() => { load(); loadProfiles() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createGuardia({ ...form, hora_inicio: form.tipo==='voluntaria'?'22:00':'07:00', hora_fin: form.tipo==='voluntaria'?'06:00':'18:00' })
    setShowForm(false); load()
  }

  const handleQuickAction = async (tipo: 'ingreso'|'salida'|'asistencia_guardia'|'accion_realizada', accion: string) => {
    await markAsistencia({ tipo, accion, guardia_id: guardias[0]?.id })
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Guardias</h1>
        <div className="flex gap-2">
          <button onClick={()=>handleQuickAction('ingreso','Ingreso rápido')} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Ingreso</button>
          <button onClick={()=>handleQuickAction('salida','Salida rápida')} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Salida</button>
          <button onClick={()=>{setShowForm(true); loadProfiles()}} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Nueva Guardia</button>
        </div>
      </div>
      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input type="date" required value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})} className="px-3 py-2 border rounded-lg" />
            <select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value as any})} className="px-3 py-2 border rounded-lg">
              <option value="voluntaria">Voluntaria</option><option value="rentada">Rentada</option>
            </select>
            <select value={form.a_cargo_id} onChange={e=>setForm({...form,a_cargo_id:e.target.value})} className="px-3 py-2 border rounded-lg">
              <option value="">A cargo</option>{perfiles.map(p=><option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
            <select value={form.conductor_id} onChange={e=>setForm({...form,conductor_id:e.target.value})} className="px-3 py-2 border rounded-lg">
              <option value="">Conductor</option>{perfiles.filter(p=>p.es_conductor_habilitado).map(p=><option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
            </select>
            <div className="col-span-2"><label className="text-sm">Miembros</label>
              <select multiple value={form.miembros} onChange={e=>setForm({...form,miembros:Array.from(e.target.selectedOptions,o=>o.value)})} className="w-full px-3 py-2 border rounded-lg h-32">
                {perfiles.map(p=><option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex gap-2"><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Crear</button><button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button></div>
          </form>
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="p-2 text-left">Fecha</th><th>Tipo</th><th>Horario</th><th>A Cargo</th><th>Miembros</th></tr></thead>
          <tbody>
            {guardias.map(g => (
              <tr key={g.id} className="border-t">
                <td className="p-2">{new Date(g.fecha).toLocaleDateString()}</td>
                <td className="p-2 capitalize">{g.tipo}</td>
                <td className="p-2">{g.hora_inicio} - {g.hora_fin}</td>
                <td className="p-2">{g.a_cargo?.nombre} {g.a_cargo?.apellido}</td>
                <td className="p-2">{g.miembros?.length || 0} miembros</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
