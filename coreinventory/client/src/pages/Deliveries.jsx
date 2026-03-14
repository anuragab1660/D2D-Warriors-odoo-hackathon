import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, List, LayoutGrid, Search } from 'lucide-react'
import API from '../api/client'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'

const STATUS_PILLS = ['all', 'draft', 'waiting', 'ready', 'done', 'cancelled']

export default function Deliveries() {
  const navigate = useNavigate()
  const { toasts, toast, removeToast } = useToast()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchDeliveries() }, [statusFilter])

  const fetchDeliveries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await API.get('/api/deliveries?' + params.toString())
      setDeliveries(res.data)
    } catch { toast.error('Failed to load deliveries') } finally { setLoading(false) }
  }

  const filtered = deliveries.filter(d =>
    !search || d.ref?.toLowerCase().includes(search.toLowerCase()) || d.destination?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: '#', label: '#', render: (_, __, i) => <span className="text-gray-400">{i + 1}</span> },
    { key: 'ref', label: 'Reference', render: (v) => <span className="font-medium text-indigo-600">{v}</span> },
    { key: 'location_name', label: 'From (Location)' },
    { key: 'destination', label: 'To (Destination)' },
    { key: 'destination', label: 'Contact', render: (v) => v || '—' },
    { key: 'schedule_date', label: 'Schedule Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'lines_count', label: 'Lines' },
  ]

  const kanbanCols = ['draft', 'waiting', 'ready', 'done', 'cancelled']

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-gray-900">Delivery</h2>
          <p className="text-sm text-gray-500">{deliveries.length} total deliveries</p>
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
          <button onClick={() => navigate('/deliveries/new')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Plus size={16} /> New
          </button>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2 flex-wrap">
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
          onRowClick={(row) => navigate(`/deliveries/${row.id}`)}
          emptyMessage="No deliveries found"
        />
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {kanbanCols.map(col => (
            <div key={col} className={`rounded-xl p-3 ${col === 'waiting' ? 'bg-amber-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={col} />
                <span className="text-xs text-gray-400">{filtered.filter(d => d.status === col).length}</span>
              </div>
              <div className="space-y-2">
                {filtered.filter(d => d.status === col).map(d => (
                  <div key={d.id} onClick={() => navigate(`/deliveries/${d.id}`)}
                    className={`bg-white rounded-lg border p-3 cursor-pointer hover:shadow-sm transition-shadow ${col === 'waiting' ? 'border-amber-200' : 'border-gray-200'}`}>
                    <p className="text-xs font-semibold text-indigo-600">{d.ref}</p>
                    <p className="text-xs text-gray-600 mt-1 truncate">{d.destination || 'No destination'}</p>
                    {d.schedule_date && <p className="text-xs text-gray-400 mt-1">{new Date(d.schedule_date).toLocaleDateString()}</p>}
                    <p className="text-xs text-gray-400 mt-1">{d.lines_count} lines</p>
                  </div>
                ))}
                {filtered.filter(d => d.status === col).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">No deliveries</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
