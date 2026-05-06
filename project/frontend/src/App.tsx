import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Moviles from './pages/moviles/Moviles'
import Salidas from './pages/salidas/Salidas'
import Guardias from './pages/guardias/Guardias'
import Inventario from './pages/inventario/Inventario'
import Servicios from './pages/servicios/Servicios'
import { Citaciones, Practicas } from './pages/citaciones/Citaciones'
import Novedades from './pages/novedades/Novedades'
import Reportes from './pages/reportes/Reportes'
import Usuarios from './pages/usuarios/Usuarios'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/moviles" element={<Moviles />} />
              <Route path="/salidas" element={<Salidas />} />
              <Route path="/guardias" element={<Guardias />} />
              <Route path="/inventario/*" element={<Inventario />} />
              <Route path="/servicios" element={<Servicios />} />
              <Route path="/citaciones" element={<Citaciones />} />
              <Route path="/practicas" element={<Practicas />} />
              <Route path="/novedades" element={<Novedades />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/usuarios" element={<Usuarios />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
