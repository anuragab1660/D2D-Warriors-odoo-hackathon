import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, AlertTriangle, PackageCheck, Truck, ArrowLeftRight } from 'lucide-react'
import API from '../api/client'
import KPICard from '../components/KPICard'
import StatusBadge from '../components/StatusBadge'
import DataTable from '../components/DataTable'
import Spinner from '../components/Spinner'
import useToast from '../hooks/useToast'
import Toast from '../components/Toast'

export default function Dashboard() {
  const navigate = useNavigate()
  const { toasts, toast, removeToast } = useToast()
  const [data, setData] = useState(null)
  const [filterData, setFilterData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)
  const [warehouses, setWarehouses] = useState([])
  const [categories, setCategories] = useState([])

  const [filters, setFilters] = useState({
    doc_type: '', status: '', warehouse_id: '', category_id: ''
  })

  useEffect(() => {
    fetchDashboard()
    fetchMeta()
  }, [])

  useEffect(() => {
    fetchFilterData()
  }, [filters])

  const fetchDashboard = async () => {
    try {
      const res = await API.get('/api/dashboard')
      setData(res.data)
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchMeta = async () => {
    try {
      const [wRes, cRes] = await Promise.all([
        API.get('/api/warehouses'),
        API.get('/api/categories')
      ])
      setWarehouses(wRes.data)
      setCategories(cRes.data)
    } catch {}
  }

  const fetchFilterData = async () => {
    setFilterLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await API.get('/api/dashboard/filter?' + params.toString())
      setFilterData(res.data)
    } catch {} finally {
      setFilterLoading(false)
    }
  }

  const hasFilters = Object.values(filters).some(v => v)

  const handleRowClick = (row) => {
    const typeMap = { receipts: '/receipts', deliveries: '/deliveries', transfers: '/transfers', adjustments: '/adjustments' }
    const base = typeMap[row.doc_type]
    if (base) navigate(`${base}/${row.id}`)
  }

  const operationsColumns = [
    { key: 'ref', label: 'Reference' },
    { key: 'doc_type', label: 'Type', render: (v) => <StatusBadge status={v} /> },
    { key: 'party', label: 'Party' },
    { key: 'location', label: 'Location' },
    { key: 'warehouse', label: 'Warehouse' },
    { key: 'date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'lines_count', label: 'Lines' },
  ]

  const lowStockColumns = [
    { key: 'name', label: 'Product', render: (v, row) => (
      <div>
        <p className="font-medium text-gray-800">{v}</p>
        <p className="text-xs text-gray-400">{row.sku}</p>
      </div>
    )},
    { key: 'on_hand', label: 'On Hand', render: (v) => <span className="font-bold text-red-600">{v}</span> },
    { key: 'reorder_qty', label: 'Reorder Qty' },
    { key: 'status', label: 'Status', render: (_, row) => <StatusBadge status="LOW" /> },
  ]

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const rd = data?.receiptBreakdown || {}
  const dd = data?.deliveryBreakdown || {}
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard title="Total Products" value={data?.totalProducts} icon={Package} iconBg="bg-indigo-100 text-indigo-500" />
        <KPICard title="Low Stock Items" value={data?.lowStockCount} icon={AlertTriangle} iconBg="bg-red-100 text-red-500" />
        <KPICard
          title="Pending Receipts"
          value={data?.pendingReceipts}
          icon={PackageCheck}
          iconBg="bg-amber-100 text-amber-500"
          subtitle={`${rd.late || 0} late · ${rd.waiting || 0} waiting · ${rd.operations || 0} upcoming`}
        />
        <KPICard
          title="Pending Deliveries"
          value={data?.pendingDeliveries}
          icon={Truck}
          iconBg="bg-blue-100 text-blue-500"
          subtitle={`${dd.late || 0} late · ${dd.waiting || 0} waiting · ${dd.operations || 0} upcoming`}
        />
        <KPICard title="Pending Transfers" value={data?.pendingTransfers} icon={ArrowLeftRight} iconBg="bg-purple-100 text-purple-500" />
      </div>

      {/* Receipt + Delivery Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Receipt Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-gray-900">Receipt</h3>
            <button onClick={() => navigate('/receipts')} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">View all →</button>
          </div>
          <p className="text-4xl font-bold font-heading text-gray-900 mb-4">{rd.toReceive || 0}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" /><span className="text-sm text-gray-600">{rd.late || 0} Late</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" /><span className="text-sm text-gray-600">{rd.waiting || 0} Waiting</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" /><span className="text-sm text-gray-600">{rd.operations || 0} Operations (upcoming)</span></div>
            <div className="border-t border-gray-100 pt-2 mt-2">
              <span className="text-sm font-medium text-gray-700">{rd.toReceive || 0} to receive</span>
            </div>
          </div>
        </div>

        {/* Delivery Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-gray-900">Delivery</h3>
            <button onClick={() => navigate('/deliveries')} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">View all →</button>
          </div>
          <p className="text-4xl font-bold font-heading text-gray-900 mb-4">{dd.toDeliver || 0}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" /><span className="text-sm text-gray-600">{dd.late || 0} Late</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" /><span className="text-sm text-gray-600">{dd.waiting || 0} Waiting</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" /><span className="text-sm text-gray-600">{dd.operations || 0} Operations (upcoming)</span></div>
            <div className="border-t border-gray-100 pt-2 mt-2">
              <span className="text-sm font-medium text-gray-700">{dd.toDeliver || 0} to deliver</span>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock */}
      <div>
        <h3 className="font-heading font-semibold text-gray-900 mb-3">Low Stock Alerts</h3>
        <DataTable
          columns={lowStockColumns}
          data={data?.lowStockProducts || []}
          onRowClick={(row) => navigate(`/products/${row.id}`)}
          emptyMessage="All products are well stocked"
        />
      </div>

      {/* Operations Filter */}
      <div>
        <h3 className="font-heading font-semibold text-gray-900 mb-3">Operations</h3>
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap items-center gap-3">
          <select
            value={filters.doc_type}
            onChange={e => setFilters(p => ({ ...p, doc_type: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Document Types</option>
            <option value="receipts">Receipts</option>
            <option value="deliveries">Deliveries</option>
            <option value="transfers">Transfers</option>
            <option value="adjustments">Adjustments</option>
          </select>
          <select
            value={filters.status}
            onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {['draft','waiting','ready','done','cancelled'].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select
            value={filters.warehouse_id}
            onChange={e => setFilters(p => ({ ...p, warehouse_id: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <select
            value={filters.category_id}
            onChange={e => setFilters(p => ({ ...p, category_id: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {hasFilters && (
            <button
              onClick={() => setFilters({ doc_type: '', status: '', warehouse_id: '', category_id: '' })}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Clear Filters
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">Showing {filterData.length} results</span>
        </div>
        <DataTable
          columns={operationsColumns}
          data={filterData}
          loading={filterLoading}
          onRowClick={handleRowClick}
          emptyMessage="No operations match the selected filters"
        />
      </div>
    </div>
  )
}
