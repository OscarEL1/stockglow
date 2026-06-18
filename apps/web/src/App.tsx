import { Routes, Route, Navigate } from 'react-router-dom'
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <SignIn routing="path" path="/login" />
          </div>
        }
      />

      <Route
        path="/register"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <SignUp routing="path" path="/register" />
          </div>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 p-8">
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard — StockGlow
              </h1>

              <p className="text-gray-500 mt-2">Inventario cargando...</p>
            </div>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
