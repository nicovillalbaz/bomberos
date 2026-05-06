import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Guardia, NovedadGlobal, Servicio, Vehiculo } from '../../types'
import { supabase } from '../../lib/supabase'
import { createNovedadIngresoRetiroCompania, getNovedades } from '../../api/novedades'
import { getServicioById } from '../../api/servicios'
import { useAuth } from '../../hooks/useAuth'

const quickLinks = [
  { to: '/salidas', label: 'Salidas', icon: '📤' },
  { to: '/inventario', label: 'Inventario', icon: '📦' },
  { to: '/novedades', label: 'Novedades', icon: '📰' },
  { to: '/servicios', label: 'Servicios', icon: '🚨' },
  { to: '/citaciones', label: 'Citaciones', icon: '🗒️' },
  { to: '/practicas', label: 'Prácticas', icon: '🏋️' },
]

const getActorNombre = (n: NovedadGlobal) =>
  `${n.usuario?.nombre ?? ''} ${n.usuario?.apellido ?? ''}`.trim() || 'Un voluntario'

export default function Dashboard() {
  const { profile } = useAuth()
  const [novedades, setNovedades] = useState<NovedadGlobal[]>([])
  const [servicioResumen, setServicioResumen] = useState<Record<string, string>>({})
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [guardiaHoy, setGuardiaHoy] = useState<Guardia[]>([])
  const [loading, setLoading] = useState(true)
  const [enCompania, setEnCompania] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (profile?.id) {
      loadPresenceState(profile.id)
    }
  }, [profile?.id])

  const loadData = async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0]
      const [nov, veh, guardias] = await Promise.all([
        getNovedades(8),
        supabase.from('vehiculos').select('*').eq('estado', 'disponible'),
        supabase.from('guardias').select('*, a_cargo:perfiles!a_cargo_id(nombre,apellido), conductor:perfiles!conductor_id(nombre,apellido)').eq('fecha', hoy),
      ])

      setNovedades(nov)
      const eventoIds = Array.from(new Set(
        nov.filter((n) => n.entidad_relacionada === 'servicio' && n.entidad_id).map((n) => n.entidad_id as string),
      ))
      if (eventoIds.length) {
        const eventos = await Promise.all(eventoIds.map((id) => getServicioById(id).catch(() => null)))
        const map = {} as Record<string, string>
        eventos.filter(Boolean).forEach((item) => {
          const s = item as Servicio
          const participantes = (s.personal || [])
            .map((p) => `${p.persona?.nombre ?? ''} ${p.persona?.apellido ?? ''}`.trim())
            .filter(Boolean)
            .join(', ')
          map[s.id] = [
            `Tipo: ${s.tipo}.`,
            s.lugar ? `Lugar: ${s.lugar}.` : '',
            s.movil ? `Movil: ${s.movil.nombre}.` : '',
            participantes ? `Participantes: ${participantes}` : '',
          ].filter(Boolean).join(' ')
        })
        setServicioResumen(map)
      } else {
        setServicioResumen({})
      }
      setVehiculos((veh as any).data || [])
      setGuardiaHoy((guardias as any).data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadPresenceState = async (usuarioId: string) => {
    const { data } = await (supabase as any)
      .from('novedades_global')
      .select('titulo, created_at')
      .eq('usuario_id', usuarioId)
      .eq('tipo', 'personal')
      .eq('modulo_origen', 'dashboard')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data?.titulo) {
      setEnCompania(false)
      return
    }
    setEnCompania(data.titulo.toLowerCase().includes('ingres'))
  }

  const registrar = async (accion: 'ingreso' | 'retiro') => {
    await createNovedadIngresoRetiroCompania(accion)
    setEnCompania(accion === 'ingreso')
    setFeedback(accion === 'ingreso' ? 'Ingreso registrado correctamente' : 'Retiro registrado correctamente')
    setTimeout(() => setFeedback(''), 2200)
    await loadData()
  }

  const getNovedadResumenDashboard = (n: NovedadGlobal) => {
    const actor = getActorNombre(n)
    if (n.modulo_origen === 'salidas' || n.tipo === 'salida_movil') {
      return `${actor}: ${n.descripcion}`
    }
    if (n.modulo_origen === 'inventario' || n.entidad_relacionada === 'inventario') {
      return `${actor}: ${n.descripcion}`
    }
    if (n.tipo === 'personal' && n.modulo_origen === 'dashboard') {
      return n.descripcion
    }
    if (n.modulo_origen === 'servicios' || n.tipo === 'servicio') {
      const extra = n.entidad_id ? servicioResumen[n.entidad_id] : ''
      return extra ? `${actor}: ${n.descripcion} (${extra})` : `${actor}: ${n.descripcion}`
    }
    return n.descripcion
  }

  if (loading) return <div className="text-center py-8">Cargando...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickLinks.map((item) => (
          <Link key={item.to} to={item.to} className="bg-white rounded-xl shadow p-4 text-center hover:bg-gray-50">
            <div className="text-2xl">{item.icon}</div>
            <p className="text-sm font-medium mt-1">{item.label}</p>
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {!enCompania ? (
          <button
            onClick={() => registrar('ingreso')}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            Ingreso en la compañía
          </button>
        ) : (
          <button
            onClick={() => registrar('retiro')}
            className="w-full sm:w-auto px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
          >
            Retiro de la compañía
          </button>
        )}
        {feedback && (
          <div className="inline-block px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm animate-pulse">
            {feedback}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Vehículos disponibles</p>
          <p className="text-3xl font-bold text-green-600">{vehiculos.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Guardias hoy</p>
          <p className="text-3xl font-bold text-blue-600">{guardiaHoy.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Novedades recientes</p>
          <p className="text-3xl font-bold text-amber-600">{novedades.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Guardias de hoy</h2>
          {guardiaHoy.length === 0 ? <p className="text-gray-500">No hay guardias programadas</p> :
            guardiaHoy.map((g) => (
              <div key={g.id} className="border-b py-2">
                <p className="font-medium">{g.tipo} - {g.hora_inicio} a {g.hora_fin}</p>
                <p className="text-sm text-gray-600">A cargo: {g.a_cargo?.nombre} {g.a_cargo?.apellido}</p>
              </div>
            ))
          }
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Últimas novedades</h2>
          {novedades.length === 0 ? <p className="text-gray-500">No hay novedades</p> :
            novedades.map((n) => (
              <div key={n.id} className="border-b py-2">
                <p className="font-medium">{n.titulo}</p>
                <p className="text-sm text-gray-600">{getNovedadResumenDashboard(n)}</p>
                <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()} - {getActorNombre(n)}</p>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

