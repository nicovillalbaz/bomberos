import { Outlet, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../hooks/useAuth'
import type { RolUsuario } from '../../types'

const mobileLinks = [
  { to: '/dashboard', label: 'Inicio', icon: '🏠', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/mi-perfil', label: 'Mi perfil', icon: '👤', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/mis-actividades', label: 'Mis', icon: '✅', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/salidas', label: 'Salidas', icon: '📤', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/guardias', label: 'Guardias', icon: '📋', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/inventario', label: 'Inventario', icon: '📦', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/servicios', label: 'Servicios', icon: '🚨', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/citaciones', label: 'Citaciones', icon: '🗒️', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/practicas', label: 'Prácticas', icon: '🏋️', roles: ['bombero', 'oficial', 'admin'] },
  { to: '/reportes', label: 'Reportes', icon: '📈', roles: ['oficial', 'admin'] },
  { to: '/novedades', label: 'Novedades', icon: '📰', roles: ['bombero', 'oficial', 'admin'] },
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
        <main className="flex-1 p-3 sm:p-6 overflow-auto pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6">
          <Outlet />
        </main>

        <nav
          className="mobile-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur"
          aria-label="Navegación principal"
        >
          <div className="mobile-bottom-nav-scroll">
            {filteredLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                aria-label={item.label}
                className={({ isActive }) =>
                  `mobile-bottom-nav-item ${isActive ? 'mobile-bottom-nav-item-active' : 'text-gray-500'}`
                }
              >
                <span aria-hidden="true" className="text-xl leading-none">{item.icon}</span>
                <span className="sr-only">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
