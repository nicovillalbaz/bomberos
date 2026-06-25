import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Header() {
  const { profile, signOut } = useAuth()

  return (
    <header className="bg-white/90 border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 backdrop-blur">
      <div className="min-w-0">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900">Cuartel de Bomberos</h2>
        <p className="hidden sm:block text-xs text-gray-500 truncate">
          {profile?.nombre} {profile?.apellido} · {profile?.rol}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/mi-perfil"
          className="px-2 sm:px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="sm:hidden">Perfil</span>
          <span className="hidden sm:inline">Mi perfil</span>
        </Link>
        <button
          onClick={signOut}
          className="px-2 sm:px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="sm:hidden">Salir</span>
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  )
}
