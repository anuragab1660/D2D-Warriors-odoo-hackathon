import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Categories from './pages/Categories'
import Receipts from './pages/Receipts'
import ReceiptDetail from './pages/ReceiptDetail'
import Deliveries from './pages/Deliveries'
import DeliveryDetail from './pages/DeliveryDetail'
import Transfers from './pages/Transfers'
import TransferDetail from './pages/TransferDetail'
import Adjustments from './pages/Adjustments'
import AdjustmentDetail from './pages/AdjustmentDetail'
import MoveHistory from './pages/MoveHistory'
import Settings from './pages/Settings'
import MyProfile from './pages/MyProfile'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('ci_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

function ManagerRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('ci_user') || '{}')
  if (user?.role !== 'manager') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/receipts" element={<Receipts />} />
        <Route path="/receipts/:id" element={<ReceiptDetail />} />
        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/deliveries/:id" element={<DeliveryDetail />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/transfers/:id" element={<TransferDetail />} />
        <Route path="/adjustments" element={<Adjustments />} />
        <Route path="/adjustments/:id" element={<AdjustmentDetail />} />
        <Route path="/move-history" element={<MoveHistory />} />
        <Route path="/settings" element={<ManagerRoute><Settings /></ManagerRoute>} />
        <Route path="/profile" element={<MyProfile />} />
      </Route>
    </Routes>
  )
}
