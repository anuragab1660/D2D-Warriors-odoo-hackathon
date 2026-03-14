import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const toastStyles = {
  success: 'bg-green-50 border border-green-200 text-green-800',
  error: 'bg-red-50 border border-red-200 text-red-800',
  warning: 'bg-amber-50 border border-amber-200 text-amber-800',
  info: 'bg-blue-50 border border-blue-200 text-blue-800',
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

function ToastItem({ toast, onRemove }) {
  const Icon = toastIcons[toast.type] || Info
  return (
    <div className={`flex items-center gap-3 rounded-lg shadow-lg p-4 min-w-[280px] max-w-sm animate-slide-in ${toastStyles[toast.type] || toastStyles.info}`}>
      <Icon size={18} className="flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X size={16} />
      </button>
    </div>
  )
}

export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 no-print">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  )
}
