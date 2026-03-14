import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, List, LayoutGrid, Search } from 'lucide-react'
import API from '../api/client'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'

const STATUS_PILLS = ['all', 'draft', 'ready', 'done', 'cancelled']

export default function Receipts() {
  const navigate = useNavigate()
  const { toasts, toast, removeToast } = useToast()
  const [receipts, setReceipts] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchReceipts() }, [statusFilter])

  const fetchReceipts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await API.get('/api/receipts?' + params.toString())
      setReceipts(res.data)
    } catch { toast.error('Failed to load receipts') } finally { setLoading(false) }
  }

  const filtered = receipts.filter(r =>
    !search || r.ref?.toLowerCase().includes(search.toLowerCase()) || r.supplier?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: '#', label: '#', render: (_, __, i) => <span className="text-gray-400">{i + 1}</span> },
    { key: 'ref', label: 'Reference', render: (v) => <span className="font-medium text-indigo-600">{v}</span> },
    { key: 'location_name', label: 'To (Location)' },
    { key: 'warehouse_name', label: 'Warehouse' },
    { key: 'supplier', label: 'Contact (Supplier)' },
    { key: 'schedule_date', label: 'Schedule Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'lines_count', label: 'Lines' },
  ]

  const kanbanCols = ['draft', 'ready', 'done', 'cancelled']
  const kanbanColors = { draft: 'bg-gray-100 text-gray-700', ready: 'bg-amber-100 text-amber-700', done: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600' }

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-gray-900">Receipts</h2>
          <p className="text-sm text-gray-500">{receipts.length} total receipts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button onClick={() => setView('list')} className={`px-3 py-2 ${view === 'list' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-50'}`}><List size={16} /></button>
            <button onClick={() => setView('kanban')} className={`px-3 py-2 ${view === 'kanban' ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutGrid size={16} /></button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40" />
          </div>
          <button onClick={() => navigate('/receipts/new')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2">
        {STATUS_PILLS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-indigo-500 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {view === 'list' ? (
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          onRowClick={(row) => navigate(`/receipts/${row.id}`)}
          emptyMessage="No receipts found"
        />
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {kanbanCols.map(col => (
            <div key={col} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${kanbanColors[col]}`}>
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                </span>
                <span className="text-xs text-gray-400">{filtered.filter(r => r.status === col).length}</span>
              </div>
              <div className="space-y-2">
                {filtered.filter(r => r.status === col).map(r => (
                  <div key={r.id} onClick={() => navigate(`/receipts/${r.id}`)}
                    className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-sm transition-shadow">
                    <p className="text-xs font-semibold text-indigo-600">{r.ref}</p>
                    <p className="text-xs text-gray-600 mt-1 truncate">{r.supplier || 'No supplier'}</p>
                    {r.schedule_date && <p className="text-xs text-gray-400 mt-1">{new Date(r.schedule_date).toLocaleDateString()}</p>}
                    <p className="text-xs text-gray-400 mt-1">{r.location_name} · {r.lines_count} lines</p>
                  </div>
                ))}
                {filtered.filter(r => r.status === col).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No receipts</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
