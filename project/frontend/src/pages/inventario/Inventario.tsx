import React, { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { getVehiculosDisponibles } from '../../api/vehiculos'
import {
  getInventarioCompania,
  getInventarioDeposito,
  getInventarioGlobal,
  getInventarioMovil,
  getMateriales,
  getMovimientosInventario,
  transferirInventario,
} from '../../api/inventario'
import { getActiveProfiles } from '../../api/usuarios'
import type {
  InventarioMovimiento,
  InventarioOrigenTipo,
  InventarioUbicacionItem,
  Material,
  Perfil,
  Vehiculo,
} from '../../types'

function InventarioMovilView() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])
  const [selected, setSelected] = useState('')
  const [inventario, setInventario] = useState<Record<string, number>>({})
  const [cantidad, setCantidad] = useState<Record<string, number>>({})
  const [origen, setOrigen] = useState<Record<string, 'deposito' | 'compania'>>({})
  const [motivo, setMotivo] = useState('')
  const [observacion, setObservacion] = useState('')

  useEffect(() => {
    Promise.all([getVehiculosDisponibles(), getMateriales()]).then(([v, m]) => {
      setVehiculos(v)
      setMateriales(m)
    })
  }, [])

  const loadInventario = async (movilId: string) => {
    setSelected(movilId)
    if (!movilId) {
      setInventario({})
      return
    }
    const data = await getInventarioMovil(movilId)
    const map: Record<string, number> = {}
    data.forEach((i) => { if (i.cantidad > 0) map[i.material_id] = i.cantidad })
    setInventario(map)
  }

  const cargarMaterial = async (materialId: string) => {
    if (!selected) return
    const qty = Number(cantidad[materialId] ?? 0)
    if (!Number.isFinite(qty) || qty <= 0) return

    await transferirInventario({
      material_id: materialId,
      cantidad: qty,
      origen_tipo: origen[materialId] ?? 'deposito',
      destino_tipo: 'movil',
      destino_ref: selected,
      motivo: motivo || 'Carga de móvil',
      observacion: observacion || null,
    })

    setCantidad((prev) => ({ ...prev, [materialId]: 0 }))
    await loadInventario(selected)
  }

  const materialesConStock = materiales.filter((m) => inventario[m.id] > 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-lg shadow">
        <select value={selected} onChange={(e) => loadInventario(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="">Seleccionar móvil</option>
          {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
        </select>
        <input placeholder="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="px-3 py-2 border rounded-lg" />
        <input placeholder="Observación (opcional)" value={observacion} onChange={(e) => setObservacion(e.target.value)} className="sm:col-span-2 px-3 py-2 border rounded-lg" />
      </div>

      {selected && (
        <div className="bg-white rounded-lg shadow overflow-auto">
          {materialesConStock.length === 0 ? (
            <p className="p-4 text-gray-500">No hay stock cargado en este móvil.</p>
          ) : (
            <table className="w-full text-sm min-w-[760px]">
              <thead className="bg-gray-50">
                <tr><th className="p-2 text-left">Material</th><th>Categoría</th><th>Stock móvil</th><th>Origen</th><th>Cantidad</th><th></th></tr>
              </thead>
              <tbody>
                {materialesConStock.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-2">{m.nombre}</td>
                    <td className="p-2">{m.categoria}</td>
                    <td className="p-2 font-semibold">{inventario[m.id] ?? 0}</td>
                    <td className="p-2">
                      <select
                        value={origen[m.id] ?? 'deposito'}
                        onChange={(e) => setOrigen((prev) => ({ ...prev, [m.id]: e.target.value as 'deposito' | 'compania' }))}
                        className="px-2 py-1 border rounded"
                      >
                        <option value="deposito">Depósito</option>
                        <option value="compania">Compañía</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={1}
                        max={inventario[m.id] ?? 0}
                        value={cantidad[m.id] ?? 0}
                        onChange={(e) => setCantidad((prev) => ({ ...prev, [m.id]: Number(e.target.value) || 0 }))}
                        className="w-24 px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <button onClick={() => cargarMaterial(m.id)} className="text-blue-600 text-xs">Registrar carga</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

function TransferToUbicacionView({
  titulo,
  destinoTipo,
  origenOpciones,
  getStock,
}: {
  titulo: string
  destinoTipo: 'compania' | 'deposito'
  origenOpciones: InventarioOrigenTipo[]
  getStock: () => Promise<InventarioUbicacionItem[]>
}) {
  const [data, setData] = useState<InventarioUbicacionItem[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [materialId, setMaterialId] = useState('')
  const [editing, setEditing] = useState('')
  const [origenTipo, setOrigenTipo] = useState<InventarioOrigenTipo>(origenOpciones[0])
  const [origenMovilId, setOrigenMovilId] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [motivo, setMotivo] = useState('')

  const load = async () => {
    const [stock, mats, movs] = await Promise.all([getStock(), getMateriales(), getVehiculosDisponibles()])
    setData(stock.filter((i) => (i.cantidad ?? 0) > 0))
    setMateriales(mats)
    setVehiculos(movs)
  }

  useEffect(() => { load() }, [])

  const startEdit = (item: InventarioUbicacionItem) => {
    setEditing(item.material_id)
    setMaterialId(item.material_id)
    setOrigenTipo(origenOpciones[0])
    setCantidad(Math.min(item.cantidad, 1))
    setMotivo(`Traslado de ${item.material?.nombre ?? 'material'} desde ${titulo.toLowerCase()} `)
    setOrigenMovilId('')
  }

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialId || cantidad <= 0) return
    await transferirInventario({
      material_id: materialId,
      cantidad,
      origen_tipo: origenTipo,
      origen_ref: origenTipo === 'movil' ? origenMovilId : null,
      destino_tipo: destinoTipo,
      motivo: motivo || `Movimiento hacia ${titulo}`,
      observacion: null,
    })
    setEditing('')
    setCantidad(1)
    setMaterialId('')
    setMotivo('')
    setOrigenMovilId('')
    await load()
  }

  const labelMap: Record<string, string> = {
    deposito: 'Depósito',
    compania: 'Compañía',
    movil: 'Móvil',
    externo: 'Externo',
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50"><tr><th className="p-2 text-left">Material</th><th className="p-2">Categoría</th><th className="p-2">Stock en {titulo}</th><th className="p-2">Origen</th><th className="p-2">Acción</th></tr></thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td className="p-3 text-gray-500" colSpan={5}>No hay stock para mostrar.</td></tr>
            ) : data.map((r) => (
              <React.Fragment key={r.material_id}>
                <tr className="border-t">
                  <td className="p-2">{r.material?.nombre}</td>
                  <td className="p-2">{r.material?.categoria}</td>
                  <td className="p-2">{r.cantidad}</td>
                  <td className="p-2">{labelMap[destinoTipo]}</td>
                  <td className="p-2">
                    <button
                      onClick={() => startEdit(r)}
                      className="text-primary-600 text-xs px-2 py-1 rounded border border-primary-200"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
                {editing === r.material_id && (
                  <tr className="bg-gray-50 border-t">
                    <td className="p-2" colSpan={5}>
                      <form onSubmit={registrar} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <select value={origenTipo} onChange={(e) => setOrigenTipo(e.target.value as InventarioOrigenTipo)} className="px-3 py-2 border rounded-lg">
                          {origenOpciones.map((o) => <option key={o} value={o}>{labelMap[o]}</option>)}
                        </select>
                        {origenTipo === 'movil' ? (
                          <select required value={origenMovilId} onChange={(e) => setOrigenMovilId(e.target.value)} className="px-3 py-2 border rounded-lg">
                            <option value="">Móvil origen</option>
                            {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                          </select>
                        ) : (
                          <input disabled value={labelMap[origenTipo]} className="px-3 py-2 border rounded-lg bg-gray-50" />
                        )}
                        <input
                          type="number"
                          min={1}
                          max={r.cantidad}
                          value={cantidad}
                          onChange={(e) => setCantidad(Number(e.target.value) || 1)}
                          className="px-3 py-2 border rounded-lg"
                        />
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Guardar movimiento</button>
                        <input
                          placeholder="Motivo (opcional)"
                          value={motivo}
                          onChange={(e) => setMotivo(e.target.value)}
                          className="sm:col-span-4 px-3 py-2 border rounded-lg"
                        />
                      </form>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InventarioGlobalView() {
  const [data, setData] = useState<Array<Record<string, unknown>>>([])
  useEffect(() => { getInventarioGlobal().then((v) => setData((v || []).filter((r: any) => Number(r.total_general ?? 0) > 0)) ) }, [])
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

function AjustesMovimientosView() {
  const [materiales, setMateriales] = useState<Material[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [materialId, setMaterialId] = useState('')
  const [origenTipo, setOrigenTipo] = useState<'deposito' | 'compania' | 'movil' | 'externo'>('deposito')
  const [destinoTipo, setDestinoTipo] = useState<'deposito' | 'compania' | 'movil' | 'consumo' | 'baja'>('consumo')
  const [origenMovilId, setOrigenMovilId] = useState('')
  const [destinoMovilId, setDestinoMovilId] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [motivo, setMotivo] = useState('')
  const [observacion, setObservacion] = useState('')

  useEffect(() => {
    Promise.all([getMateriales(), getVehiculosDisponibles()]).then(([m, v]) => {
      setMateriales(m)
      setVehiculos(v)
    })
  }, [])

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialId || cantidad <= 0) return

    await transferirInventario({
      material_id: materialId,
      cantidad,
      origen_tipo: origenTipo,
      origen_ref: origenTipo === 'movil' ? origenMovilId : null,
      destino_tipo: destinoTipo,
      destino_ref: destinoTipo === 'movil' ? destinoMovilId : null,
      motivo: motivo || (origenTipo === 'externo' ? 'Donación/ingreso externo' : 'Ajuste de inventario'),
      observacion: observacion || null,
    })

    setCantidad(1)
    setMotivo('')
    setObservacion('')
  }

  return (
    <div className="space-y-4">
      <form onSubmit={registrar} className="bg-white p-4 rounded-lg shadow grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select required value={materialId} onChange={(e) => setMaterialId(e.target.value)} className="px-3 py-2 border rounded-lg">
          <option value="">Material</option>
          {materiales.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <select value={origenTipo} onChange={(e) => setOrigenTipo(e.target.value as any)} className="px-3 py-2 border rounded-lg">
          <option value="deposito">Origen: Depósito</option>
          <option value="compania">Origen: Compañía</option>
          <option value="movil">Origen: Móvil</option>
          <option value="externo">Origen: Externo (donación)</option>
        </select>
        <select value={destinoTipo} onChange={(e) => setDestinoTipo(e.target.value as any)} className="px-3 py-2 border rounded-lg">
          <option value="deposito">Destino: Depósito</option>
          <option value="compania">Destino: Compañía</option>
          <option value="movil">Destino: Móvil</option>
          <option value="consumo">Destino: Consumo</option>
          <option value="baja">Destino: Baja/Descarte</option>
        </select>
        {origenTipo === 'movil' && (
          <select required value={origenMovilId} onChange={(e) => setOrigenMovilId(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="">Móvil origen</option>
            {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>
        )}
        {destinoTipo === 'movil' && (
          <select required value={destinoMovilId} onChange={(e) => setDestinoMovilId(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="">Móvil destino</option>
            {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
          </select>
        )}
        <input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value) || 1)} className="px-3 py-2 border rounded-lg" />
        <input placeholder="Motivo (ej: rotura, descarte, donación)" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="px-3 py-2 border rounded-lg" />
        <input placeholder="Observación" value={observacion} onChange={(e) => setObservacion(e.target.value)} className="sm:col-span-3 px-3 py-2 border rounded-lg" />
        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Registrar movimiento</button>
      </form>
      <p className="text-sm text-gray-600">Usá este formulario para registrar donaciones (origen externo) y bajas por rotura/descarte (destino baja o consumo).</p>
    </div>
  )
}

function HistorialMovimientosView() {
  const [movimientos, setMovimientos] = useState<InventarioMovimiento[]>([])
  const [materiales, setMateriales] = useState<Material[]>([])
  const [usuarios, setUsuarios] = useState<Perfil[]>([])
  const [filtros, setFiltros] = useState({ material_id: '', fecha_desde: '', fecha_hasta: '', ubicacion: '', usuario_id: '' })

  const load = async () => {
    const data = await getMovimientosInventario({
      material_id: filtros.material_id || undefined,
      fecha_desde: filtros.fecha_desde || undefined,
      fecha_hasta: filtros.fecha_hasta || undefined,
      ubicacion: (filtros.ubicacion as 'deposito' | 'compania' | 'movil') || undefined,
      usuario_id: filtros.usuario_id || undefined,
    })
    setMovimientos(data)
  }

  useEffect(() => {
    Promise.all([getMateriales(), getActiveProfiles()]).then(([m, u]) => {
      setMateriales(m)
      setUsuarios(u)
    })
    load()
  }, [])

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 sm:grid-cols-5 gap-3">
        <select value={filtros.material_id} onChange={(e) => setFiltros((prev) => ({ ...prev, material_id: e.target.value }))} className="px-3 py-2 border rounded-lg">
          <option value="">Todos los materiales</option>
          {materiales.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <select value={filtros.ubicacion} onChange={(e) => setFiltros((prev) => ({ ...prev, ubicacion: e.target.value }))} className="px-3 py-2 border rounded-lg">
          <option value="">Todas las ubicaciones</option>
          <option value="deposito">Depósito</option>
          <option value="compania">Compañía</option>
          <option value="movil">Móvil</option>
        </select>
        <input type="date" value={filtros.fecha_desde} onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_desde: e.target.value }))} className="px-3 py-2 border rounded-lg" />
        <input type="date" value={filtros.fecha_hasta} onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_hasta: e.target.value }))} className="px-3 py-2 border rounded-lg" />
        <select value={filtros.usuario_id} onChange={(e) => setFiltros((prev) => ({ ...prev, usuario_id: e.target.value }))} className="px-3 py-2 border rounded-lg">
          <option value="">Todos los usuarios</option>
          {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
        </select>
        <button onClick={load} className="sm:col-span-5 px-4 py-2 bg-primary-600 text-white rounded-lg">Filtrar historial</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="w-full text-sm min-w-[980px]">
          <thead className="bg-gray-50"><tr><th className="p-2 text-left">Fecha</th><th>Material</th><th>Cantidad</th><th>Origen</th><th>Destino</th><th>Motivo</th><th>Usuario</th></tr></thead>
          <tbody>
            {movimientos.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-2">{new Date(m.created_at).toLocaleString()}</td>
                <td className="p-2">{m.material as unknown as string}</td>
                <td className="p-2">{m.cantidad}</td>
                <td className="p-2">{m.origen_nombre || m.origen_tipo}</td>
                <td className="p-2">{m.destino_nombre || m.destino_tipo}</td>
                <td className="p-2">{m.motivo || '-'}</td>
                <td className="p-2">{m.usuario as unknown as string}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
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
        <NavLink to="/inventario/ajustes" className={({ isActive }) => `pb-2 whitespace-nowrap ${isActive ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>Ajustes</NavLink>
        <NavLink to="/inventario/historial" className={({ isActive }) => `pb-2 whitespace-nowrap ${isActive ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>Historial</NavLink>
      </div>
      <Routes>
        <Route path="movil" element={<InventarioMovilView />} />
        <Route path="global" element={<InventarioGlobalView />} />
        <Route path="compania" element={<TransferToUbicacionView titulo="Compañía" destinoTipo="compania" origenOpciones={['deposito', 'movil', 'externo']} getStock={getInventarioCompania} />} />
        <Route path="deposito" element={<TransferToUbicacionView titulo="Depósito" destinoTipo="deposito" origenOpciones={['compania', 'movil', 'externo']} getStock={getInventarioDeposito} />} />
        <Route path="ajustes" element={<AjustesMovimientosView />} />
        <Route path="historial" element={<HistorialMovimientosView />} />
        <Route path="*" element={<Navigate to="/inventario/movil" replace />} />
      </Routes>
    </div>
  )
}
