import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Printer, AlertTriangle } from 'lucide-react'
import API from '../api/client'
import useAuthStore from '../store/authStore'
import Spinner from '../components/Spinner'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'

function StatusStepper({ status }) {
  const steps = ['draft', 'waiting', 'ready', 'done']
  const idx = steps.indexOf(status)
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              i < idx ? 'bg-green-500' : i === idx ? 'bg-indigo-500' : 'border-2 border-gray-300 bg-white'
            }`} />
            <span className={`text-xs font-medium capitalize ${i === idx ? 'text-indigo-600' : i < idx ? 'text-green-600' : 'text-gray-400'}`}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className="w-6 h-px bg-gray-300" />}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function DeliveryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toasts, toast, removeToast } = useToast()
  const isNew = id === 'new'

  const [delivery, setDelivery] = useState(null)
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [metaLoading, setMetaLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [shortages, setShortages] = useState([])

  const [locationStock, setLocationStock] = useState({})

  const [form, setForm] = useState({
    destination: '', city: '', location_id: '', notes: '',
    date: new Date().toISOString().split('T')[0], schedule_date: '',
    responsible: user?.name || '', destination_type: 'customer', warehouse_id: ''
  })
  const [lines, setLines] = useState([{ product_id: '', qty_demanded: 0 }])

  useEffect(() => {
    fetchMeta()
    if (!isNew) fetchDelivery()
  }, [id])

  useEffect(() => {
    if (form.location_id) {
      API.get(`/api/locations/${form.location_id}/stock`)
        .then(res => {
          const map = {}
          res.data.forEach(s => { map[s.product_id] = parseFloat(s.qty) })
          setLocationStock(map)
        })
        .catch(() => {})
    } else {
      setLocationStock({})
    }
  }, [form.location_id])

  const fetchDelivery = async () => {
    try {
      const res = await API.get(`/api/deliveries/${id}`)
      const d = res.data
      setDelivery(d)
      setForm({
        destination: d.destination || '', city: d.city || '',
        location_id: d.location_id || '', notes: d.notes || '',
        date: d.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        schedule_date: d.schedule_date?.split('T')[0] || '',
        responsible: d.responsible || user?.name || '',
        destination_type: d.destination_type || 'customer',
        warehouse_id: d.warehouse_id || ''
      })
      setLines(d.lines?.map(l => ({ product_id: l.product_id, qty_demanded: l.qty_demanded })) || [])
    } catch { toast.error('Failed to load delivery') } finally { setLoading(false) }
  }

  const fetchMeta = async () => {
    setMetaLoading(true)
    try {
      const [pRes, lRes, wRes] = await Promise.all([API.get('/api/products'), API.get('/api/locations'), API.get('/api/warehouses')])
      setProducts(pRes.data)
      setLocations(lRes.data)
      setWarehouses(wRes.data)
    } catch {
      toast.error('Failed to load form data. Please refresh the page.')
    } finally {
      setMetaLoading(false)
    }
  }

  const filteredLocations = form.warehouse_id
    ? locations.filter(l => l.warehouse_id === parseInt(form.warehouse_id))
    : locations

  const handleSave = async () => {
    if (!form.location_id) { toast.error('Please select a source location'); return }
    setSaving(true)
    try {
      const payload = { ...form, lines: lines.filter(l => l.product_id) }
      if (isNew) {
        const res = await API.post('/api/deliveries', payload)
        toast.success('Delivery created')
        navigate(`/deliveries/${res.data.id}`)
      } else {
        await API.put(`/api/deliveries/${id}`, payload)
        toast.success('Delivery saved')
        fetchDelivery()
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed') } finally { setSaving(false) }
  }

  const handleAction = async (action) => {
    setActionLoading(true)
    setShortages([])
    try {
      const res = await API.post(`/api/deliveries/${id}/${action}`)
      if (res.data.status === 'waiting' && res.data.shortages) {
        setShortages(res.data.shortages)
        toast.warning('Some products are out of stock')
      } else {
        toast.success(action === 'todo' ? 'Delivery marked as Ready' : action === 'validate' ? 'Delivery completed' : 'Delivery cancelled')
      }
      await fetchDelivery()
    } catch (err) { toast.error(err.response?.data?.error || 'Action failed') } finally { setActionLoading(false) }
  }

  const handleStatusChange = async (newStatus) => {
    if (newStatus === delivery?.status) return
    setActionLoading(true)
    setShortages([])
    try {
      await API.patch(`/api/deliveries/${id}/status`, { status: newStatus })
      toast.success(`Status updated to ${newStatus}`)
      await fetchDelivery()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change status')
    } finally {
      setActionLoading(false)
    }
  }

  const addLine = () => setLines(p => [...p, { product_id: '', qty_demanded: 0 }])
  const removeLine = (i) => setLines(p => p.filter((_, idx) => idx !== i))
  const updateLine = (i, field, val) => setLines(p => p.map((l, idx) => idx === i ? { ...l, [field]: val } : l))

  const isEditable = isNew || ['draft', 'waiting'].includes(delivery?.status || '')
  const status = delivery?.status || 'draft'

  if (loading || metaLoading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-gray-400">{metaLoading ? 'Loading form data…' : 'Loading delivery…'}</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <StatusStepper status={status} />
        <div className="flex items-center gap-2">
          {(isNew || ['draft', 'waiting'].includes(status)) && (
            <>
              <button onClick={handleSave} disabled={saving}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                {isNew ? 'Create' : 'Save'}
              </button>
              {!isNew && (
                <button onClick={() => handleAction('todo')} disabled={actionLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                  TODO →
                </button>
              )}
              {!isNew && <button onClick={() => handleAction('cancel')} disabled={actionLoading} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>}
            </>
          )}
          {status === 'ready' && (
            <>
              <button onClick={() => handleAction('validate')} disabled={actionLoading}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                Validate ✓
              </button>
              <button onClick={() => handleAction('cancel')} disabled={actionLoading} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
            </>
          )}
          {status === 'done' && (
            <button onClick={() => window.print()} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Printer size={15} /> Print
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400">Draft: Initial state | Waiting: Waiting for stock | Ready: Ready to deliver | Done: Delivered</p>

      {/* Waiting banner */}
      {status === 'waiting' && shortages.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">Waiting for stock — the following products are currently unavailable:</span>
          </div>
          <ul className="text-xs ml-6 list-disc">
            {shortages.map((s, i) => <li key={i}>{s.product} — Available: {s.available}, Demanded: {s.demanded}</li>)}
          </ul>
        </div>
      )}

      {/* Done banner */}
      {status === 'done' && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium">
          ✓ Delivered — Stock has been updated
        </div>
      )}

      {/* Cancelled banner */}
      {status === 'cancelled' && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm font-medium">
          ✗ Cancelled
        </div>
      )}

      {/* Header form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">
          {isNew ? 'New Delivery' : delivery?.ref}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Adress</label>
            <input value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operation type</label>
            <select value={form.destination_type} onChange={e => setForm(p => ({ ...p, destination_type: e.target.value }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50">
              <option value="customer">Customer</option>
              <option value="internal">Internal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date</label>
            <input type="date" value={form.schedule_date} onChange={e => setForm(p => ({ ...p, schedule_date: e.target.value }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Warehouse</label>
            <select value={form.warehouse_id} onChange={e => { setForm(p => ({ ...p, warehouse_id: e.target.value, location_id: '' })); setLocationStock({}) }} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50">
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Location *</label>
            <select value={form.location_id} onChange={e => setForm(p => ({ ...p, location_id: e.target.value }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50">
              <option value="">Select location</option>
              {filteredLocations.map(l => <option key={l.id} value={l.id}>{l.warehouse_name} — {l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsible</label>
            <input value={form.responsible} onChange={e => setForm(p => ({ ...p, responsible: e.target.value }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            {isNew ? (
              <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500">
                Draft
              </div>
            ) : (
              <>
                <select
                  value={status}
                  onChange={e => handleStatusChange(e.target.value)}
                  disabled={actionLoading || status === 'done' || status === 'cancelled'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 capitalize"
                >
                  <option value="draft">Draft</option>
                  <option value="waiting">Waiting</option>
                  <option value="ready">Ready</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {(status === 'done' || status === 'cancelled') && (
                  <p className="text-xs text-gray-400 mt-1">Status is locked — cannot be changed</p>
                )}
              </>
            )}
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} disabled={!isEditable} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 resize-none" />
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">Products</h3>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Quantity</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Available at Location</th>
              {isEditable && <th className="px-4 py-2 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map((line, i) => {
              const prod = products.find(p => p.id === parseInt(line.product_id))
              const locAvail = form.location_id && line.product_id
                ? (locationStock[parseInt(line.product_id)] ?? null)
                : null
              const deliveryLineStock = delivery?.lines?.[i]?.current_stock
              const availableQty = locAvail !== null ? locAvail : (deliveryLineStock ?? prod?.free_to_use ?? 0)
              const isShort = prod && parseFloat(availableQty) < parseFloat(line.qty_demanded)
              return (
                <tr key={i} className={isShort && isEditable ? 'bg-red-50' : ''}>
                  <td className="px-4 py-2">
                    {isEditable ? (
                      <select value={line.product_id} onChange={e => updateLine(i, 'product_id', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select product</option>
                        {products.map(p => <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>)}
                      </select>
                    ) : (
                      <span className="text-sm">[{delivery?.lines?.[i]?.sku || prod?.sku}] {delivery?.lines?.[i]?.product_name || prod?.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {isEditable ? (
                      <div className="flex items-center gap-2">
                        <input type="number" value={line.qty_demanded} onChange={e => updateLine(i, 'qty_demanded', e.target.value)} min={0}
                          className={`border rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isShort ? 'border-red-400' : 'border-gray-300'}`} />
                        {isShort && <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-0.5 rounded">LOW STOCK</span>}
                      </div>
                    ) : (
                      <span className="text-sm font-medium">{line.qty_demanded}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {line.product_id ? (
                      <span className={`text-sm font-medium ${isShort ? 'text-red-600' : 'text-green-600'}`}>
                        {availableQty}
                        {isShort && form.location_id && (
                          <span className="text-xs text-red-400 block">Need {line.qty_demanded}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
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
            <Plus size={15} /> Add New product
          </button>
        )}
      </div>

      <div className="no-print">
        <button onClick={() => navigate('/deliveries')} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          ← Deliveries
        </button>
      </div>
    </div>
  )
}
