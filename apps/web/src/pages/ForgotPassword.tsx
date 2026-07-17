import { useState } from 'react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFF8F9]">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-[#2D2A32]">
          Recuperar contraseña
        </h1>

        <p className="mb-6 text-sm text-gray-500">
          Ingresa el correo asociado a tu cuenta.
        </p>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 p-3"
        />

        <button className="w-full rounded-lg bg-[#E85D8C] p-3 font-semibold text-white">
          Enviar código
        </button>
      </div>
    </div>
  )
}
