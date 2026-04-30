import { useEffect, useMemo, useState } from 'react'
import { createSalida, completeSalida, getLastSalidaByVehiculo, getSalidas } from '../../api/salidas'
import { getConductores, getOficiales } from '../../api/usuarios'
import { getVehiculosDisponibles } from '../../api/vehiculos'
import type { Perfil, Salida, Vehiculo } from '../../types'

export default function Salidas() {
  const [salidas, setSalidas] = useState<Salida[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [conductores, setConductores] = useState<Perfil[]>([])
  const [oficiales, setOficiales] = useState<Perfil[]>([])
  const [showForm, setShowForm] = useState(false)
  const [completing, setCompleting] = useState<Salida | null>(null)
  const [kmLlegada, setKmLlegada] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    vehiculo_id: '',
    conductor_id: '',
    conductor_rentado_nombre: '',
    destino: '',
    motivo: '',
    motivo_descripcion: '',
    km_salida: 0,
    hay_combustible: false,
    monto_combustible: '',
    autorizacion_id: '',
  })

  const isRentado = form.conductor_id === 'rentado'
  const isMotivoOtro = form.motivo.trim().toLowerCase() === 'otro'

  const load = async () => {
    const data = await getSalidas()
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

  const handleVehiculoChange = async (id: string) => {
    setForm((prev) => ({ ...prev, vehiculo_id: id }))
    if (!id) return
    const last = await getLastSalidaByVehiculo(id)
    if (last?.km_llegada != null) {
      setForm((prev) => ({ ...prev, km_salida: last.km_llegada ?? 0 }))
    } else {
      const current = vehiculos.find((v) => v.id === id)
      setForm((prev) => ({ ...prev, km_salida: current?.ultimo_km ?? 0 }))
    }
  }

  const validateCreate = (): string | null => {
    if (!form.vehiculo_id) return 'Selecciona un vehiculo.'
    if (!form.destino.trim()) return 'Destino es obligatorio.'
    if (!form.motivo.trim()) return 'Motivo es obligatorio.'
    if (form.km_salida < 0) return 'KM salida no puede ser negativo.'
    if (isRentado && !form.conductor_rentado_nombre.trim()) return 'Nombre de conductor rentado es obligatorio.'
    if (isMotivoOtro && !form.motivo_descripcion.trim()) return 'Descripcion de motivo es obligatoria para motivo Otro.'
    if (form.hay_combustible) {
      const monto = Number(form.monto_combustible)
      if (!Number.isFinite(monto) || monto <= 0) return 'Monto de combustible debe ser mayor a 0.'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateCreate()
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
      hay_combustible: form.hay_combustible,
      monto_combustible: form.hay_combustible ? Number(form.monto_combustible) : null,
      autorizacion_id: form.autorizacion_id || null,
      fecha_salida: new Date().toISOString(),
    })

    setError('')
    setShowForm(false)
    setForm({
      vehiculo_id: '', conductor_id: '', conductor_rentado_nombre: '', destino: '', motivo: '', motivo_descripcion: '',
      km_salida: 0, hay_combustible: false, monto_combustible: '', autorizacion_id: '',
    })
    await load()
  }

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!completing) return
    const km = Number(kmLlegada)
    if (!Number.isFinite(km) || km < completing.km_salida) {
      setError('KM llegada debe ser mayor o igual a KM salida.')
      return
    }
    await completeSalida(completing.id, km)
    setError('')
    setCompleting(null)
    setKmLlegada('')
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Salidas</h1>
        <button onClick={() => { setShowForm(true); setError(''); loadAux() }} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Nueva Salida</button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <select required value={form.vehiculo_id} onChange={(e) => handleVehiculoChange(e.target.value)} className="px-3 py-2 border rounded-lg">
              <option value="">Seleccionar vehiculo</option>
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
              <input required placeholder="Descripcion del motivo" value={form.motivo_descripcion} onChange={(e) => setForm({ ...form, motivo_descripcion: e.target.value })} className="px-3 py-2 border rounded-lg" />
            )}

            <input required type="number" min={0} placeholder="KM salida" value={form.km_salida || ''} onChange={(e) => setForm({ ...form, km_salida: Number(e.target.value) })} className="px-3 py-2 border rounded-lg" />
            <input disabled value={selectedVehiculo?.nombre ?? ''} placeholder="Movil" className="px-3 py-2 border rounded-lg bg-gray-100" />

            <label className="col-span-2 flex items-center gap-2"><input type="checkbox" checked={form.hay_combustible} onChange={(e) => setForm({ ...form, hay_combustible: e.target.checked })} /> Se cargo combustible</label>
            {form.hay_combustible && (
              <input required type="number" min={1} placeholder="Monto combustible" value={form.monto_combustible} onChange={(e) => setForm({ ...form, monto_combustible: e.target.value })} className="px-3 py-2 border rounded-lg" />
            )}

            <select value={form.autorizacion_id} onChange={(e) => setForm({ ...form, autorizacion_id: e.target.value })} className="px-3 py-2 border rounded-lg">
              <option value="">Sin autorizacion</option>
              {oficiales.map((o) => <option key={o.id} value={o.id}>{o.nombre} {o.apellido}</option>)}
            </select>

            {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Crear</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {completing && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">Completar salida - KM actual: {completing.km_salida}</h3>
          <form onSubmit={handleComplete} className="flex gap-4 items-end">
            <div>
              <label className="text-sm">KM llegada</label>
              <input type="number" min={completing.km_salida} required value={kmLlegada} onChange={(e) => setKmLlegada(e.target.value)} className="px-3 py-2 border rounded-lg" />
            </div>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Completar</button>
            <button type="button" onClick={() => setCompleting(null)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr><th className="p-2 text-left">Fecha</th><th>Vehiculo</th><th>Conductor</th><th>Destino</th><th>KM salida</th><th>KM llegada</th><th></th></tr></thead>
          <tbody>
            {salidas.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-2">{new Date(s.fecha_salida).toLocaleDateString()}</td>
                <td className="p-2">{s.vehiculo?.nombre}</td>
                <td className="p-2">{s.conductor ? `${s.conductor.nombre} ${s.conductor.apellido}` : s.conductor_rentado_nombre}</td>
                <td className="p-2">{s.destino}</td>
                <td className="p-2">{s.km_salida}</td>
                <td className="p-2">{s.km_llegada ?? '-'}</td>
                <td className="p-2">{!s.km_llegada && <button onClick={() => setCompleting(s)} className="text-green-600 text-xs">Completar</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
