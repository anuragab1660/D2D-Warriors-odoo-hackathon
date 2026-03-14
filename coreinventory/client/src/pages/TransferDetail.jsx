import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import API from '../api/client'
import Spinner from '../components/Spinner'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'

export default function TransferDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toasts, toast, removeToast } = useToast()
  const isNew = id === 'new'

  const [transfer, setTransfer] = useState(null)
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [form, setForm] = useState({
    from_warehouse_id: '', from_location_id: '',
    to_warehouse_id: '', to_location_id: '',
    notes: '', date: new Date().toISOString().split('T')[0]
  })
  const [lines, setLines] = useState([{ product_id: '', qty: 0 }])

  useEffect(() => {
    fetchMeta()
    if (!isNew) fetchTransfer()
  }, [id])

  const fetchTransfer = async () => {
    try {
      const res = await API.get(`/api/transfers/${id}`)
      const t = res.data
      setTransfer(t)
      setForm({
        from_warehouse_id: t.from_warehouse_id || '',
        from_location_id: t.from_location_id || '',
        to_warehouse_id: t.to_warehouse_id || '',
        to_location_id: t.to_location_id || '',
        notes: t.notes || '',
        date: t.date?.split('T')[0] || new Date().toISOString().split('T')[0]
      })
      setLines(t.lines?.map(l => ({ product_id: l.product_id, qty: l.qty })) || [])
    } catch { toast.error('Failed to load transfer') } finally { setLoading(false) }
  }

  const fetchMeta = async () => {
    try {
      const [pRes, lRes, wRes] = await Promise.all([API.get('/api/products'), API.get('/api/locations'), API.get('/api/warehouses')])
      setProducts(pRes.data)
      setLocations(lRes.data)
      setWarehouses(wRes.data)
    } catch {}
  }

  const fromLocations = form.from_warehouse_id ? locations.filter(l => l.warehouse_id === parseInt(form.from_warehouse_id)) : locations
  const toLocations = form.to_warehouse_id ? locations.filter(l => l.warehouse_id === parseInt(form.to_warehouse_id)) : locations

  const handleSave = async () => {
    if (!form.from_location_id || !form.to_location_id) { toast.error('Please select both locations'); return }
    if (form.from_location_id === form.to_location_id) { toast.error('Source and destination must be different'); return }
    setSaving(true)
    try {
      const payload = { ...form, lines: lines.filter(l => l.product_id) }
      if (isNew) {
        const res = await API.post('/api/transfers', payload)
        toast.success('Transfer created')
        navigate(`/transfers/${res.data.id}`)
      } else {
        await API.put(`/api/transfers/${id}`, payload)
        toast.success('Transfer saved')
        fetchTransfer()
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed') } finally { setSaving(false) }
  }

  const handleValidate = async () => {
    setActionLoading(true)
    try {
      await API.post(`/api/transfers/${id}/validate`)
      toast.success('Transfer validated — stock moved')
      fetchTransfer()
    } catch (err) { toast.error(err.response?.data?.error || 'Validation failed') } finally { setActionLoading(false) }
  }

  const addLine = () => setLines(p => [...p, { product_id: '', qty: 0 }])
  const removeLine = (i) => setLines(p => p.filter((_, idx) => idx !== i))
  const updateLine = (i, field, val) => setLines(p => p.map((l, idx) => idx === i ? { ...l, [field]: val } : l))

  const isEditable = isNew || transfer?.status === 'draft'
  const status = transfer?.status || 'draft'

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="font-heading font-bold text-2xl text-gray-900">{isNew ? 'New Transfer' : transfer?.ref}</h2>
          <p className="text-sm text-gray-500 capitalize">{status}</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditable && (
            <button onClick={handleSave} disabled={saving}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
              {isNew ? 'Create' : 'Save'}
            </button>
          )}
          {!isNew && status === 'draft' && (
            <button onClick={handleValidate} disabled={actionLoading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
              Validate ✓
            </button>
          )}
        </div>
      </div>

      {status === 'done' && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium">
          ✓ Transfer completed — stock moved
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Warehouse</label>
            <select value={form.from_warehouse_id} onChange={e => setForm(p => ({ ...p, from_warehouse_id: e.target.value, from_location_id: '' }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50">
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse</label>
            <select value={form.to_warehouse_id} onChange={e => setForm(p => ({ ...p, to_warehouse_id: e.target.value, to_location_id: '' }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50">
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Location *</label>
            <select value={form.from_location_id} onChange={e => setForm(p => ({ ...p, from_location_id: e.target.value }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50">
              <option value="">Select location</option>
              {fromLocations.map(l => <option key={l.id} value={l.id}>{l.warehouse_name} — {l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Location *</label>
            <select value={form.to_location_id} onChange={e => setForm(p => ({ ...p, to_location_id: e.target.value }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50">
              <option value="">Select location</option>
              {toLocations.map(l => <option key={l.id} value={l.id}>{l.warehouse_name} — {l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">Products</h3>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Quantity</th>
              {isEditable && <th className="px-4 py-2 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map((line, i) => (
              <tr key={i}>
                <td className="px-4 py-2">
                  {isEditable ? (
                    <select value={line.product_id} onChange={e => updateLine(i, 'product_id', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select product</option>
                      {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-sm">{transfer?.lines?.[i]?.product_name || '—'}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {isEditable ? (
                    <input type="number" value={line.qty} onChange={e => updateLine(i, 'qty', e.target.value)} min={0}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  ) : (
                    <span className="text-sm font-medium">{transfer?.lines?.[i]?.qty || line.qty}</span>
                  )}
                </td>
                {isEditable && (
                  <td className="px-4 py-2">
                    <button onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {isEditable && (
          <button onClick={addLine} className="mt-3 flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            <Plus size={15} /> Add Product
          </button>
        )}
      </div>

      <div className="no-print">
        <button onClick={() => navigate('/transfers')} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          ← Transfers
        </button>
      </div>
    </div>
  )
}
