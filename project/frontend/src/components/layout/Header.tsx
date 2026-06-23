import { useAuth } from '../../hooks/useAuth'

export default function Header() {
  const { profile, signOut } = useAuth()

  return (
    <header className="bg-white/90 border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between backdrop-blur">
      <div>
        <h2 className="text-sm sm:text-base font-semibold text-gray-900">Cuartel de Bomberos</h2>
        <p className="hidden sm:block text-xs text-gray-500">
          {profile?.nombre} {profile?.apellido} · {profile?.rol}
        </p>
      </div>
      <button
        onClick={signOut}
        className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Cerrar sesión
      </button>
    </header>
  )
}
