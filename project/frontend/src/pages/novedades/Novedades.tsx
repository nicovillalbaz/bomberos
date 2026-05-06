import { useEffect, useState } from 'react'
import type { NovedadGlobal, Servicio } from '../../types'
import { createNovedadManual, getNovedades } from '../../api/novedades'
import { getServicioById } from '../../api/servicios'

const getActor = (n: NovedadGlobal) => `${n.usuario?.nombre ?? ''} ${n.usuario?.apellido ?? ''}`.trim() || 'Un voluntario'

type ServicioResumen = {
  id: string
  participantes: string
  tipo: string
  lugar?: string | null
  movil?: string | null
}

export default function Novedades() {
  const [novedades, setNovedades] = useState<NovedadGlobal[]>([])
  const [serviceCtx, setServiceCtx] = useState<Record<string, ServicioResumen>>({})
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ tipo: 'general', titulo: '', descripcion: '', modulo_origen: 'manual' })

  const load = async () => {
    const data = await getNovedades(120)
    setNovedades(data)

    const eventoIds = Array.from(new Set(
      data
        .filter((n) => n.entidad_relacionada === 'servicio' && n.entidad_id)
        .map((n) => n.entidad_id as string),
    ))

    if (eventoIds.length === 0) {
      setServiceCtx({})
      return
    }

    const eventos = await Promise.all(eventoIds.map((id) => getServicioById(id).catch(() => null)))
    const next: Record<string, ServicioResumen> = {}
    eventos.forEach((s) => {
      if (!s) return
      const participantes = (s.personal || [])
        .map((p) => `${p.persona?.nombre ?? ''} ${p.persona?.apellido ?? ''}`.trim())
        .filter(Boolean)
        .join(', ')
      next[s.id] = {
        id: s.id,
        participantes: participantes || 'Sin participantes cargados',
        tipo: s.tipo,
        lugar: s.lugar ?? undefined,
        movil: s.movil?.nombre ?? undefined,
      }
    })
    setServiceCtx(next)
  }

  useEffect(() => { load() }, [])

  const getResumen = (n: NovedadGlobal) => {
    const actor = getActor(n)
    const detalleServicio = n.entidad_id ? serviceCtx[n.entidad_id] : undefined
    if (n.modulo_origen === 'salidas' || n.tipo === 'salida_movil') {
      return `${actor} registró salida de móvil. ${n.descripcion}`
    }
    if (n.entidad_relacionada === 'servicio' && detalleServicio) {
      const base = `${actor} creó evento de ${detalleServicio.tipo}.`
      const lugar = detalleServicio.lugar ? ` Lugar: ${detalleServicio.lugar}.` : ''
      const movil = detalleServicio.movil ? ` Móvil: ${detalleServicio.movil}.` : ''
      const participantes = ` Participantes: ${detalleServicio.participantes}.`
      return `${base}${lugar}${movil}${participantes}`
    }
    if (n.modulo_origen === 'dashboard' && n.tipo === 'personal') {
      return n.descripcion
    }
    if (n.entidad_id && n.modulo_origen === 'inventario') {
      return `${actor} actualizó inventario. ${n.descripcion}`
    }
    return n.descripcion
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createNovedadManual(form)
    setShowForm(false)
    setForm({ tipo: 'general', titulo: '', descripcion: '', modulo_origen: 'manual' })
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Novedades</h1>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Nueva novedad</button>
      </div>

      {showForm && (
        <div className="bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="general">General</option>
              <option value="vehiculo">Vehículo</option>
              <option value="personal">Personal</option>
              <option value="inventario">Inventario</option>
              <option value="servicio">Servicio</option>
            </select>
            <textarea required placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Crear</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {novedades.map((n) => (
          <div key={n.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between">
              <h3 className="font-semibold">{n.titulo}</h3>
              <span className={`text-xs px-2 py-1 rounded ${n.origen === 'automatico' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>{n.origen}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{getResumen(n)}</p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(n.created_at).toLocaleString()} - {getActor(n)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
