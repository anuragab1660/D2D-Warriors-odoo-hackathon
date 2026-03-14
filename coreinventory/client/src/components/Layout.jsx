import React from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'



const routeNames = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/categories': 'Categories',
  '/receipts': 'Receipts',
  '/deliveries': 'Deliveries',
  '/transfers': 'Transfers',
  '/adjustments': 'Adjustments',
  '/move-history': 'Move History',
  '/settings': 'Settings',
  '/profile': 'My Profile',
}

function Breadcrumb() {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)

  const crumbs = [{ label: 'Dashboard', path: '/dashboard' }]
  let accumulated = ''

  for (const part of parts) {
    accumulated += '/' + part
    const label = routeNames[accumulated] || (part === 'new' ? 'New' : part.charAt(0).toUpperCase() + part.slice(1))
    if (accumulated !== '/dashboard') {
      crumbs.push({ label, path: accumulated })
    }
  }

  if (crumbs.length <= 1) return null

  return (
    <div className="h-10 bg-white border-b border-gray-100 px-6 flex items-center no-print">
      <nav className="flex items-center gap-1 text-xs text-gray-500">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={crumb.path}>
            {i > 0 && <span className="text-gray-300">/</span>}
            {i === crumbs.length - 1 ? (
              <span className="text-gray-700 font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-indigo-600 transition-colors">{crumb.label}</Link>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  )
}

export default function Layout() {
  const location = useLocation()
  const isDashboard = location.pathname === '/dashboard'

  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      <div className="sidebar fixed left-0 top-0 h-full z-30 no-print">
        <Sidebar />
      </div>
      <div className="flex-1 ml-60 main-content">
        <div className="fixed top-0 left-60 right-0 z-20 no-print">
          {isDashboard ? <Header /> : <Breadcrumb />}
        </div>
        <div className={`${isDashboard ? 'pt-14' : 'pt-10'} px-6 pb-8`}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
