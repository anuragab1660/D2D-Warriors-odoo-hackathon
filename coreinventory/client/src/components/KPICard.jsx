import React from 'react'

export default function KPICard({ title, value, icon: Icon, iconBg, subtitle, trend }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold font-heading text-gray-900">{value ?? 0}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend && <p className="text-xs mt-1 text-gray-500">{trend}</p>}
      </div>
      {Icon && (
        <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ml-3 ${iconBg || 'bg-indigo-100'}`}>
          <Icon size={20} className="text-current" />
        </div>
      )}
    </div>
  )
}
