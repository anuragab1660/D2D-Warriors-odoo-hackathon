import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

export default function ConfirmDialog({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Confirm', confirmVariant = 'danger' }) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title || 'Confirm Action'} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="text-red-500" size={24} />
        </div>
        <p className="text-sm text-gray-600">{message || 'Are you sure you want to proceed?'}</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white ${
              confirmVariant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
