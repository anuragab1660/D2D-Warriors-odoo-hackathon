import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Box, CheckCircle } from 'lucide-react'
import API from '../api/client'
import useAuthStore from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await API.post('/api/auth/login', form)
      login(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid Login Id or Password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left */}
      <div className="w-2/5 bg-[#1A1D23] flex flex-col items-center justify-center px-10 py-12">
        <div className="flex flex-col items-center mb-8">
          <Box size={48} className="text-indigo-400 mb-3" />
          <h1 className="font-heading font-bold text-white text-2xl">CoreInventory</h1>
          <p className="text-[#9EA3AE] text-sm mt-2 text-center">Real-time inventory control for modern businesses</p>
        </div>
        <div className="space-y-3 w-full max-w-xs">
          {['Track stock across multiple warehouses', 'Manage receipts, deliveries & transfers', 'Full audit trail with move history'].map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-[#9EA3AE] text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="w-3/5 bg-white flex items-center justify-center px-10">
        <div className="w-full max-w-md">
          <h2 className="font-heading font-bold text-gray-900 text-3xl mb-2">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to your CoreInventory account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="demo@coreinventory.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700">Forgot password?</Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
