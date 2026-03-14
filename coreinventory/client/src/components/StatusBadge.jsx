import React from 'react'

const colors = {
  draft:      'bg-gray-100 text-gray-600',
  waiting:    'bg-blue-100 text-blue-700',
  ready:      'bg-amber-100 text-amber-700',
  picking:    'bg-sky-100 text-sky-700',
  packing:    'bg-violet-100 text-violet-700',
  done:       'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
  canceled:   'bg-red-100 text-red-600',
  LOW:        'bg-red-100 text-red-600',
  OK:         'bg-green-100 text-green-700',
  receipt:    'bg-blue-100 text-blue-700',
  delivery:   'bg-purple-100 text-purple-700',
  transfer:   'bg-indigo-100 text-indigo-700',
  adjustment: 'bg-orange-100 text-orange-700',
  receipts:   'bg-blue-100 text-blue-700',
  deliveries: 'bg-purple-100 text-purple-700',
  transfers:  'bg-indigo-100 text-indigo-700',
  adjustments:'bg-orange-100 text-orange-700',
}

const labels = {
  draft: 'Draft', waiting: 'Waiting', ready: 'Ready',
  picking: 'Picking', packing: 'Packing',
  done: 'Done', cancelled: 'Cancelled', canceled: 'Cancelled',
  LOW: 'Low Stock', OK: 'In Stock',
  receipt: 'Receipt', delivery: 'Delivery',
  transfer: 'Transfer', adjustment: 'Adjustment',
  receipts: 'Receipt', deliveries: 'Delivery',
  transfers: 'Transfer', adjustments: 'Adjustment',
}

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase ? status.toLowerCase() : status
  const colorClass = colors[status] || colors[key] || 'bg-gray-100 text-gray-600'
  const label = labels[status] || labels[key] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : '')

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
