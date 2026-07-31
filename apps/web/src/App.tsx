import { Routes, Route, Navigate } from 'react-router-dom'
import { SignIn, SignUp, useAuth, useOrganization } from '@clerk/clerk-react'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Sales } from './pages/Sales'
import { Users } from './pages/Users'
import Alerts from './pages/Alerts'
import { AccessDenied } from './pages/AccessDenied'
import Onboarding from './pages/Onboarding'
import { ProtectedByRole } from './components/ProtectedByRole'
import { Products } from './pages/Products'
import { Settings } from './pages/Settings'
import { Profile } from './pages/Profile'
import { GlobalToast } from './components/GlobalToast'
import { Suppliers } from './pages/Suppliers'
import { DailyClosing } from './pages/DailyClosing'
import { Reports } from './pages/Reports'

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

function RootRedirect() {
  const { organization, isLoaded } = useOrganization()

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#E85D8C]" />
      </div>
    )
  }

  return (
    <Navigate
      to={organization !== null ? '/dashboard' : '/onboarding'}
      replace
    />
  )
}

export default function App() {
  return (
    <>
      <GlobalToast />
      <Routes>
        <Route
          path="/login/*"
          element={
            <div className="flex min-h-screen items-center justify-center bg-[#FFF8F9]">
              <SignIn
                routing="path"
                path="/login"
                signUpUrl="/register"
                forceRedirectUrl="/"
              />
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
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
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
          path="/daily-closing"
          element={
            <ProtectedRoute>
              <ProtectedByRole role="admin">
                <DailyClosing />
              </ProtectedByRole>
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
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <Suppliers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/movements"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <ProtectedByRole role="admin">
                <Users />
              </ProtectedByRole>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ProtectedByRole role="admin">
                <Settings />
              </ProtectedByRole>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/access-denied"
          element={
            <ProtectedRoute>
              <AccessDenied />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RootRedirect />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}
