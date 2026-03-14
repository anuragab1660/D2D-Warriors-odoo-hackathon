import { useState, useCallback } from 'react'

let idCounter = 0

export default function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((type, message) => {
    const id = ++idCounter
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    warning: (msg) => addToast('warning', msg),
    info: (msg) => addToast('info', msg),
  }

  return { toasts, toast, removeToast }
}
