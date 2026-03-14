import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, PackageCheck, Truck,
  ArrowLeftRight, SlidersHorizontal, History, Settings2,
  User, LogOut, Box
} from 'lucide-react'
import useAuthStore from '../store/authStore'

const navItems = [
  { section: null, items: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  ]},
  { section: 'Products', items: [
    { label: 'Products', icon: Package, path: '/products' },
    { label: 'Categories', icon: Tag, path: '/categories' },
  ]},
  { section: 'Operations', items: [
    { label: 'Receipts', icon: PackageCheck, path: '/receipts' },
    { label: 'Deliveries', icon: Truck, path: '/deliveries' },
    { label: 'Transfers', icon: ArrowLeftRight, path: '/transfers' },
    { label: 'Adjustments', icon: SlidersHorizontal, path: '/adjustments' },
    { label: 'Move History', icon: History, path: '/move-history' },
  ]},
  { section: 'Configuration', items: [
    { label: 'Settings', icon: Settings2, path: '/settings' },
  ]},
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <div className="w-60 h-full bg-[#1A1D23] flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2">
        <Box className="text-indigo-400" size={24} />
        <span className="font-heading font-bold text-white text-lg">CoreInventory</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((group, gi) => (
          <div key={gi}>
            {group.section && (
              <p className="text-xs text-[#9EA3AE] uppercase tracking-widest px-5 mt-4 mb-1">{group.section}</p>
            )}
            {group.items.map(item => {
              const active = isActive(item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 mx-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#2D3139] text-white'
                      : 'text-[#9EA3AE] hover:bg-[#2D3139] hover:text-white'
                  }`}
                  style={{ width: 'calc(100% - 16px)' }}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-[#2D3139] px-3 py-3">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div
            className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer flex-shrink-0"
            onClick={() => navigate('/profile')}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
            <p className="text-[#9EA3AE] text-xs truncate capitalize">{user?.role || 'staff'}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#9EA3AE] hover:text-white rounded-lg hover:bg-[#2D3139] transition-colors"
        >
          <User size={15} />
          My Profile
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#9EA3AE] hover:text-red-400 rounded-lg hover:bg-[#2D3139] transition-colors"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </div>
  )
}
