import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import API from '../api/client'
import ConfirmDialog from '../components/ConfirmDialog'
import Toast from '../components/Toast'
import useToast from '../hooks/useToast'
import Spinner from '../components/Spinner'

export default function Categories() {
  const { toasts, toast, removeToast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    try {
      const res = await API.get('/api/categories')
      setCategories(res.data)
    } catch { toast.error('Failed to load categories') } finally { setLoading(false) }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await API.post('/api/categories', { name: newName.trim() })
      toast.success('Category created')
      setNewName('')
      fetchCategories()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create') } finally { setAdding(false) }
  }

  const handleEdit = async (id) => {
    if (!editName.trim()) return
    try {
      await API.put(`/api/categories/${id}`, { name: editName.trim() })
      toast.success('Category updated')
      setEditId(null)
      fetchCategories()
    } catch (err) { toast.error(err.response?.data?.error || 'Update failed') }
  }

  const handleDelete = async () => {
    try {
      await API.delete(`/api/categories/${deleteId}`)
      toast.success('Category deleted')
      setDeleteId(null)
      fetchCategories()
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed') }
  }

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={removeToast} />
      <ConfirmDialog
        isOpen={!!deleteId}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl text-gray-900">Categories</h2>
          <p className="text-sm text-gray-500">Manage product categories</p>
        </div>
      </div>

      {/* Add form */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <form onSubmit={handleAdd} className="flex items-center gap-3">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New category name…"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" disabled={adding || !newName.trim()}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Plus size={15} /> Add Category
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8 text-gray-400 text-sm">No categories yet</td></tr>
              ) : categories.map((cat, i) => (
                <tr key={cat.id} className="text-sm hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    {editId === cat.id ? (
                      <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') setEditId(null) }}
                        className="border border-indigo-400 rounded px-2 py-1 text-sm focus:outline-none w-48" />
                    ) : (
                      <span className="font-medium text-gray-800">{cat.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {editId === cat.id ? (
                        <>
                          <button onClick={() => handleEdit(cat.id)} className="text-green-500 hover:text-green-700"><Check size={16} /></button>
                          <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditId(cat.id); setEditName(cat.name) }} className="text-gray-400 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>
                          <button onClick={() => setDeleteId(cat.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
