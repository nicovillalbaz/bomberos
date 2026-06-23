import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Guardia, NovedadGlobal, Perfil, Servicio, Vehiculo } from '../../types'
import { supabase } from '../../lib/supabase'
import { createNovedadIngresoRetiroCompania, getCompanyPresenceEvents, getNovedades } from '../../api/novedades'
import { getServicioById } from '../../api/servicios'
import { useAuth } from '../../hooks/useAuth'
import { isPresenceEntry } from '../../lib/attendance'

const quickLinks = [
  { to: '/salidas', label: 'Salidas', icon: '📤' },
  { to: '/inventario', label: 'Inventario', icon: '📦' },
  { to: '/novedades', label: 'Novedades', icon: '📰' },
  { to: '/servicios', label: 'Servicios', icon: '🚨' },
  { to: '/citaciones', label: 'Citaciones', icon: '🗒️' },
  { to: '/practicas', label: 'Practicas', icon: '🏋️' },
]

const getActorNombre = (n: NovedadGlobal) =>
  `${n.usuario?.nombre ?? ''} ${n.usuario?.apellido ?? ''}`.trim() || 'Un voluntario'

export default function Dashboard() {
  const { profile } = useAuth()
  const [novedades, setNovedades] = useState<NovedadGlobal[]>([])
  const [servicioResumen, setServicioResumen] = useState<Record<string, string>>({})
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [guardiaHoy, setGuardiaHoy] = useState<Guardia[]>([])
  const [presentes, setPresentes] = useState<Perfil[]>([])
  const [loading, setLoading] = useState(true)
  const [enCompania, setEnCompania] = useState(false)
  const [feedback, setFeedback] = useState('')
  const limiteNovedades = 10

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
      const [nov, veh, guardias, presencia] = await Promise.all([
        getNovedades(limiteNovedades),
        supabase.from('vehiculos').select('*').eq('estado', 'disponible'),
        supabase.from('guardias').select('*, a_cargo:perfiles!a_cargo_id(nombre,apellido), conductor:perfiles!conductor_id(nombre,apellido)').eq('fecha', hoy),
        getCompanyPresenceEvents(),
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
      const latestByUser = new Map<string, typeof presencia[number]>()
      presencia.forEach((event) => latestByUser.set(event.usuario_id, event))
      const presentesData = Array.from(latestByUser.values())
        .filter((event) => event.usuario && isPresenceEntry(event))
        .map((event) => event.usuario as Perfil)
        .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`))
      setPresentes(presentesData)
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

  const parseSalidaDeMovil = (n: NovedadGlobal) => {
    const movilMatch = (n.descripcion || '').match(/salida (?:del\s+)?(.+?)\s+con destino a\s+(.+)/i)
    if (!movilMatch) return 'Se registro salida de movil.'
    return `Salida del ${movilMatch[1].trim()} con destino a ${movilMatch[2].trim()}.`
  }

  const getNovedadResumenDashboard = (n: NovedadGlobal) => {
    const actor = getActorNombre(n)
    const descripcion = n.descripcion?.trim() || ''

    if (n.modulo_origen === 'salidas' || n.tipo === 'salida_movil') {
      return `${actor}: ${parseSalidaDeMovil(n)}`
    }
    if (n.modulo_origen === 'dashboard' && n.tipo === 'personal') {
      if (/ingres/i.test(n.titulo) || /ingres/i.test(descripcion)) {
        return `${actor} ingreso a la compania.`
      }
      if (/retiro|retir/i.test(n.titulo) || /retiro/i.test(descripcion)) {
        return `${actor} se retiro de la compania.`
      }
      return descripcion || `${actor} actualizo su estado de compania.`
    }
    if (n.modulo_origen === 'inventario' || n.entidad_relacionada === 'inventario') {
      return `${actor}: Movimiento de inventario registrado (${n.entidad_id ? `registro ${n.entidad_id}` : 'origen/destino sin detalle'}). ${descripcion}`
    }
    if (n.modulo_origen === 'servicios' || n.tipo === 'servicio') {
      const extra = n.entidad_id ? servicioResumen[n.entidad_id] : ''
      return extra ? `${actor}: Se registro un servicio. ${extra}` : `${actor}: ${descripcion}`
    }
    return `${actor}: ${descripcion}`
  }

  if (loading) return <div className="text-center py-8">Cargando...</div>

  return (
    <div className="space-y-5">
      <div className="page-heading">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">Resumen rapido del cuartel y accesos de carga.</p>
        </div>
      </div>

      <div className="surface p-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {quickLinks.map((item) => (
          <Link key={item.to} to={item.to} className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            <span className="mr-2">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="surface p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Estado personal en compania</p>
          <p className="text-sm text-gray-500">{enCompania ? 'Figuras con ingreso abierto.' : 'No figuras dentro de la compania.'}</p>
        </div>
        {!enCompania ? (
          <button
            onClick={() => registrar('ingreso')}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            Ingreso en la compania
          </button>
        ) : (
          <button
            onClick={() => registrar('retiro')}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
          >
            Retiro de la compania
          </button>
        )}
        {feedback && (
          <div className="inline-block px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm animate-pulse">
            {feedback}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="surface p-4">
          <p className="text-sm text-gray-500">Vehiculos disponibles</p>
          <p className="text-3xl font-bold text-green-600">{vehiculos.length}</p>
        </div>
        <div className="surface p-4">
          <p className="text-sm text-gray-500">Guardias hoy</p>
          <p className="text-3xl font-bold text-blue-600">{guardiaHoy.length}</p>
        </div>
        <div className="surface p-4">
          <p className="text-sm text-gray-500">Novedades recientes</p>
          <p className="text-3xl font-bold text-amber-600">{novedades.length}</p>
        </div>
      </div>

      <div className="surface p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">En la compania ahora</h2>
          <span className="text-sm text-gray-500">{presentes.length} persona{presentes.length === 1 ? '' : 's'}</span>
        </div>
        {presentes.length === 0 ? (
          <p className="mt-3 text-gray-500">Nadie figura con ingreso abierto.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {presentes.map((persona) => (
              <span key={persona.id} className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                {persona.nombre} {persona.apellido}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface p-4">
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
        <div className="surface p-4">
          <h2 className="text-lg font-semibold mb-3">Ultimas novedades</h2>
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

