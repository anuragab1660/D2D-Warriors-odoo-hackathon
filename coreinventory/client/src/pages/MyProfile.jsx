import React, { useState } from 'react'
import API from '../api/client'
import useAuthStore from '../store/authStore'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'

export default function MyProfile() {
  const { user, setUser } = useAuthStore()
  const { toasts, toast, removeToast } = useToast()

  const [nameForm, setNameForm] = useState({ name: user?.name || '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [nameSaving, setNameSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'

  const handleNameSave = async (e) => {
    e.preventDefault()
    if (!nameForm.name || nameForm.name.length < 6 || nameForm.name.length > 15) {
      toast.error('Name must be between 6 and 15 characters')
      return
    }
    setNameSaving(true)
    try {
      const res = await API.put('/api/auth/profile', { name: nameForm.name })
      setUser(res.data)
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed')
    } finally { setNameSaving(false) }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Passwords do not match')
      return
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters')
      return
    }
    setPwSaving(true)
    try {
      await API.put('/api/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      })
      toast.success('Password updated successfully')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password update failed')
    } finally { setPwSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div>
        <h2 className="font-heading font-bold text-2xl text-gray-900">My Profile</h2>
        <p className="text-sm text-gray-500">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
            {initials}
          </div>
          <div>
            <h3 className="font-heading font-bold text-xl text-gray-900">{user?.name}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 mt-1 capitalize">
              {user?.role || 'staff'}
            </span>
          </div>
        </div>

        <form onSubmit={handleNameSave} className="space-y-4">
          <h4 className="font-heading font-semibold text-gray-800 text-base">Edit Profile</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name (6–15 characters)</label>
            <input
              value={nameForm.name}
              onChange={e => setNameForm({ name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={user?.email || ''} disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600 capitalize">
              {user?.role || 'staff'}
            </span>
          </div>
          <button type="submit" disabled={nameSaving}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            {nameSaving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
            Save Changes
          </button>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="font-heading font-semibold text-gray-800 text-base mb-4">Change Password</h4>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          {pwError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{pwError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <button type="submit" disabled={pwSaving}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            {pwSaving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}
