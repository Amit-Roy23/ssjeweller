'use client'

import { create } from 'zustand'
import type { User } from './types'

export type ViewKey =
  | 'dashboard'
  | 'workflow'
  | 'gold'
  | 'stones'
  | 'products'
  | 'purchase'
  | 'sales'
  | 'customers'
  | 'suppliers'
  | 'reports'
  | 'users'
  | 'audit'
  | 'settings'

interface UIStoreState {
  // Auth state from /api/auth/me
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // Navigation & View state
  activeView: ViewKey
  setActiveView: (view: ViewKey) => void

  // Sidebar & Layout state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Global Dialog states
  newSaleDialogOpen: boolean
  setNewSaleDialogOpen: (open: boolean) => void

  newCustomerDialogOpen: boolean
  setNewCustomerDialogOpen: (open: boolean) => void

  newPurchaseDialogOpen: boolean
  setNewPurchaseDialogOpen: (open: boolean) => void

  newWorkOrderDialogOpen: boolean
  setNewWorkOrderDialogOpen: (open: boolean) => void

  // Logout UI action
  logout: () => void
}

export const useJewelleryStore = create<UIStoreState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  newSaleDialogOpen: false,
  setNewSaleDialogOpen: (open) => set({ newSaleDialogOpen: open }),

  newCustomerDialogOpen: false,
  setNewCustomerDialogOpen: (open) => set({ newCustomerDialogOpen: open }),

  newPurchaseDialogOpen: false,
  setNewPurchaseDialogOpen: (open) => set({ newPurchaseDialogOpen: open }),

  newWorkOrderDialogOpen: false,
  setNewWorkOrderDialogOpen: (open) => set({ newWorkOrderDialogOpen: open }),

  logout: () => set({ currentUser: null }),
}))

// ===== Formatting & Display Helpers =====
export const formatCurrency = (n: number, currency = '₹') => {
  if (!Number.isFinite(n)) return `${currency}0.00`
  const fixed = Math.round(n * 100) / 100
  const [whole, frac] = fixed.toFixed(2).split('.')
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${currency}${withCommas}.${frac}`
}

export const formatCompact = (n: number, currency = '₹') => {
  if (!Number.isFinite(n)) return `${currency}0`
  if (n >= 10000000) return `${currency}${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000) return `${currency}${(n / 100000).toFixed(2)}L`
  if (n >= 1000) return `${currency}${(n / 1000).toFixed(1)}k`
  return `${currency}${n.toFixed(0)}`
}

export const formatDate = (iso: string | Date | null | undefined) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(iso)
  }
}

export const formatDateTime = (iso: string | Date | null | undefined) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(iso)
  }
}

export const formatTime = (iso: string | Date | null | undefined) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return String(iso)
  }
}

export const relativeTime = (iso: string | Date | null | undefined) => {
  if (!iso) return '—'
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const d = Math.floor(hrs / 24)
    if (d < 30) return `${d}d ago`
    const mo = Math.floor(d / 30)
    if (mo < 12) return `${mo}mo ago`
    return `${Math.floor(mo / 12)}y ago`
  } catch {
    return String(iso)
  }
}

export const isOverdue = (dueDate: string | Date | null | undefined, status?: string) => {
  if (!dueDate) return false
  if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'APPROVED') return false
  return new Date(dueDate).getTime() < Date.now()
}
