import { Link, useLocation } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useRole } from '../hooks/useRole'
import { useAlerts } from '../hooks/useAlerts'
import { useSettings } from '../hooks/useSettings'
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  ArrowUpDown,
  Bell,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    adminOnly: false,
  },
  { label: 'Inventario', path: '/inventory', icon: Package, adminOnly: false },
  { label: 'Productos', path: '/products', icon: Tag, adminOnly: false },
  { label: 'Ventas', path: '/sales', icon: ShoppingCart, adminOnly: false },
  {
    label: 'Movimientos',
    path: '/movements',
    icon: ArrowUpDown,
    adminOnly: false,
  },
  { label: 'Alertas', path: '/alerts', icon: Bell, adminOnly: false },
  { label: 'Usuarios', path: '/users', icon: Users, adminOnly: true },
  {
    label: 'Configuración',
    path: '/settings',
    icon: Settings,
    adminOnly: true,
  },
]

export function Sidebar() {
  const { pathname } = useLocation()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { isEmployee } = useRole()
  const { data: alerts = [] } = useAlerts()
  const { data: settings } = useSettings()

  const visibleItems = isEmployee
    ? NAV_ITEMS.filter((item) => !item.adminOnly)
    : NAV_ITEMS

  const initials =
    user?.firstName?.[0] ??
    user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ??
    'U'

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-100 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[#FDE8F0]">
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo de la tienda"
              className="h-full w-full object-cover"
            />
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="7" y="1" width="6" height="4" rx="1.5" fill="#E85D8C" />
              <rect
                x="8"
                y="5"
                width="4"
                height="2.5"
                rx="0.5"
                fill="#D94B7D"
              />
              <rect x="6" y="7.5" width="8" height="11" rx="2" fill="#E85D8C" />
              <rect
                x="8"
                y="8.5"
                width="3"
                height="3.5"
                rx="0.75"
                fill="white"
                fillOpacity="0.3"
              />
            </svg>
          )}
        </div>

        <span className="truncate text-base font-semibold text-[#2D2A32]">
          {settings?.nombre || 'StockGlow'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {visibleItems.map(({ label, path, icon: Icon }) => {
          const isActive = pathname === path
          const isAlertItem = path === '/alerts'

          const baseClasses = `relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
            isActive
              ? 'border-l-[3px] border-[#E85D8C] bg-[#FDE8F0] pl-[9px] text-[#E85D8C]'
              : 'text-[#7A7480] hover:bg-[#FFF8F9] hover:text-[#2D2A32]'
          }`

          return (
            <Link key={path} to={path} className={baseClasses}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {label}

              {isAlertItem && alerts.length > 0 && (
                <span className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                  {alerts.length > 99 ? '99+' : alerts.length}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Usuario */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="flex flex-1 items-center gap-3 rounded-xl bg-[#FFF8F9] px-3 py-2.5 transition hover:bg-[#FDE8F0]"
          >
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.fullName ?? 'Usuario'}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E85D8C] text-xs font-bold text-white">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#2D2A32]">
                {user?.fullName ||
                  user?.firstName ||
                  user?.emailAddresses?.[0]?.emailAddress ||
                  'Usuario'}
              </p>

              <p className="text-[11px] text-[#7A7480]">Ver perfil</p>
            </div>
          </Link>

          <button
            onClick={() => signOut()}
            className="rounded-lg p-2 text-[#7A7480] transition hover:bg-[#FFF8F9] hover:text-[#E85D8C]"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
