import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'

interface Props {
  children: React.ReactNode
}

export function Layout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <div className="flex h-screen bg-[#FFF8F9]">
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-[60] rounded-xl bg-white p-2 shadow-lg xl:hidden"
        >
          <Menu size={22} />
        </button>
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-auto p-4 pt-16 md:p-6 xl:p-8 xl:pt-8">
        {children}
      </main>
    </div>
  )
}
