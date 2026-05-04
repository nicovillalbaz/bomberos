import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { getVehiculos } from '../../api/vehiculos'
import {
  getInventarioCompania,
  getInventarioDeposito,
  getInventarioGlobal,
  getInventarioMovil,
  getMateriales,
  updateInventarioMovil,
} from '../../api/inventario'
import type { InventarioMovil, Material, Vehiculo } from '../../types'

function InventarioMovilView() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])
  const [selected, setSelected] = useState('')
  const [inventario, setInventario] = useState<InventarioMovil[]>([])
  const [draft, setDraft] = useState<Record<string, number>>({})

  useEffect(() => {
    Promise.all([getVehiculos(), getMateriales()]).then(([v, m]) => {
      setVehiculos(v)
      setMateriales(m)
    })
  }, [])

  const loadInventario = async (movilId: string) => {
    setSelected(movilId)
    if (!movilId) {
      setInventario([])
      setDraft({})
      return
    }
    const data = await getInventarioMovil(movilId)
    setInventario(data)
    const nextDraft: Record<string, number> = {}
    data.forEach((i) => { nextDraft[i.material_id] = i.cantidad })
    setDraft(nextDraft)
  }

  const handleCantidadChange = (materialId: string, value: string) => {
    const parsed = Number(value)
    const safe = Number.isFinite(parsed) ? Math.max(0, parsed) : 0
    setDraft((prev) => ({ ...prev, [materialId]: safe }))
  }

  const handleGuardar = async (materialId: string) => {
    if (!selected) return
    await updateInventarioMovil(selected, materialId, Math.max(0, draft[materialId] ?? 0))
    await loadInventario(selected)
  }

  return (
    <div className="space-y-4">
      <select value={selected} onChange={(e) => loadInventario(e.target.value)} className="px-3 py-2 border rounded-lg">
        <option value="">Seleccionar móvil</option>
        {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
      </select>

      {selected && (
        <div className="bg-white rounded-lg shadow overflow-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead className="bg-gray-50">
              <tr><th className="p-2 text-left">Material</th><th>Categoría</th><th>Cantidad</th><th></th></tr>
            </thead>
            <tbody>
              {materiales.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="p-2">{m.nombre}</td>
                  <td className="p-2">{m.categoria}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      value={draft[m.id] ?? inventario.find((i) => i.material_id === m.id)?.cantidad ?? 0}
                      onChange={(e) => handleCantidadChange(m.id, e.target.value)}
                      className="w-24 px-2 py-1 border rounded"
                    />
                  </td>
                  <td className="p-2">
                    <button onClick={() => handleGuardar(m.id)} className="text-blue-600 text-xs">Guardar</button>
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

function InventarioGlobalView() {
  const [data, setData] = useState<Array<Record<string, unknown>>>([])
  useEffect(() => { getInventarioGlobal().then((v) => setData(v ?? [])) }, [])
  return (
    <div className="bg-white rounded-lg shadow overflow-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead className="bg-gray-50"><tr><th className="p-2 text-left">Material</th><th>Categoría</th><th>Móviles</th><th>Compañía</th><th>Depósito</th><th>Total</th></tr></thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{String(r.material ?? '')}</td>
              <td className="p-2">{String(r.categoria ?? '')}</td>
              <td className="p-2">{String(r.total_moviles ?? 0)}</td>
              <td className="p-2">{String(r.total_compania ?? 0)}</td>
              <td className="p-2">{String(r.total_deposito ?? 0)}</td>
              <td className="p-2 font-bold">{String(r.total_general ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InventarioCompaniaView() {
  const [data, setData] = useState<Array<Record<string, unknown>>>([])
  useEffect(() => { getInventarioCompania().then((v) => setData(v ?? [])) }, [])
  return <div className="bg-white rounded-lg shadow p-4">Inventario compañía: {data.length} ítems</div>
}

function InventarioDepositoView() {
  const [data, setData] = useState<Array<Record<string, unknown>>>([])
  useEffect(() => { getInventarioDeposito().then((v) => setData(v ?? [])) }, [])
  return <div className="bg-white rounded-lg shadow p-4">Inventario depósito: {data.length} ítems</div>
}

export default function Inventario() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventario</h1>
      <div className="flex gap-4 border-b overflow-x-auto">
        <NavLink to="/inventario/movil" className={({ isActive }) => `pb-2 whitespace-nowrap ${isActive ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>Móvil</NavLink>
        <NavLink to="/inventario/global" className={({ isActive }) => `pb-2 whitespace-nowrap ${isActive ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>Global</NavLink>
        <NavLink to="/inventario/compania" className={({ isActive }) => `pb-2 whitespace-nowrap ${isActive ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>Compañía</NavLink>
        <NavLink to="/inventario/deposito" className={({ isActive }) => `pb-2 whitespace-nowrap ${isActive ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>Depósito</NavLink>
      </div>
      <Routes>
        <Route path="movil" element={<InventarioMovilView />} />
        <Route path="global" element={<InventarioGlobalView />} />
        <Route path="compania" element={<InventarioCompaniaView />} />
        <Route path="deposito" element={<InventarioDepositoView />} />
        <Route path="*" element={<Navigate to="/inventario/movil" replace />} />
      </Routes>
    </div>
  )
}
