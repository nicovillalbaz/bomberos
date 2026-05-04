import { useEffect, useMemo, useState } from 'react'
import { createSalida, getLastSalidaByVehiculo, getSalidasByDateRange, updateSalida } from '../../api/salidas'
import { getConductores, getOficiales } from '../../api/usuarios'
import { getVehiculosDisponibles } from '../../api/vehiculos'
import { exportRowsToCSV } from '../../lib/export'
import type { Perfil, Salida, Vehiculo } from '../../types'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const initialForm = {
  vehiculo_id: '',
  conductor_id: '',
  conductor_rentado_nombre: '',
  destino: '',
  motivo: '',
  motivo_descripcion: '',
  km_salida: 0,
  km_llegada: 0,
  hay_combustible: false,
  monto_combustible: '',
  autorizacion_id: '',
  observacion: '',
}

export default function Salidas() {
  const [salidas, setSalidas] = useState<Salida[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [conductores, setConductores] = useState<Perfil[]>([])
  const [oficiales, setOficiales] = useState<Perfil[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Salida | null>(null)
  const [form, setForm] = useState(initialForm)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [pageSize, setPageSize] = useState(25)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  const isRentado = form.conductor_id === 'rentado'
  const isMotivoOtro = form.motivo.trim().toLowerCase() === 'otro'

  const load = async () => {
    const data = await getSalidasByDateRange(fechaDesde || undefined, fechaHasta || undefined)
    setSalidas(data)
  }

  const loadAux = async () => {
    const [v, c, o] = await Promise.all([getVehiculosDisponibles(), getConductores(), getOficiales()])
    setVehiculos(v)
    setConductores(c)
    setOficiales(o)
  }

  useEffect(() => {
    load()
    loadAux()
  }, [])

  const selectedVehiculo = useMemo(() => vehiculos.find((v) => v.id === form.vehiculo_id), [vehiculos, form.vehiculo_id])
  const paginated = useMemo(() => salidas.slice((page - 1) * pageSize, page * pageSize), [salidas, page, pageSize])
  const totalPages = Math.max(1, Math.ceil(salidas.length / pageSize))

  const handleVehiculoChange = async (id: string) => {
    setForm((prev) => ({ ...prev, vehiculo_id: id }))
    if (!id) return
    const last = await getLastSalidaByVehiculo(id)
    if (last?.km_llegada != null) {
      setForm((prev) => ({ ...prev, km_salida: last.km_llegada ?? 0 }))
      return
    }
    const current = vehiculos.find((v) => v.id === id)
    setForm((prev) => ({ ...prev, km_salida: current?.ultimo_km ?? 0 }))
  }

  const validate = (): string | null => {
    if (!form.vehiculo_id) return 'Selecciona un vehículo.'
    if (!form.destino.trim()) return 'Destino es obligatorio.'
    if (!form.motivo.trim()) return 'Motivo es obligatorio.'
    if (form.km_salida < 0 || form.km_llegada < 0) return 'Los kilómetros no pueden ser negativos.'
    if (form.km_llegada < form.km_salida) return 'KM llegada debe ser mayor o igual a KM salida.'
    if (isRentado && !form.conductor_rentado_nombre.trim()) return 'Nombre de conductor rentado es obligatorio.'
    if (isMotivoOtro && !form.motivo_descripcion.trim()) return 'Descripción de motivo es obligatoria para motivo Otro.'
    if (form.hay_combustible) {
      const monto = Number(form.monto_combustible)
      if (!Number.isFinite(monto) || monto <= 0) return 'Monto de combustible debe ser mayor a 0.'
    }
    return null
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    await createSalida({
      vehiculo_id: form.vehiculo_id,
      conductor_id: isRentado ? null : (form.conductor_id || null),
      conductor_rentado_nombre: isRentado ? form.conductor_rentado_nombre : null,
      destino: form.destino,
      motivo: form.motivo,
      motivo_descripcion: isMotivoOtro ? form.motivo_descripcion : null,
      km_salida: form.km_salida,
      km_llegada: form.km_llegada,
      fecha_llegada: new Date().toISOString(),
      hay_combustible: form.hay_combustible,
      monto_combustible: form.hay_combustible ? Number(form.monto_combustible) : null,
      autorizacion_id: form.autorizacion_id || null,
      observacion: form.observacion || null,
      fecha_salida: new Date().toISOString(),
    } as any)

    setError('')
    setShowForm(false)
    setForm(initialForm)
    await load()
  }

  const startEdit = (s: Salida) => {
    setEditing(s)
    setForm({
      vehiculo_id: s.vehiculo_id,
      conductor_id: s.conductor_id ?? (s.conductor_rentado_nombre ? 'rentado' : ''),
      conductor_rentado_nombre: s.conductor_rentado_nombre ?? '',
      destino: s.destino,
      motivo: s.motivo,
      motivo_descripcion: s.motivo_descripcion ?? '',
      km_salida: s.km_salida,
      km_llegada: s.km_llegada ?? s.km_salida,
      hay_combustible: s.hay_combustible,
      monto_combustible: s.monto_combustible?.toString() ?? '',
      autorizacion_id: s.autorizacion_id ?? '',
      observacion: s.observacion ?? '',
    })
    setShowForm(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    await updateSalida(editing.id, {
      vehiculo_id: form.vehiculo_id,
      conductor_id: isRentado ? null : (form.conductor_id || null),
      conductor_rentado_nombre: isRentado ? form.conductor_rentado_nombre : null,
      destino: form.destino,
      motivo: form.motivo,
      motivo_descripcion: isMotivoOtro ? form.motivo_descripcion : null,
      km_salida: form.km_salida,
      km_llegada: form.km_llegada,
      fecha_llegada: new Date().toISOString(),
      hay_combustible: form.hay_combustible,
      monto_combustible: form.hay_combustible ? Number(form.monto_combustible) : null,
      autorizacion_id: form.autorizacion_id || null,
      observacion: form.observacion || null,
    } as any)
    setEditing(null)
    setShowForm(false)
    setForm(initialForm)
    await load()
  }

  const exportCSV = () => {
    const rows = salidas.map((s) => ({
      fecha: new Date(s.fecha_salida).toLocaleDateString(),
      vehiculo: s.vehiculo?.nombre ?? '',
      conductor: s.conductor ? `${s.conductor.nombre} ${s.conductor.apellido}` : (s.conductor_rentado_nombre ?? ''),
      destino: s.destino,
      km_salida: s.km_salida,
      km_llegada: s.km_llegada ?? '',
      observacion: s.observacion ?? '',
      combustible: s.hay_combustible ? 'Sí' : 'No',
      oficial_autorizante: s.hay_combustible ? `${s.autorizacion?.nombre ?? ''} ${s.autorizacion?.apellido ?? ''}`.trim() : '',
    }))
    exportRowsToCSV(rows, `salidas_${new Date().toISOString().split('T')[0]}.csv`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Salidas</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={load} className="px-3 py-2 bg-gray-200 rounded-lg">Filtrar</button>
          <button onClick={exportCSV} className="px-3 py-2 bg-green-600 text-white rounded-lg">Exportar CSV</button>
          <button onClick={() => { setShowForm(true); setEditing(null); setForm(initialForm); setError(''); loadAux() }} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Nueva salida</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="px-3 py-2 border rounded-lg" />
        <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="px-3 py-2 border rounded-lg" />
        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }} className="px-3 py-2 border rounded-lg">
          {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option} filas</option>)}
        </select>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow">
          <form onSubmit={editing ? handleUpdate : handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select required value={form.vehiculo_id} onChange={(e) => handleVehiculoChange(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">Seleccionar vehículo</option>
              {vehiculos.map((v) => <option key={v.id} value={v.id}>{v.nombre} - {v.dominio}</option>)}
            </select>

            <select value={form.conductor_id} onChange={(e) => setForm({ ...form, conductor_id: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">Seleccionar conductor</option>
              {conductores.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
              <option value="rentado">Rentado</option>
            </select>

            {isRentado && (
              <input required placeholder="Nombre conductor rentado" value={form.conductor_rentado_nombre} onChange={(e) => setForm({ ...form, conductor_rentado_nombre: e.target.value })} className="px-3 py-2 border rounded-lg" />
            )}

            <input required placeholder="Destino" value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} className="px-3 py-2 border rounded-lg" />
            <input required placeholder="Motivo" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} className="px-3 py-2 border rounded-lg" />

            {isMotivoOtro && (
              <input required placeholder="Descripción del motivo" value={form.motivo_descripcion} onChange={(e) => setForm({ ...form, motivo_descripcion: e.target.value })} className="px-3 py-2 border rounded-lg" />
            )}

            <input required type="number" min={0} placeholder="KM salida" value={form.km_salida || ''} onChange={(e) => setForm({ ...form, km_salida: Number(e.target.value) })} className="px-3 py-2 border rounded-lg" />
            <input required type="number" min={form.km_salida} placeholder="KM llegada" value={form.km_llegada || ''} onChange={(e) => setForm({ ...form, km_llegada: Number(e.target.value) })} className="px-3 py-2 border rounded-lg" />
            <input disabled value={selectedVehiculo?.nombre ?? ''} placeholder="Móvil" className="px-3 py-2 border rounded-lg bg-gray-100" />

            <textarea placeholder="Observación" value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} className="sm:col-span-2 px-3 py-2 border rounded-lg" />

            <label className="sm:col-span-2 flex items-center gap-2"><input type="checkbox" checked={form.hay_combustible} onChange={(e) => setForm({ ...form, hay_combustible: e.target.checked })} /> Se cargó combustible</label>
            {form.hay_combustible && (
              <input required type="number" min={1} placeholder="Monto combustible" value={form.monto_combustible} onChange={(e) => setForm({ ...form, monto_combustible: e.target.value })} className="px-3 py-2 border rounded-lg" />
            )}

            <select value={form.autorizacion_id} onChange={(e) => setForm({ ...form, autorizacion_id: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">Sin autorización</option>
              {oficiales.map((o) => <option key={o.id} value={o.id}>{o.nombre} {o.apellido}</option>)}
            </select>

            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">{editing ? 'Guardar cambios' : 'Crear salida'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="w-full text-sm min-w-[980px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Fecha</th><th>Vehículo</th><th>Conductor</th><th>Destino</th><th>KM salida</th><th>KM llegada</th><th>Observación</th><th>Combustible</th><th>Oficial autorizante</th><th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{new Date(s.fecha_salida).toLocaleDateString()}</td>
                <td className="p-2">{s.vehiculo?.nombre}</td>
                <td className="p-2">{s.conductor ? `${s.conductor.nombre} ${s.conductor.apellido}` : s.conductor_rentado_nombre}</td>
                <td className="p-2">{s.destino}</td>
                <td className="p-2">{s.km_salida}</td>
                <td className="p-2">{s.km_llegada ?? '-'}</td>
                <td className="p-2">{s.observacion ?? '-'}</td>
                <td className="p-2">{s.hay_combustible ? 'Sí' : 'No'}</td>
                <td className="p-2">{s.autorizacion ? `${s.autorizacion.nombre} ${s.autorizacion.apellido}` : '-'}</td>
                <td className="p-2"><button onClick={() => startEdit(s)} className="text-primary-700 text-xs">Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Total: {salidas.length}</p>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">Anterior</button>
          <span className="text-sm">{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">Siguiente</button>
        </div>
      </div>
    </div>
  )
}
