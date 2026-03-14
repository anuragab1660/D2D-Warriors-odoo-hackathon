import React from 'react'
import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import useAuthStore from '../store/authStore'

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/products': 'Stock',
  '/categories': 'Categories',
  '/receipts': 'Receipts',
  '/deliveries': 'Deliveries',
  '/transfers': 'Transfers',
  '/adjustments': 'Adjustments',
  '/move-history': 'Move History',
  '/settings': 'Settings',
  '/profile': 'My Profile',
}

export default function Header() {
  const location = useLocation()
  const { user } = useAuthStore()

  const getTitle = () => {
    const path = location.pathname
    for (const [route, title] of Object.entries(routeTitles)) {
      if (path === route || (route !== '/dashboard' && path.startsWith(route + '/'))) {
        return title
      }
    }
    return 'CoreInventory'
  }

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="font-heading font-bold text-gray-900 text-xl">{getTitle()}</h1>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700">{user?.name || 'User'}</span>
        </div>
      </div>
    </div>
  )
}
