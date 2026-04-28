import { useEffect, useState } from 'react'
import { useParams, NavLink, Routes, Route } from 'react-router-dom'
import { getVehiculos } from '../../api/vehiculos'
import { getMateriales, getInventarioMovil, updateInventarioMovil, getInventarioGlobal, getInventarioCompania, getInventarioDeposito } from '../../api/inventario'
import type { Vehiculo, Material, InventarioMovil } from '../../types'

function InventarioMovilView() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [selected, setSelected] = useState('')
  const [inventario, setInventario] = useState<InventarioMovil[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])

  const load = async () => { const [v,m] = await Promise.all([getVehiculos(), getMateriales()]); setVehiculos(v); setMateriales(m) }
  useEffect(() => { load() }, [])

  const loadInventario = async (id: string) => { setSelected(id); const data = await getInventarioMovil(id); setInventario(data) }
  const handleUpdate = async (materialId: string, cantidad: number) => { await updateInventarioMovil(selected, materialId, cantidad); loadInventario(selected) }

  return (
    <div className="space-y-4">
      <select value={selected} onChange={e=>loadInventario(e.target.value)} className="px-3 py-2 border rounded-lg">
        <option value="">Seleccionar móvil</option>
        {vehiculos.map(v=><option key={v.id} value={v.id}>{v.nombre}</option>)}
      </select>
      {selected && (
        <div className="bg-white rounded-lg shadow overflow-auto">
          <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-2 text-left">Material</th><th>Categoría</th><th>Cantidad</th><th></th></tr></thead>
            <tbody>{materiales.map(m => {
              const inv = inventario.find(i=>i.material_id===m.id)
              return <tr key={m.id} className="border-t"><td className="p-2">{m.nombre}</td><td className="p-2">{m.categoria}</td>
                <td className="p-2"><input type="number" defaultValue={inv?.cantidad||0} className="w-20 px-2 py-1 border rounded" id={`qty-${m.id}`} /></td>
                <td className="p-2"><button onClick={()=>handleUpdate(m.id, Number((document.getElementById(`qty-${m.id}`) as HTMLInputElement)?.value||0))} className="text-blue-600 text-xs">Actualizar</button></td>
              </tr>
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function InventarioGlobalView() {
  const [data, setData] = useState<any[]>([])
  useEffect(() => { getInventarioGlobal().then(setData) }, [])
  return (
    <div className="bg-white rounded-lg shadow overflow-auto">
      <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-2 text-left">Material</th><th>Categoría</th><th>Móviles</th><th>Compañía</th><th>Depósito</th><th>Total</th></tr></thead>
        <tbody>{data.map((r:any,i)=><tr key={i} className="border-t"><td className="p-2">{r.material}</td><td className="p-2">{r.categoria}</td><td className="p-2">{r.total_moviles}</td><td className="p-2">{r.total_compania}</td><td className="p-2">{r.total_deposito}</td><td className="p-2 font-bold">{r.total_general}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

function InventarioCompaniaView() {
  const [data, setData] = useState<any[]>([])
  useEffect(() => { getInventarioCompania().then(setData) }, [])
  return <div className="bg-white rounded-lg shadow p-4">Inventario Compañía: {data.length} items</div>
}

function InventarioDepositoView() {
  const [data, setData] = useState<any[]>([])
  useEffect(() => { getInventarioDeposito().then(setData) }, [])
  return <div className="bg-white rounded-lg shadow p-4">Inventario Depósito: {data.length} items</div>
}

export default function Inventario() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventario</h1>
      <div className="flex gap-4 border-b">
        <NavLink to="/inventario/movil" className={({isActive})=>`pb-2 ${isActive?'border-b-2 border-primary-600 text-primary-600':'text-gray-500'}`}>Móvil</NavLink>
        <NavLink to="/inventario/global" className={({isActive})=>`pb-2 ${isActive?'border-b-2 border-primary-600 text-primary-600':'text-gray-500'}`}>Global</NavLink>
        <NavLink to="/inventario/compania" className={({isActive})=>`pb-2 ${isActive?'border-b-2 border-primary-600 text-primary-600':'text-gray-500'}`}>Compañía</NavLink>
        <NavLink to="/inventario/deposito" className={({isActive})=>`pb-2 ${isActive?'border-b-2 border-primary-600 text-primary-600':'text-gray-500'}`}>Depósito</NavLink>
      </div>
      <Routes>
        <Route path="movil" element={<InventarioMovilView />} />
        <Route path="global" element={<InventarioGlobalView />} />
        <Route path="compania" element={<InventarioCompaniaView />} />
        <Route path="deposito" element={<InventarioDepositoView />} />
        <Route path="*" element={<Navigate to="/inventario/movil" />} />
      </Routes>
    </div>
  )
}

import { Navigate } from 'react-router-dom'
