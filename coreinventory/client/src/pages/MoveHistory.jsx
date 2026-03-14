import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Search } from 'lucide-react'
import API from '../api/client'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'

export default function MoveHistory() {
  const navigate = useNavigate()
  const { toasts, toast, removeToast } = useToast()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => { fetchHistory() }, [typeFilter, search])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter) params.set('type', typeFilter)
      if (search) params.set('search', search)
      const res = await API.get('/api/move-history?' + params.toString())
      setHistory(res.data)
    } catch { toast.error('Failed to load move history') } finally { setLoading(false) }
  }

  const columns = [
    { key: '#', label: '#', render: (_, __, i) => <span className="text-gray-400">{i + 1}</span> },
    { key: 'ref', label: 'Reference', render: (v, row, i) => {
      const prevRef = i > 0 ? history[i - 1]?.ref : null
      return (
        <span className={`font-medium ${prevRef === v ? 'text-gray-300 text-xs' : 'text-indigo-600'}`}>{v}</span>
      )
    }},
    { key: 'type', label: 'Type', render: (v) => <StatusBadge status={v} /> },
    { key: 'product_name', label: 'Product' },
    { key: 'from_location_name', label: 'From', render: (v) => v || <span className="text-gray-300">—</span> },
    { key: 'to_location_name', label: 'To', render: (v) => v || <span className="text-gray-300">—</span> },
    { key: 'qty', label: 'Quantity', render: (v, row) => {
      const isIn = row.type === 'receipt' || (row.type === 'transfer' && row.to_location_name)
      const isOut = row.type === 'delivery'
      const qty = parseFloat(v)
      return (
        <span className={`font-semibold ${qty > 0 && (row.type === 'receipt' || row.type === 'transfer') ? 'text-green-600' : qty < 0 || row.type === 'delivery' ? 'text-red-600' : 'text-gray-700'}`}>
          {qty > 0 && (row.type === 'receipt' || row.type === 'transfer') ? '+' : ''}{qty}
        </span>
      )
    }},
    { key: 'date', label: 'Date', render: (v) => v ? new Date(v).toLocaleString() : '—' },
  ]

  const handleRowClick = (row) => {
    if (!row.ref) return
    if (row.type === 'receipt') navigate(`/receipts`)
    else if (row.type === 'delivery') navigate(`/deliveries`)
    else if (row.type === 'transfer') navigate(`/transfers`)
    else if (row.type === 'adjustment') navigate(`/adjustments`)
  }

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-gray-900">Move History</h2>
          <p className="text-sm text-gray-500">{history.length} records</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ref or product…"
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-2 transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            <Filter size={15} /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">All Types</option>
              <option value="receipt">Receipt</option>
              <option value="delivery">Delivery</option>
              <option value="transfer">Transfer</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
          {(typeFilter) && (
            <button onClick={() => setTypeFilter('')} className="mt-4 text-sm text-red-500 hover:text-red-700">Clear</button>
          )}
        </div>
      )}

      <DataTable
        columns={columns}
        data={history}
        loading={loading}
        onRowClick={handleRowClick}
        emptyMessage="No move history records found"
      />
    </div>
  )
}
