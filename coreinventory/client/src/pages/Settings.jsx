import React, { useState, useEffect } from 'react'
import { Save, Plus, Pencil, Trash2, X } from 'lucide-react'
import API from '../api/client'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'
import Spinner from '../components/Spinner'

export default function Settings() {
  const { toasts, toast, removeToast } = useToast()

  // Warehouses state
  const [warehouses, setWarehouses] = useState([])
  const [whForm, setWhForm] = useState({ name: '', short_code: '', address: '' })
  const [whEditing, setWhEditing] = useState(null)
  const [whSaving, setWhSaving] = useState(false)
  const [whDelete, setWhDelete] = useState(null)
  const [whLoading, setWhLoading] = useState(true)

  // Locations state
  const [locations, setLocations] = useState([])
  const [locForm, setLocForm] = useState({ name: '', short_code: '', warehouse_id: '' })
  const [locEditing, setLocEditing] = useState(null)
  const [locSaving, setLocSaving] = useState(false)
  const [locDelete, setLocDelete] = useState(null)
  const [locLoading, setLocLoading] = useState(true)

  useEffect(() => {
    fetchWarehouses()
    fetchLocations()
  }, [])

  const fetchWarehouses = async () => {
    try {
      const res = await API.get('/api/warehouses')
      setWarehouses(res.data)
    } catch { toast.error('Failed to load warehouses') } finally { setWhLoading(false) }
  }

  const fetchLocations = async () => {
    try {
      const res = await API.get('/api/locations')
      setLocations(res.data)
    } catch { toast.error('Failed to load locations') } finally { setLocLoading(false) }
  }

  // Warehouse handlers
  const handleWhSave = async (e) => {
    e.preventDefault()
    if (!whForm.name || !whForm.short_code) { toast.error('Name and short code are required'); return }
    setWhSaving(true)
    try {
      if (whEditing) {
        await API.put(`/api/warehouses/${whEditing}`, whForm)
        toast.success('Warehouse updated')
      } else {
        await API.post('/api/warehouses', whForm)
        toast.success('Warehouse created')
      }
      setWhForm({ name: '', short_code: '', address: '' })
      setWhEditing(null)
      fetchWarehouses()
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed') } finally { setWhSaving(false) }
  }

  const handleWhEdit = (w) => {
    setWhEditing(w.id)
    setWhForm({ name: w.name, short_code: w.short_code, address: w.address || '' })
  }

  const handleWhDelete = async () => {
    try {
      await API.delete(`/api/warehouses/${whDelete}`)
      toast.success('Warehouse deleted')
      setWhDelete(null)
      fetchWarehouses()
      fetchLocations()
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed') }
  }

  // Location handlers
  const handleLocSave = async (e) => {
    e.preventDefault()
    if (!locForm.name || !locForm.warehouse_id) { toast.error('Name and warehouse are required'); return }
    setLocSaving(true)
    try {
      if (locEditing) {
        await API.put(`/api/locations/${locEditing}`, locForm)
        toast.success('Location updated')
      } else {
        await API.post('/api/locations', locForm)
        toast.success('Location created')
      }
      setLocForm({ name: '', short_code: '', warehouse_id: '' })
      setLocEditing(null)
      fetchLocations()
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed') } finally { setLocSaving(false) }
  }

  const handleLocEdit = (l) => {
    setLocEditing(l.id)
    setLocForm({ name: l.name, short_code: l.short_code || '', warehouse_id: l.warehouse_id })
  }

  const handleLocDelete = async () => {
    try {
      await API.delete(`/api/locations/${locDelete}`)
      toast.success('Location deleted')
      setLocDelete(null)
      fetchLocations()
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed') }
  }

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog isOpen={!!whDelete} onConfirm={handleWhDelete} onCancel={() => setWhDelete(null)}
        title="Delete Warehouse" message="Delete this warehouse? All its locations will also be deleted." confirmText="Delete" />
      <ConfirmDialog isOpen={!!locDelete} onConfirm={handleLocDelete} onCancel={() => setLocDelete(null)}
        title="Delete Location" message="Are you sure you want to delete this location?" confirmText="Delete" />

      <div>
        <h2 className="font-heading font-bold text-2xl text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Manage warehouses and locations</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Warehouse Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-heading font-semibold text-gray-900 mb-1">Warehouse</h3>
          <p className="text-xs text-gray-500 mb-4">This page contains the warehouse details & location.</p>

          <form onSubmit={handleWhSave} className="space-y-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name:</label>
              <input value={whForm.name} onChange={e => setWhForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Warehouse name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Code:</label>
              <input value={whForm.short_code} onChange={e => setWhForm(p => ({ ...p, short_code: e.target.value }))}
                placeholder="e.g. MW"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address:</label>
              <input value={whForm.address} onChange={e => setWhForm(p => ({ ...p, address: e.target.value }))}
                placeholder="Full address"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={whSaving}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                {whSaving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                <Save size={14} /> {whEditing ? 'Update' : 'Save'}
              </button>
              {whEditing && (
                <button type="button" onClick={() => { setWhEditing(null); setWhForm({ name: '', short_code: '', address: '' }) }}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <X size={14} /> Cancel
                </button>
              )}
              <button type="button" onClick={() => { setWhEditing(null); setWhForm({ name: '', short_code: '', address: '' }) }}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Plus size={14} /> New
              </button>
            </div>
          </form>

          {whLoading ? <Spinner /> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Locs</th>
                  <th className="px-3 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {warehouses.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{w.name}</td>
                    <td className="px-3 py-2 text-gray-500">{w.short_code}</td>
                    <td className="px-3 py-2 text-gray-500">{w.locations?.length || 0}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleWhEdit(w)} className="text-gray-400 hover:text-indigo-600"><Pencil size={13} /></button>
                        <button onClick={() => setWhDelete(w.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Location Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-heading font-semibold text-gray-900 mb-1">location</h3>
          <p className="text-xs text-gray-500 mb-4">This holds the multiple locations of warehouse, rooms etc..</p>

          <form onSubmit={handleLocSave} className="space-y-3 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name:</label>
              <input value={locForm.name} onChange={e => setLocForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Location name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Code:</label>
              <input value={locForm.short_code} onChange={e => setLocForm(p => ({ ...p, short_code: e.target.value }))}
                placeholder="e.g. MS"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">warehouse:</label>
              <select value={locForm.warehouse_id} onChange={e => setLocForm(p => ({ ...p, warehouse_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.short_code} — {w.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={locSaving}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                {locSaving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                <Save size={14} /> {locEditing ? 'Update' : 'Save'}
              </button>
              {locEditing && (
                <button type="button" onClick={() => { setLocEditing(null); setLocForm({ name: '', short_code: '', warehouse_id: '' }) }}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <X size={14} /> Cancel
                </button>
              )}
              <button type="button" onClick={() => { setLocEditing(null); setLocForm({ name: '', short_code: '', warehouse_id: '' }) }}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Plus size={14} /> New
              </button>
            </div>
          </form>

          {locLoading ? <Spinner /> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Warehouse</th>
                  <th className="px-3 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {locations.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{l.name}</td>
                    <td className="px-3 py-2 text-gray-500">{l.warehouse_name}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleLocEdit(l)} className="text-gray-400 hover:text-indigo-600"><Pencil size={13} /></button>
                        <button onClick={() => setLocDelete(l.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
