import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import API from '../api/client'
import DataTable from '../components/DataTable'
import StatusBadge from '../components/StatusBadge'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'

export default function Adjustments() {
  const navigate = useNavigate()
  const { toasts, toast, removeToast } = useToast()
  const [adjustments, setAdjustments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAdjustments() }, [])

  const fetchAdjustments = async () => {
    try {
      const res = await API.get('/api/adjustments')
      setAdjustments(res.data)
    } catch { toast.error('Failed to load adjustments') } finally { setLoading(false) }
  }

  const columns = [
    { key: '#', label: '#', render: (_, __, i) => <span className="text-gray-400">{i + 1}</span> },
    { key: 'ref', label: 'Reference', render: (v) => <span className="font-medium text-indigo-600">{v}</span> },
    { key: 'location_name', label: 'Location' },
    { key: 'warehouse_name', label: 'Warehouse' },
    { key: 'date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'lines_count', label: 'Lines' },
  ]

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-gray-900">Adjustments</h2>
          <p className="text-sm text-gray-500">{adjustments.length} total adjustments</p>
        </div>
        <button onClick={() => navigate('/adjustments/new')}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus size={16} /> New
        </button>
      </div>

      <DataTable
        columns={columns}
        data={adjustments}
        loading={loading}
        onRowClick={(row) => navigate(`/adjustments/${row.id}`)}
        emptyMessage="No adjustments found"
      />
    </div>
  )
}
