import React from 'react'
import { Package } from 'lucide-react'

export default function EmptyState({ icon: Icon, title, description, action }) {
  const IconComponent = Icon || Package
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <IconComponent size={28} className="text-gray-400" />
      </div>
      <h3 className="font-heading font-semibold text-gray-700 mb-1">{title || 'No records found'}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{description || 'Nothing here yet.'}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
