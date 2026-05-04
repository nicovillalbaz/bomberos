import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Guardia, NovedadGlobal, Vehiculo } from '../../types'
import { supabase } from '../../lib/supabase'
import { createNovedadIngresoRetiroCompania } from '../../api/novedades'

const quickLinks = [
  { to: '/salidas', label: 'Salidas', icon: '📤' },
  { to: '/inventario', label: 'Inventario', icon: '📦' },
  { to: '/novedades', label: 'Novedades', icon: '📰' },
  { to: '/servicios', label: 'Servicios', icon: '🚨' },
]

export default function Dashboard() {
  const [novedades, setNovedades] = useState<NovedadGlobal[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [guardiaHoy, setGuardiaHoy] = useState<Guardia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0]
      const [{ data: nov }, { data: veh }, { data: gua }] = await Promise.all([
        supabase.from('novedades_global').select('*, usuario:perfiles(nombre,apellido)').order('created_at', { ascending: false }).limit(10),
        supabase.from('vehiculos').select('*').eq('estado', 'disponible'),
        supabase.from('guardias').select('*, a_cargo:perfiles!a_cargo_id(nombre,apellido), conductor:perfiles!conductor_id(nombre,apellido)').eq('fecha', hoy),
      ])
      setNovedades(nov || [])
      setVehiculos(veh || [])
      setGuardiaHoy(gua || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const registrar = async (accion: 'ingreso' | 'retiro') => {
    await createNovedadIngresoRetiroCompania(accion)
    await loadData()
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={() => registrar('ingreso')} className="px-4 py-3 rounded-xl bg-green-600 text-white font-medium">Ingresé en la compañía</button>
        <button onClick={() => registrar('retiro')} className="px-4 py-3 rounded-xl bg-red-600 text-white font-medium">Me retiro de la compañía</button>
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
                <p className="text-sm text-gray-600">{n.descripcion}</p>
                <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
