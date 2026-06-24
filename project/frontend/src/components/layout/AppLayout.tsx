import { Outlet, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../hooks/useAuth'
import type { RolUsuario } from '../../types'

const mobileLinks = [
  { to: '/dashboard', label: 'Inicio', icon: '🏠', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/mis-actividades', label: 'Mis', icon: '✅', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/salidas', label: 'Salidas', icon: '📤', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/guardias', label: 'Guardias', icon: '📋', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/servicios', label: 'Servicios', icon: '🚨', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/citaciones', label: 'Citaciones', icon: '🗒️', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/practicas', label: 'Prácticas', icon: '🏋️', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/reportes', label: 'Reportes', icon: '📈', roles: ['oficial', 'admin'] },
  { to: '/usuarios', label: 'Usuarios', icon: '👥', roles: ['admin'] },
]

export default function AppLayout() {
  const { profile } = useAuth()
  const rol = profile?.rol as RolUsuario | undefined
  const filteredLinks = mobileLinks.filter((item) => rol && item.roles.includes(rol))

  return (
    <div className="app-shell min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 overflow-auto pb-24 md:pb-6">
          <Outlet />
        </main>

        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 grid text-[11px] z-20"
          style={{ gridTemplateColumns: `repeat(${Math.max(filteredLinks.length, 1)}, minmax(0, 1fr))` }}
        >
          {filteredLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `py-2 text-center text-[11px] ${isActive ? 'text-red-800 font-semibold' : 'text-gray-500'}`}
            >
              <div className="text-sm">{item.icon}</div>
              <div>{item.label}</div>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
