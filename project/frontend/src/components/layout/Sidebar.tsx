import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { RolUsuario } from '../../types'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['bombero', 'oficial', 'admin'] },
  { path: '/moviles', label: 'Móviles', icon: '🚒', roles: ['bombero', 'oficial', 'admin'] },
  { path: '/salidas', label: 'Salidas', icon: '📤', roles: ['bombero', 'oficial', 'admin'] },
  { path: '/guardias', label: 'Guardias', icon: '📋', roles: ['bombero', 'oficial', 'admin'] },
  { path: '/inventario', label: 'Inventario', icon: '📦', roles: ['bombero', 'oficial', 'admin'] },
  { path: '/servicios', label: 'Servicios', icon: '🚨', roles: ['bombero', 'oficial', 'admin'] },
  { path: '/citaciones', label: 'Citaciones', icon: '🗒️', roles: ['bombero', 'oficial', 'admin'] },
  { path: '/practicas', label: 'Prácticas', icon: '🏋️', roles: ['bombero', 'oficial', 'admin'] },
  { path: '/novedades', label: 'Novedades', icon: '📰', roles: ['bombero', 'oficial', 'admin'] },
  { path: '/usuarios', label: 'Usuarios', icon: '👥', roles: ['admin'] },
]

export default function Sidebar() {
  const { profile } = useAuth()
  const rol = profile?.rol as RolUsuario | undefined
  const filteredItems = navItems.filter((item) => rol && item.roles.includes(rol))

  return (
    <aside className="w-64 bg-white text-gray-900 min-h-screen flex-col hidden md:flex border-r border-gray-200">
      <div className="px-4 py-4 border-b border-gray-200">
        <h1 className="text-base font-bold">Bomberos</h1>
        <p className="text-xs text-gray-500">Gestion operativa</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'bg-red-50 text-red-800 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
              }`
            }
          >
            <span className="w-5 text-center text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-sm font-medium text-gray-900">{profile?.nombre} {profile?.apellido}</p>
        <p className="text-xs text-gray-500 capitalize">{profile?.rol}</p>
      </div>
    </aside>
  )
}
