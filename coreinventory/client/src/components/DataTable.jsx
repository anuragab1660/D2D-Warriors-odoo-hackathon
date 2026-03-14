import React from 'react'
import EmptyState from './EmptyState'
import { Package } from 'lucide-react'

function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function DataTable({
  columns, data, onRowClick, loading, emptyMessage, emptyIcon, className
}) {
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className || ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 ${className || ''}`}>
        <EmptyState
          icon={emptyIcon || Package}
          title="No records found"
          description={emptyMessage || 'No data available yet.'}
        />
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className || ''}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, ri) => (
              <tr
                key={row.id || ri}
                onClick={() => onRowClick && onRowClick(row)}
                className={`text-sm text-gray-700 border-b border-gray-100 ${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                    {col.render
                      ? col.render(row[col.key], row, ri)
                      : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
