import { Routes, Route, Navigate } from 'react-router-dom'
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Sales } from './pages/Sales'
import { Layout } from './components/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function ComingSoon({ title }: { title: string }) {
  return (
    <Layout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-[#2D2A32]">{title}</h1>
        <p className="mt-2 text-[#7A7480]">Próximamente</p>
      </div>
    </Layout>
  )
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login/*"
        element={
          <div className="flex min-h-screen items-center justify-center bg-[#FFF8F9]">
            <SignIn routing="path" path="/login" />
          </div>
        }
      />

      <Route
        path="/register/*"
        element={
          <div className="flex min-h-screen items-center justify-center bg-[#FFF8F9]">
            <SignUp routing="path" path="/register" />
          </div>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <Sales />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ComingSoon title="Productos" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/movements"
        element={
          <ProtectedRoute>
            <ComingSoon title="Movimientos" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <ComingSoon title="Alertas" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <ComingSoon title="Usuarios" />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <ComingSoon title="Configuración" />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
