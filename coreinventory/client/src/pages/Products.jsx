import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import API from '../api/client'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'

export default function Products() {
  const navigate = useNavigate()
  const { toasts, toast, removeToast } = useToast()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', sku: '', category_id: '', uom: 'pcs', per_unit_cost: '', reorder_qty: 10, initial_stock: '', initial_location_id: '' })
  const [saving, setSaving] = useState(false)
  const [editStockRow, setEditStockRow] = useState(null)
  const [editStockVal, setEditStockVal] = useState('')

  useEffect(() => {
    fetchProducts()
    fetchMeta()
  }, [search, categoryFilter])

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category_id', categoryFilter)
      const res = await API.get('/api/products?' + params.toString())
      setProducts(res.data)
    } catch (err) {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const fetchMeta = async () => {
    try {
      const [cRes, lRes] = await Promise.all([API.get('/api/categories'), API.get('/api/locations')])
      setCategories(cRes.data)
      setLocations(lRes.data)
    } catch {}
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await API.post('/api/products', form)
      toast.success('Product created successfully')
      setShowModal(false)
      setForm({ name: '', sku: '', category_id: '', uom: 'pcs', per_unit_cost: '', reorder_qty: 10, initial_stock: '', initial_location_id: '' })
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  const handleStockEdit = async (product) => {
    if (!editStockVal || editStockRow !== product.id) return
    try {
      const loc = locations[0]
      if (!loc) { toast.error('No locations available'); return }
      await API.patch(`/api/products/${product.id}/stock`, { location_id: loc.id, qty: parseFloat(editStockVal) })
      toast.success('Stock updated')
      setEditStockRow(null)
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update stock')
    }
  }

  const columns = [
    { key: '#', label: '#', render: (_, __, i) => <span className="text-gray-400">{i + 1}</span> },
    { key: 'name', label: 'Product', render: (v, row) => (
      <div>
        <p className="font-medium text-gray-800">{v}</p>
        <p className="text-xs text-gray-400">{row.sku}</p>
      </div>
    )},
    { key: 'per_unit_cost', label: 'Per Unit Cost', render: (v) => `₹${parseFloat(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    { key: 'on_hand', label: 'On Hand', render: (v, row) => (
      editStockRow === row.id ? (
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <input
            autoFocus
            type="number"
            value={editStockVal}
            onChange={e => setEditStockVal(e.target.value)}
            className="border border-indigo-400 rounded px-2 py-1 w-20 text-sm focus:outline-none"
            onKeyDown={e => { if (e.key === 'Enter') handleStockEdit(row); if (e.key === 'Escape') setEditStockRow(null) }}
          />
          <button
            className="text-xs bg-indigo-500 text-white px-2 py-1 rounded"
            onClick={(e) => { e.stopPropagation(); handleStockEdit(row) }}
          >Save</button>
          <button className="text-xs text-gray-500" onClick={e => { e.stopPropagation(); setEditStockRow(null) }}>✕</button>
        </div>
      ) : (
        <button
          className="font-bold text-gray-800 hover:text-indigo-600 hover:underline cursor-pointer"
          onClick={e => { e.stopPropagation(); setEditStockRow(row.id); setEditStockVal(v) }}
        >
          {v}
        </button>
      )
    )},
    { key: 'free_to_use', label: 'Free to Use', render: (v) => <span className={parseFloat(v) < 0 ? 'text-red-500' : ''}>{v}</span> },
    { key: 'reorder_qty', label: 'Reorder Qty', render: (v, row) => (
      <span className={parseFloat(row.on_hand) <= parseFloat(v) ? 'text-red-500 font-medium' : ''}>{v}</span>
    )},
    { key: 'is_low_stock', label: 'Status', render: (v) => <StatusBadge status={v ? 'LOW' : 'OK'} /> },
  ]

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div>
        <h2 className="font-heading font-bold text-2xl text-gray-900">Stock</h2>
        <p className="text-sm text-gray-500">Manage your product inventory</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SKU…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={16} /> New Product
        </button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        onRowClick={(row) => editStockRow !== row.id && navigate(`/products/${row.id}`)}
        emptyMessage="No products found. Create your first product."
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Product" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input required value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measure</label>
              <input value={form.uom} onChange={e => setForm(p => ({ ...p, uom: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per Unit Cost (₹)</label>
              <input type="number" step="0.01" value={form.per_unit_cost} onChange={e => setForm(p => ({ ...p, per_unit_cost: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Qty</label>
              <input type="number" value={form.reorder_qty} onChange={e => setForm(p => ({ ...p, reorder_qty: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock Qty</label>
              <input type="number" value={form.initial_stock} onChange={e => setForm(p => ({ ...p, initial_stock: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Location</label>
              <select value={form.initial_location_id} onChange={e => setForm(p => ({ ...p, initial_location_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select location</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.warehouse_name} — {l.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
              Create Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
