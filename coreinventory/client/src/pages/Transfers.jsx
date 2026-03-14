import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import API from '../api/client'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'

export default function Transfers() {
  const navigate = useNavigate()
  const { toasts, toast, removeToast } = useToast()
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTransfers() }, [])

  const fetchTransfers = async () => {
    try {
      const res = await API.get('/api/transfers')
      setTransfers(res.data)
    } catch { toast.error('Failed to load transfers') } finally { setLoading(false) }
  }

  const columns = [
    { key: '#', label: '#', render: (_, __, i) => <span className="text-gray-400">{i + 1}</span> },
    { key: 'ref', label: 'Reference', render: (v) => <span className="font-medium text-indigo-600">{v}</span> },
    { key: 'from_location_name', label: 'From Location', render: (v, row) => <span>{v} <span className="text-xs text-gray-400">({row.from_warehouse_name})</span></span> },
    { key: 'to_location_name', label: 'To Location', render: (v, row) => <span>{v} <span className="text-xs text-gray-400">({row.to_warehouse_name})</span></span> },
    { key: 'date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'lines_count', label: 'Lines' },
  ]

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-gray-900">Transfers</h2>
          <p className="text-sm text-gray-500">{transfers.length} total transfers</p>
        </div>
        <button onClick={() => navigate('/transfers/new')}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus size={16} /> New
        </button>
      </div>

      <DataTable
        columns={columns}
        data={transfers}
        loading={loading}
        onRowClick={(row) => navigate(`/transfers/${row.id}`)}
        emptyMessage="No transfers found"
      />
    </div>
  )
}
