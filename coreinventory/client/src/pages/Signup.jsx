import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Box, CheckCircle } from 'lucide-react'
import API from '../api/client'
import useAuthStore from '../store/authStore'

export default function Signup() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs = {}
   
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email || !emailRegex.test(form.email)) {
      errs.email = 'Invalid email format'
    }
    if (!form.password || form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters'
    } else if (!/[a-z]/.test(form.password)) {
      errs.password = 'Password must contain at least one lowercase letter'
    } else if (!/[A-Z]/.test(form.password)) {
      errs.password = 'Password must contain at least one uppercase letter'
    } else if (!/[^a-zA-Z0-9]/.test(form.password)) {
      errs.password = 'Password must contain at least one special character'
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match'
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      const res = await API.post('/api/auth/signup', {
        name: form.name, email: form.email, password: form.password
      })
      login(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err) {
      setServerError(err.response?.data?.error || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setErrors(p => ({ ...p, [key]: '' })) }}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors[key] ? 'border-red-400' : 'border-gray-300'}`}
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen flex">
      <div className="w-2/5 bg-[#1A1D23] flex flex-col items-center justify-center px-10 py-12">
        <div className="flex flex-col items-center mb-8">
          <Box size={48} className="text-indigo-400 mb-3" />
          <h1 className="font-heading font-bold text-white text-2xl">CoreInventory</h1>
          <p className="text-[#9EA3AE] text-sm mt-2 text-center">Real-time inventory control for modern businesses</p>
        </div>
        <div className="space-y-3 w-full max-w-xs">
          {['Manage products and categories', 'Process receipts and deliveries', 'Internal transfers and adjustments'].map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-[#9EA3AE] text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-3/5 bg-white flex items-center justify-center px-10">
        <div className="w-full max-w-md">
          <h2 className="font-heading font-bold text-gray-900 text-3xl mb-2">Create account</h2>
          <p className="text-gray-500 text-sm mb-8">Join CoreInventory today</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {serverError}
              </div>
            )}
            {field('name', 'Name (6–12 characters)', 'text', 'Enter login name')}
            {field('email', 'Email', 'email', 'you@example.com')}
            {field('password', 'Password', 'password', '••••••••')}
            {field('confirmPassword', 'Confirm Password', 'password', '••••••••')}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
