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
  { path: '/reportes', label: 'Reportes', icon: '📈', roles: ['oficial', 'admin'] },
  { path: '/usuarios', label: 'Usuarios', icon: '👥', roles: ['admin'] },
]

export default function Sidebar() {
  const { profile } = useAuth()
  const rol = profile?.rol as RolUsuario | undefined
  const filteredItems = navItems.filter((item) => rol && item.roles.includes(rol))

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex-col hidden md:flex">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">🚒 Bomberos</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <p className="text-sm text-gray-400">{profile?.nombre} {profile?.apellido}</p>
        <p className="text-xs text-gray-500 capitalize">{profile?.rol}</p>
      </div>
    </aside>
  )
}
