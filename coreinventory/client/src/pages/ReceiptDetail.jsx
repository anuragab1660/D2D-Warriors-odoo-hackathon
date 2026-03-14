import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Printer } from 'lucide-react'
import API from '../api/client'
import useAuthStore from '../store/authStore'
import ConfirmDialog from '../components/ConfirmDialog'
import Spinner from '../components/Spinner'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'

function StatusStepper({ status }) {
  const steps = ['draft', 'ready', 'done']
  const idx = steps.indexOf(status)
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              i < idx ? 'bg-green-500' : i === idx ? 'bg-indigo-500' : 'border-2 border-gray-300 bg-white'
            }`} />
            <span className={`text-xs font-medium capitalize ${i === idx ? 'text-indigo-600' : i < idx ? 'text-green-600' : 'text-gray-400'}`}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className="w-8 h-px bg-gray-300" />}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function ReceiptDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { toasts, toast, removeToast } = useToast()
  const isNew = id === 'new'

  const [receipt, setReceipt] = useState(null)
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const [form, setForm] = useState({
    supplier: '', location_id: '', notes: '', date: new Date().toISOString().split('T')[0],
    schedule_date: '', responsible: user?.name || '', destination_type: 'internal', warehouse_id: ''
  })
  const [lines, setLines] = useState([{ product_id: '', expected_qty: 0, received_qty: 0 }])

  useEffect(() => {
    fetchMeta()
    if (!isNew) fetchReceipt()
  }, [id])

  const fetchReceipt = async () => {
    try {
      const res = await API.get(`/api/receipts/${id}`)
      const r = res.data
      setReceipt(r)
      setForm({
        supplier: r.supplier || '', location_id: r.location_id || '',
        notes: r.notes || '', date: r.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        schedule_date: r.schedule_date?.split('T')[0] || '',
        responsible: r.responsible || user?.name || '',
        destination_type: r.destination_type || 'internal',
        warehouse_id: r.warehouse_id || ''
      })
      setLines(r.lines?.map(l => ({ product_id: l.product_id, expected_qty: l.expected_qty, received_qty: l.received_qty })) || [])
    } catch { toast.error('Failed to load receipt') } finally { setLoading(false) }
  }

  const fetchMeta = async () => {
    try {
      const [pRes, lRes, wRes] = await Promise.all([
        API.get('/api/products'),
        API.get('/api/locations'),
        API.get('/api/warehouses')
      ])
      setProducts(pRes.data)
      setLocations(lRes.data)
      setWarehouses(wRes.data)
    } catch {}
  }

  const filteredLocations = form.warehouse_id
    ? locations.filter(l => l.warehouse_id === parseInt(form.warehouse_id))
    : locations

  const handleSave = async () => {
    if (!form.location_id) { toast.error('Please select a location'); return }
    setSaving(true)
    try {
      const payload = { ...form, lines: lines.filter(l => l.product_id) }
      if (isNew) {
        const res = await API.post('/api/receipts', payload)
        toast.success('Receipt created')
        navigate(`/receipts/${res.data.id}`)
      } else {
        await API.put(`/api/receipts/${id}`, payload)
        toast.success('Receipt saved')
        fetchReceipt()
      }
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed') } finally { setSaving(false) }
  }

  const handleAction = async (action) => {
    setActionLoading(true)
    try {
      const res = await API.post(`/api/receipts/${id}/${action}`)
      toast.success(action === 'todo' ? 'Receipt moved to Ready' : 'Receipt validated and stock updated')
      setReceipt(res.data)
      setLines(res.data.lines?.map(l => ({ product_id: l.product_id, expected_qty: l.expected_qty, received_qty: l.received_qty })) || [])
    } catch (err) { toast.error(err.response?.data?.error || 'Action failed') } finally { setActionLoading(false) }
  }

  const handleDelete = async () => {
    try {
      await API.delete(`/api/receipts/${id}`)
      toast.success('Receipt deleted')
      navigate('/receipts')
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed') }
  }

  const addLine = () => setLines(p => [...p, { product_id: '', expected_qty: 0, received_qty: 0 }])
  const removeLine = (i) => setLines(p => p.filter((_, idx) => idx !== i))
  const updateLine = (i, field, val) => setLines(p => p.map((l, idx) => idx === i ? { ...l, [field]: val } : l))

  const isEditable = isNew || receipt?.status === 'draft'
  const status = receipt?.status || 'draft'

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog isOpen={showDelete} onConfirm={handleDelete} onCancel={() => setShowDelete(false)}
        title="Delete Receipt" message="Are you sure you want to delete this receipt?" confirmText="Delete" />

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {!isNew && <StatusStepper status={status} />}
        </div>
        <div className="flex items-center gap-2 no-print">
          {(isNew || status === 'draft') && (
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
              {!isNew && <button onClick={() => setShowDelete(true)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>}
            </>
          )}
          {status === 'ready' && (
            <>
              <button onClick={() => handleAction('validate')} disabled={actionLoading}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                {actionLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                Validate ✓
              </button>
              <button onClick={() => handleAction('todo')} disabled={actionLoading}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm">
                Cancel
              </button>
            </>
          )}
          {status === 'done' && (
            <button onClick={() => window.print()} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Printer size={15} /> Print
            </button>
          )}
        </div>
      </div>

      {/* Status legend */}
      {!isNew && (
        <p className="text-xs text-gray-400">Draft — Initial stage | Ready — Ready to receive | Done — Received</p>
      )}

      {/* Done banner */}
      {status === 'done' && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm font-medium">
          ✓ Received — Stock has been updated
        </div>
      )}

      {/* Header form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">
          {isNew ? 'New Receipt' : receipt?.ref}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receive From (Supplier)</label>
            <input value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination Type</label>
            <select value={form.destination_type} onChange={e => setForm(p => ({ ...p, destination_type: e.target.value }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50">
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date</label>
            <input type="date" value={form.schedule_date} onChange={e => setForm(p => ({ ...p, schedule_date: e.target.value }))} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Warehouse</label>
            <select value={form.warehouse_id} onChange={e => { setForm(p => ({ ...p, warehouse_id: e.target.value, location_id: '' })) }} disabled={!isEditable}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50">
              <option value="">All Warehouses</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination Location *</label>
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
                    <span className="text-sm">[{products.find(p => p.id === line.product_id || p.id === parseInt(line.product_id))?.sku}] {products.find(p => p.id === line.product_id || p.id === parseInt(line.product_id))?.name || receipt?.lines?.[i]?.product_name}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {isEditable ? (
                    <input type="number" value={line.received_qty} onChange={e => updateLine(i, 'received_qty', e.target.value)} min={0}
                      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  ) : (
                    <span className="text-sm font-medium">{line.received_qty}</span>
                  )}
                </td>
                {isEditable && (
                  <td className="px-4 py-2">
                    <button onClick={() => removeLine(i)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {isEditable && (
          <button onClick={addLine} className="mt-3 flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            <Plus size={15} /> New Product
          </button>
        )}
      </div>

      <div className="no-print">
        <button onClick={() => navigate('/receipts')} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          ← Receipts
        </button>
      </div>
    </div>
  )
}
