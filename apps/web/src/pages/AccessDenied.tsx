import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Layout } from '../components/Layout'

export function AccessDenied() {
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#FDE8F0]">
          <Lock size={32} className="text-[#E85D8C]" />
        </div>
        <h1 className="text-2xl font-bold text-[#2D2A32]">Acceso denegado</h1>
        <p className="mt-2 max-w-sm text-[#7A7480]">
          No tienes permisos para acceder a esta sección. Contacta al
          administrador de tu tienda.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 rounded-lg bg-[#E85D8C] px-6 py-2 text-sm font-medium text-white hover:bg-[#D94B7D]"
        >
          Volver al inicio
        </button>
      </div>
    </Layout>
  )
}
