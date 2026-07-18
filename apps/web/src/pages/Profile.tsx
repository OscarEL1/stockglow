import { UserProfile } from '@clerk/clerk-react'
import { Layout } from '../components/Layout'

export function Profile() {
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2D2A32]">Mi perfil</h1>

        <p className="mt-1 text-[#7A7480]">
          Actualiza tu información personal.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <UserProfile
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none border-0 w-full',
            },
          }}
        />
      </div>
    </Layout>
  )
}
