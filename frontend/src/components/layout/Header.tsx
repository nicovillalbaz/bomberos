import { useAuth } from '../../hooks/useAuth'

export default function Header() {
  const { signOut } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800">Cuartel de Bomberos</h2>
      <button
        onClick={signOut}
        className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
      >
        Cerrar Sesión
      </button>
    </header>
  )
}
