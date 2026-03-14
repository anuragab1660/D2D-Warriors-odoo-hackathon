import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import API from '../api/client'
import Spinner from '../components/Spinner'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'

export default function AdjustmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toasts, toast, removeToast } = useToast()
  const isNew = id === 'new'

  const [adjustment, setAdjustment] = useState(null)
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [form, setForm] = useState({
    warehouse_id: '', location_id: '', notes: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [lines, setLines] = useState([{ product_id: '', system_qty: 0, counted_qty: 0 }])

  useEffect(() => {
    fetchMeta()
    if (!isNew) fetchAdjustment()
  }, [id])

  const fetchAdjustment = async () => {
    try {
      const res = await API.get(`/api/adjustments/${id}`)
      const a = res.data
      setAdjustment(a)
      setForm({
        warehouse_id: a.warehouse_id || '',
        location_id: a.location_id || '',
        notes: a.notes || '',
        date: a.date?.split('T')[0] || new Date().toISOString().split('T')[0]
      })
      setLines(a.lines?.map(l => ({
        product_id: l.product_id,
        system_qty: l.system_qty,
        counted_qty: l.counted_qty
      })) || [])
    } catch { toast.error('Failed to load adjustment') } finally { setLoading(false) }
  }

  const fetchMeta = async () => {
    try {
      const [pRes, lRes, wRes] = await Promise.all([API.get('/api/products'), API.get('/api/locations'), API.get('/api/warehouses')])
      setProducts(pRes.data)
      setLocations(lRes.data)
      setWarehouses(wRes.data)
    } catch {}
  }

  const fetchSystemQty = async (product_id, location_id) => {
    if (!product_id || !location_id) return 0
    try {
      const res = await API.get(`/api/products/${product_id}`)
      const stock = res.data.stock_by_location?.find(s => s.location_id === parseInt(location_id))
      return stock ? parseFloat(stock.qty) : 0
    } catch { return 0 }
  }

  const handleProductChange = async (i, product_id) => {
    const sys = await fetchSystemQty(product_id, form.location_id)
    setLines(p => p.map((l, idx) => idx === i ? { ...l, product_id, system_qty: sys, counted_qty: sys } : l))
  }

  const filteredLocations = form.warehouse_id ? locations.filter(l => l.warehouse_id === parseInt(form.warehouse_id)) : locations

  const handleSave = async () => {
    if (!form.location_id) { toast.error('Please select a location'); return }
    setSaving(true)
    try {
      const payload = { ...form, lines: lines.filter(l => l.product_id).map(l => ({ product_id: l.product_id, counted_qty: l.counted_qty })) }
      if (isNew) {
        const res = await API.post('/api/adjustments', payload)
        toast.success('Adjustment created')
        navigate(`/adjustments/${res.data.id}`)
      } else {
        await API.put(`/api/adjustments/${id}`, payload)
        toast.success('Adjustment saved')
        fetchAdjustment()
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed') } finally { setSaving(false) }
  }

  const handleValidate = async () => {
    setActionLoading(true)
    try {
      // Update counted_qty in lines before validating
      if (!isNew) {
        await API.put(`/api/adjustments/${id}`, {
          ...form,
          lines: lines.filter(l => l.product_id).map(l => ({ product_id: l.product_id, counted_qty: l.counted_qty }))
        })
      }
      await API.post(`/api/adjustments/${id}/validate`)
      toast.success('Adjustment validated — stock updated')
      fetchAdjustment()
    } catch (err) { toast.error(err.response?.data?.error || 'Validation failed') } finally { setActionLoading(false) }
  }

  const addLine = () => setLines(p => [...p, { product_id: '', system_qty: 0, counted_qty: 0 }])
  const removeLine = (i) => setLines(p => p.filter((_, idx) => idx !== i))
  const updateLine = (i, field, val) => setLines(p => p.map((l, idx) => idx === i ? { ...l, [field]: val } : l))

  const isEditable = isNew || adjustment?.status === 'draft'
  const status = adjustment?.status || 'draft'

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="font-heading font-bold text-2xl text-gray-900">{isNew ? 'New Adjustment' : adjustment?.ref}</h2>
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
          ✓ Adjustment validated — stock updated
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
            <select value={form.warehouse_id} onChange={e => setForm(p => ({ ...p, warehouse_id: e.target.value, location_id: '' }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50">
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
            <select value={form.location_id} onChange={e => setForm(p => ({ ...p, location_id: e.target.value }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50">
              <option value="">Select location</option>
              {filteredLocations.map(l => <option key={l.id} value={l.id}>{l.warehouse_name} — {l.name}</option>)}
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
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">System Qty</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Counted Qty</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Difference</th>
              {isEditable && <th className="px-4 py-2 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map((line, i) => {
              const diff = parseFloat(line.counted_qty || 0) - parseFloat(line.system_qty || 0)
              return (
                <tr key={i}>
                  <td className="px-4 py-2">
                    {isEditable ? (
                      <select value={line.product_id} onChange={e => handleProductChange(i, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select product</option>
                        {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                      </select>
                    ) : (
                      <span className="text-sm">{adjustment?.lines?.[i]?.product_name || '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">{line.system_qty}</span>
                  </td>
                  <td className="px-4 py-2">
                    {isEditable ? (
                      <input type="number" value={line.counted_qty} onChange={e => updateLine(i, 'counted_qty', e.target.value)} min={0}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    ) : (
                      <span className="text-sm font-medium">{line.counted_qty}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-sm font-semibold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  </td>
                  {isEditable && (
                    <td className="px-4 py-2">
                      <button onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        {isEditable && (
          <button onClick={addLine} className="mt-3 flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            <Plus size={15} /> Add Product
          </button>
        )}
      </div>

      <div className="no-print">
        <button onClick={() => navigate('/adjustments')} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          ← Adjustments
        </button>
      </div>
    </div>
  )
}
