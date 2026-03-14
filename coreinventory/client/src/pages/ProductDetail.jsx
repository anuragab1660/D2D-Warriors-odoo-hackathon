import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import API from '../api/client'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import Spinner from '../components/Spinner'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'
import useAuthStore from '../store/authStore'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toasts, toast, removeToast } = useToast()
  const { user } = useAuthStore()
  const isManager = user?.role === 'manager'
  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [editStockId, setEditStockId] = useState(null)
  const [editStockVal, setEditStockVal] = useState('')

  useEffect(() => { fetchProduct(); fetchCategories() }, [id])

  const fetchProduct = async () => {
    try {
      const res = await API.get(`/api/products/${id}`)
      setProduct(res.data)
      setForm({
        name: res.data.name,
        sku: res.data.sku,
        category_id: res.data.category_id || '',
        uom: res.data.uom,
        per_unit_cost: res.data.per_unit_cost,
        reorder_qty: res.data.reorder_qty,
      })
    } catch { toast.error('Failed to load product') } finally { setLoading(false) }
  }

  const fetchCategories = async () => {
    try { const res = await API.get('/api/categories'); setCategories(res.data) } catch {}
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await API.put(`/api/products/${id}`, form)
      toast.success('Product updated')
      setEditing(false)
      fetchProduct()
    } catch (err) { toast.error(err.response?.data?.error || 'Update failed') } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try {
      await API.delete(`/api/products/${id}`)
      toast.success('Product deleted')
      navigate('/products')
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed') }
  }

  const handleStockEdit = async (stockItem) => {
    try {
      await API.patch(`/api/products/${id}/stock`, { location_id: stockItem.location_id, qty: parseFloat(editStockVal) })
      toast.success('Stock updated')
      setEditStockId(null)
      fetchProduct()
    } catch (err) { toast.error(err.response?.data?.error || 'Update failed') }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!product) return <div className="text-center py-20 text-gray-500">Product not found</div>

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog
        isOpen={showDelete}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? This will also remove all stock records.`}
        confirmText="Delete"
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-gray-900">{product.name}</h2>
          <p className="text-sm text-gray-500">{product.sku}</p>
        </div>
        {isManager && (
          <div className="flex items-center gap-2">
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  <Pencil size={15} /> Edit
                </button>
                <button onClick={() => setShowDelete(true)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <Trash2 size={15} /> Delete
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSave} disabled={saving} className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                  <Check size={15} /> Save
                </button>
                <button onClick={() => { setEditing(false); setForm({ name: product.name, sku: product.sku, category_id: product.category_id || '', uom: product.uom, per_unit_cost: product.per_unit_cost, reorder_qty: product.reorder_qty }) }}
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  <X size={15} /> Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Product Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">Product Information</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'sku', label: 'SKU', type: 'text' },
            { key: 'uom', label: 'Unit of Measure', type: 'text' },
            { key: 'per_unit_cost', label: 'Per Unit Cost (₹)', type: 'number' },
            { key: 'reorder_qty', label: 'Reorder Qty', type: 'number' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
              {editing ? (
                <input type={f.type} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              ) : (
                <p className="text-sm text-gray-800 font-medium">{product[f.key]}</p>
              )}
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            {editing ? (
              <select value={form.category_id || ''} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <p className="text-sm text-gray-800 font-medium">{product.category_name || '—'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stock by Location */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">Stock by Location</h3>
        {product.stock_by_location && product.stock_by_location.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Location', 'Warehouse', 'Qty', 'Status', ...(isManager ? ['Actions'] : [])].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {product.stock_by_location.map(s => (
                <tr key={s.id} className="text-sm">
                  <td className="px-4 py-3 font-medium">{s.location_name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.warehouse_name}</td>
                  <td className="px-4 py-3">
                    {isManager && editStockId === s.id ? (
                      <div className="flex items-center gap-2">
                        <input autoFocus type="number" value={editStockVal} onChange={e => setEditStockVal(e.target.value)}
                          className="border border-indigo-400 rounded px-2 py-1 w-24 text-sm focus:outline-none"
                          onKeyDown={e => { if (e.key === 'Enter') handleStockEdit(s); if (e.key === 'Escape') setEditStockId(null) }} />
                        <button onClick={() => handleStockEdit(s)} className="text-xs bg-indigo-500 text-white px-2 py-1 rounded">Save</button>
                        <button onClick={() => setEditStockId(null)} className="text-xs text-gray-500">✕</button>
                      </div>
                    ) : (
                      <span className="font-bold">{s.qty}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={parseFloat(s.qty) <= parseFloat(product.reorder_qty) ? 'LOW' : 'OK'} />
                  </td>
                  {isManager && (
                    <td className="px-4 py-3">
                      <button onClick={() => { setEditStockId(s.id); setEditStockVal(s.qty) }}
                        className="text-gray-400 hover:text-indigo-600 transition-colors">
                        <Pencil size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400 py-4 text-center">No stock records for this product</p>
        )}
      </div>

      <div>
        <button onClick={() => navigate('/products')} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          ← Products
        </button>
      </div>
    </div>
  )
}
