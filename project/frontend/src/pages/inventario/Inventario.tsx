import React, { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useParams } from 'react-router-dom'
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
  const { movilId = '' } = useParams()
  const [materiales, setMateriales] = useState<Material[]>([])
  const [inventario, setInventario] = useState<Record<string, number>>({})
  const [cantidad, setCantidad] = useState<Record<string, number>>({})
  const [origen, setOrigen] = useState<Record<string, 'deposito' | 'compania'>>({})
  const [motivo, setMotivo] = useState('')
  const [observacion, setObservacion] = useState('')

  useEffect(() => {
    getMateriales().then(setMateriales)
  }, [])

  const loadInventario = async () => {
    if (!movilId) {
      setInventario({})
      return
    }
    const data = await getInventarioMovil(movilId)
    const map: Record<string, number> = {}
    data.forEach((item) => {
      if (item.cantidad > 0) map[item.material_id] = item.cantidad
    })
    setInventario(map)
  }

  useEffect(() => {
    setCantidad({})
    setOrigen({})
    loadInventario()
  }, [movilId])

  const cargarMaterial = async (materialId: string) => {
    if (!movilId) return
    const qty = Number(cantidad[materialId] ?? 0)
    if (!Number.isFinite(qty) || qty <= 0) return

    await transferirInventario({
      material_id: materialId,
      cantidad: qty,
      origen_tipo: origen[materialId] ?? 'deposito',
      destino_tipo: 'movil',
      destino_ref: movilId,
      motivo: motivo || 'Carga de movil',
      observacion: observacion || null,
    })

    setCantidad((prev) => ({ ...prev, [materialId]: 0 }))
    await loadInventario()
  }

  const materialesConStock = materiales.filter((material) => inventario[material.id] > 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 surface p-3">
        <input placeholder="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="px-3 py-2 border rounded-lg" />
        <input placeholder="Observacion (opcional)" value={observacion} onChange={(e) => setObservacion(e.target.value)} className="px-3 py-2 border rounded-lg" />
      </div>

      <div className="surface overflow-auto">
        {materialesConStock.length === 0 ? (
          <p className="p-4 text-gray-500">No hay stock cargado en este movil.</p>
        ) : (
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50">
              <tr><th className="p-2 text-left">Material</th><th>Categoria</th><th>Stock movil</th><th>Origen</th><th>Cantidad</th><th></th></tr>
            </thead>
            <tbody>
              {materialesConStock.map((material) => (
                <tr key={material.id} className="border-t">
                  <td className="p-2">{material.nombre}</td>
                  <td className="p-2">{material.categoria}</td>
                  <td className="p-2 font-semibold">{inventario[material.id] ?? 0}</td>
                  <td className="p-2">
                    <select
                      value={origen[material.id] ?? 'deposito'}
                      onChange={(e) => setOrigen((prev) => ({ ...prev, [material.id]: e.target.value as 'deposito' | 'compania' }))}
                      className="px-2 py-1 border rounded"
                    >
                      <option value="deposito">Deposito</option>
                      <option value="compania">Compania</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={1}
                      max={inventario[material.id] ?? 0}
                      value={cantidad[material.id] ?? 0}
                      onChange={(e) => setCantidad((prev) => ({ ...prev, [material.id]: Number(e.target.value) || 0 }))}
                      className="w-24 px-2 py-1 border rounded"
                    />
                  </td>
                  <td className="p-2">
                    <button onClick={() => cargarMaterial(material.id)} className="text-blue-600 text-xs">Registrar carga</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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
  const [stockDestino, setStockDestino] = useState<Record<string, number>>({})
  const [stockOrigen, setStockOrigen] = useState<Record<string, number>>({})
  const [moviles, setMoviles] = useState<Vehiculo[]>([])
  const [materialesEditables, setMaterialesEditables] = useState<Material[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState(false)
  const [origen, setOrigen] = useState<Record<string, InventarioOrigenTipo>>({})
  const [origenMovil, setOrigenMovil] = useState<Record<string, string>>({})
  const [cantidad, setCantidad] = useState<Record<string, number>>({})
  const [motivo, setMotivo] = useState('')
  const [stockMoviles, setStockMoviles] = useState<Record<string, Record<string, number>>>({})

  const labelMap: Record<InventarioOrigenTipo, string> = {
    deposito: 'Deposito',
    compania: 'Compania',
    movil: 'Movil',
    externo: 'Externo',
  }

  const load = async () => {
    const stockActual = await getStock()
    const [movData, materialesAll, inventarioGeneral] = await Promise.all([
      getVehiculosDisponibles(),
      getMateriales(),
      getInventarioGlobal(),
    ])

    const stockActualConValor = (stockActual || []).filter((i) => (i.cantidad ?? 0) > 0)
    setData(stockActualConValor)
    setMoviles(movData)

    const destinoStock = Object.fromEntries(
      (stockActualConValor || []).map((item) => [item.material_id, item.cantidad])
    ) as Record<string, number>
    setStockDestino(destinoStock)

    const stockReferencia =
      destinoTipo === 'compania'
        ? await getInventarioDeposito()
        : await getInventarioCompania()

    const stockOrigenMap = Object.fromEntries(
      (stockReferencia || [])
        .filter((item) => (item.cantidad ?? 0) > 0)
        .map((item) => [item.material_id, item.cantidad])
    ) as Record<string, number>
    setStockOrigen(stockOrigenMap)

    const globalByMaterial = new Map<string, number>(
      ((inventarioGeneral as unknown as Array<{ material: string; total_general: number }>) || [])
        .map((item) => [String(item.material), Number(item.total_general ?? 0)])
    )

    const editables = materialesAll
      .filter((m) => (globalByMaterial.get(m.nombre) || 0) > 0)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))

    setMaterialesEditables(editables)

    setOrigen((prev) => ({
      ...prev,
      ...Object.fromEntries(editables.map((m) => [m.id, prev[m.id] || origenOpciones[0]])),
    }))
    setCantidad((prev) => ({
      ...prev,
      ...Object.fromEntries(editables.map((m) => [m.id, prev[m.id] || 0])),
    }))
  }

  useEffect(() => {
    setEditando(false)
    setBusqueda('')
    setOrigen({})
    setOrigenMovil({})
    setCantidad({})
    setMotivo('')
    setStockMoviles({})
    load()
  }, [destinoTipo, getStock])

  const getMaxCantidad = (materialId: string) => {
    const origenTipo = origen[materialId] || origenOpciones[0]
    if (origenTipo === 'externo') return Number.POSITIVE_INFINITY
    if (origenTipo === 'movil') {
      const movilId = origenMovil[materialId]
      if (!movilId) return 0
      return stockMoviles[movilId]?.[materialId] ?? 0
    }
    return stockOrigen[materialId] || 0
  }

  const ensureStockMovil = async (movilId: string) => {
    if (!movilId || stockMoviles[movilId]) return
    const data = await getInventarioMovil(movilId)
    const stockByMaterial = Object.fromEntries((data || []).map((item) => [item.material_id, item.cantidad])) as Record<string, number>
    setStockMoviles((prev) => ({ ...prev, [movilId]: stockByMaterial }))
  }

  const ajustarCantidad = (materialId: string, delta: number) => {
    setCantidad((prev) => {
      const origenTipo = origen[materialId] || origenOpciones[0]
      const max = getMaxCantidad(materialId)
      const actual = Math.max(0, Math.floor((prev[materialId] || 0)))
      const next = actual + delta
      if (origenTipo !== 'externo' && Number.isFinite(max)) {
        return { ...prev, [materialId]: Math.max(0, Math.min(max, next)) }
      }
      return { ...prev, [materialId]: Math.max(0, next) }
    })
  }

  const setCantidadDirecta = (materialId: string, valor: string) => {
    const value = Math.max(0, Number(valor) || 0)
    const max = getMaxCantidad(materialId)
    setCantidad((prev) => ({
      ...prev,
      [materialId]: Number.isFinite(max) ? Math.max(0, Math.min(max, value)) : value,
    }))
  }

  const registrar = async (materialId: string) => {
    const origenTipo = origen[materialId] || origenOpciones[0]
    const cantidadActual = Number(cantidad[materialId] || 0)
    if (cantidadActual <= 0) return

    const origenRef = origenTipo === 'movil' ? (origenMovil[materialId] || null) : null
    const max = getMaxCantidad(materialId)
    if (origenTipo === 'movil' && !origenRef) return
    if (Number.isFinite(max) && cantidadActual > max) return

    await transferirInventario({
      material_id: materialId,
      cantidad: cantidadActual,
      origen_tipo: origenTipo,
      origen_ref: origenRef,
      destino_tipo: destinoTipo,
      motivo: motivo || `Movimiento hacia ${titulo}`,
      observacion: null,
    })

    setCantidad((prev) => ({ ...prev, [materialId]: 0 }))
    await load()
  }

  const materialesVisibles = materialesEditables.filter((m) => {
    const q = busqueda.toLowerCase().trim()
    if (!q) return true
    return m.nombre.toLowerCase().includes(q) || m.categoria.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Stock actual en {titulo}</h2>
        <button
          onClick={() => setEditando((v) => !v)}
          className="px-4 py-2 rounded-lg border border-primary-600 text-primary-700"
        >
          {editando ? 'Cerrar editor' : 'Editar'}
        </button>
      </div>

      {!editando ? (
        <div className="surface overflow-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Material</th>
                <th className="p-2">Categoria</th>
                <th className="p-2">Stock en {titulo}</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td className="p-3 text-gray-500" colSpan={3}>No hay material con stock en esta ubicacion.</td></tr>
              ) : data.map((r) => (
                <tr key={r.material_id} className="border-t">
                  <td className="p-2">{r.material?.nombre}</td>
                  <td className="p-2">{r.material?.categoria}</td>
                  <td className="p-2">{r.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="surface p-3 flex gap-3 flex-wrap items-center">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar material"
              className="px-3 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo (opcional)"
              className="px-3 py-2 border rounded-lg flex-1 min-w-[200px]"
            />
          </div>
          <div className="surface overflow-auto">
            <table className="w-full text-sm min-w-[980px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Material</th>
                  <th className="p-2">Categoria</th>
                  <th className="p-2">Stock en {titulo}</th>
                  <th className="p-2">Origen</th>
                  <th className="p-2">Cant</th>
                  <th className="p-2">Accion</th>
                </tr>
              </thead>
              <tbody>
                {materialesVisibles.length === 0 ? (
                  <tr><td className="p-3 text-gray-500" colSpan={6}>No hay materiales con stock global para editar.</td></tr>
                ) : materialesVisibles.map((m) => {
                  const origenTipo = origen[m.id] || origenOpciones[0]
                  const movilId = origenMovil[m.id] || ''
                  const max = getMaxCantidad(m.id)
                  const stockTexto = Number.isFinite(max) ? String(max) : 'Sin limite'
                  const qty = cantidad[m.id] || 0

                  return (
                    <tr key={m.id} className="border-t">
                      <td className="p-2">{m.nombre}</td>
                      <td className="p-2">{m.categoria}</td>
                      <td className="p-2">{stockDestino[m.id] || 0}</td>
                      <td className="p-2">
                        <div className="space-y-2">
                          <select
                            value={origenTipo}
                            onChange={(e) => {
                              const value = e.target.value as InventarioOrigenTipo
                              setOrigen((prev) => ({ ...prev, [m.id]: value }))
                              if (value !== 'movil') {
                                setOrigenMovil((prev) => ({ ...prev, [m.id]: '' }))
                              }
                            }}
                            className="px-2 py-1 border rounded-lg"
                          >
                            {origenOpciones.map((o) => <option key={o} value={o}>{labelMap[o]}</option>)}
                          </select>
                          {origenTipo === 'movil' && (
                            <select
                              required
                              value={movilId}
                              onChange={async (e) => {
                                const selected = e.target.value
                                setOrigenMovil((prev) => ({ ...prev, [m.id]: selected }))
                                await ensureStockMovil(selected)
                                setCantidad((prev) => ({ ...prev, [m.id]: 0 }))
                              }}
                              className="px-2 py-1 border rounded-lg w-full"
                            >
                              <option value="">Movil origen</option>
                              {moviles.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                            </select>
                          )}
                          <p className="text-xs text-gray-600">Disponible: {stockTexto}</p>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => ajustarCantidad(m.id, -1)}
                            className="w-7 h-7 border rounded-lg"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={Number.isFinite(max) ? max : undefined}
                            value={qty}
                            onChange={(e) => setCantidadDirecta(m.id, e.target.value)}
                            className="w-20 px-2 py-1 border rounded-lg text-center"
                          />
                          <button
                            type="button"
                            onClick={() => ajustarCantidad(m.id, 1)}
                            className="w-7 h-7 border rounded-lg"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => registrar(m.id)}
                          className="px-3 py-1.5 bg-primary-600 text-white rounded-lg"
                          disabled={
                            qty <= 0 ||
                            (origenTipo === 'movil' && !movilId) ||
                            (origenTipo !== 'externo' && Number.isFinite(max) && qty > max)
                          }
                        >
                          Aplicar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
function InventarioGlobalView() {
  const [data, setData] = useState<Array<Record<string, unknown>>>([])
  useEffect(() => { getInventarioGlobal().then((v) => setData((v || []).filter((r: any) => Number(r.total_general ?? 0) > 0)) ) }, [])
  return (
    <div className="surface overflow-auto">
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
      <form onSubmit={registrar} className="surface p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      <div className="surface p-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
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

      <div className="surface overflow-auto">
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
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loadingVehiculos, setLoadingVehiculos] = useState(true)

  useEffect(() => {
    getVehiculosDisponibles()
      .then(setVehiculos)
      .finally(() => setLoadingVehiculos(false))
  }, [])

  const firstMovilPath = vehiculos[0] ? `/inventario/movil/${vehiculos[0].id}` : '/inventario/global'

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventario</h1>
      <div className="flex gap-4 border-b overflow-x-auto">
        {vehiculos.map((vehiculo) => (
          <NavLink
            key={vehiculo.id}
            to={`/inventario/movil/${vehiculo.id}`}
            className={({ isActive }) => `pb-2 whitespace-nowrap ${isActive ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
          >
            {vehiculo.nombre}
          </NavLink>
        ))}
        <NavLink to="/inventario/global" className={({ isActive }) => `pb-2 whitespace-nowrap ${isActive ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>Global</NavLink>
        <NavLink to="/inventario/compania" className={({ isActive }) => `pb-2 whitespace-nowrap ${isActive ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>Compania</NavLink>
        <NavLink to="/inventario/deposito" className={({ isActive }) => `pb-2 whitespace-nowrap ${isActive ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>Deposito</NavLink>
        <NavLink to="/inventario/ajustes" className={({ isActive }) => `pb-2 whitespace-nowrap ${isActive ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>Ajustes</NavLink>
        <NavLink to="/inventario/historial" className={({ isActive }) => `pb-2 whitespace-nowrap ${isActive ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}>Historial</NavLink>
      </div>
      {loadingVehiculos ? (
        <div className="surface p-4 text-sm text-gray-500">Cargando inventario...</div>
      ) : (
        <Routes>
          <Route path="movil" element={<Navigate to={firstMovilPath} replace />} />
          <Route path="movil/:movilId" element={<InventarioMovilView />} />
          <Route path="global" element={<InventarioGlobalView />} />
          <Route path="compania" element={<TransferToUbicacionView titulo="Compania" destinoTipo="compania" origenOpciones={['deposito', 'movil', 'externo']} getStock={getInventarioCompania} />} />
          <Route path="deposito" element={<TransferToUbicacionView titulo="Deposito" destinoTipo="deposito" origenOpciones={['compania', 'movil', 'externo']} getStock={getInventarioDeposito} />} />
          <Route path="ajustes" element={<AjustesMovimientosView />} />
          <Route path="historial" element={<HistorialMovimientosView />} />
          <Route path="*" element={<Navigate to={firstMovilPath} replace />} />
        </Routes>
      )}
    </div>
  )
}
