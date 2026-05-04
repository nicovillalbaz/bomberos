import { Outlet, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const mobileLinks = [
  { to: '/dashboard', label: 'Inicio', icon: '🏠' },
  { to: '/salidas', label: 'Salidas', icon: '📤' },
  { to: '/guardias', label: 'Guardias', icon: '📋' },
  { to: '/servicios', label: 'Servicios', icon: '🚨' },
  { to: '/novedades', label: 'Novedades', icon: '📰' },
]

export default function AppLayout() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 bg-gray-50 overflow-auto pb-24 md:pb-6">
          <Outlet />
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 grid grid-cols-5 z-20">
          {mobileLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `py-2 text-center text-xs ${isActive ? 'text-primary-700' : 'text-gray-500'}`}
            >
              <div>{item.icon}</div>
              <div>{item.label}</div>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
