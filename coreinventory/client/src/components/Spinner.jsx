import React from 'react'

export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-2' }
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-gray-200 border-t-indigo-500 ${sizes[size] || sizes.md}`} />
    </div>
  )
}
