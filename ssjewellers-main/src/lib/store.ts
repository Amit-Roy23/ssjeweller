'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  User, GoldStock, StockMovement, StockAdjustment, WastageRecord, StoneItem, Product,
  Supplier, Purchase, Customer, Sale, Payment, SalesReturn, OldGoldExchange,
  Workflow, WorkOrder, WorkStatus, WorkStatusValue, QualityCheck, AuditLog, AppNotification,
  ShopSettings, Purity, Category, WorkPriority,
} from './types'
import {
  DEFAULT_SETTINGS, SEED_USERS, SEED_GOLD_STOCK, SEED_STONES, SEED_PRODUCTS,
  SEED_SUPPLIERS, SEED_PURCHASES, SEED_CUSTOMERS, SEED_SALES, SEED_PAYMENTS,
  SEED_RETURNS, SEED_EXCHANGES, SEED_WORKFLOWS, SEED_WORK_ORDERS, SEED_WASTAGE,
  SEED_QCS, SEED_AUDIT_LOGS, SEED_NOTIFICATIONS,
} from './seed-data'
import { DEFAULT_STATUSES, DEFAULT_PURITIES, DEFAULT_CATEGORIES } from './types'

const genId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

interface JewelleryState {
  // auth
  currentUser: User | null
  // collections
  users: User[]
  goldStock: GoldStock[]
  stockMovements: StockMovement[]
  stockAdjustments: StockAdjustment[]
  wastageRecords: WastageRecord[]
  stones: StoneItem[]
  products: Product[]
  suppliers: Supplier[]
  purchases: Purchase[]
  customers: Customer[]
  sales: Sale[]
  payments: Payment[]
  returns: SalesReturn[]
  exchanges: OldGoldExchange[]
  workflows: Workflow[]
  workOrders: WorkOrder[]
  workStatuses: WorkStatus[]
  qualityChecks: QualityCheck[]
  auditLogs: AuditLog[]
  notifications: AppNotification[]
  purities: Purity[]
  categories: Category[]
  settings: ShopSettings
  seeded: boolean

  // init
  hydrateSeed: () => void
  resetAll: () => void

  // auth
  login: (username: string, password: string) => User | null
  logout: () => void

  // audit
  logAction: (action: string, entity: string, entityId: string, details: string) => void

  // users
  addUser: (u: Omit<User, 'id' | 'createdAt'>) => User
  updateUser: (id: string, patch: Partial<User>) => void
  deleteUser: (id: string) => void

  // workflows
  addWorkflow: (w: Omit<Workflow, 'id' | 'createdAt'>) => Workflow
  updateWorkflow: (id: string, patch: Partial<Workflow>) => void
  deleteWorkflow: (id: string) => void

  // work orders
  addWorkOrder: (w: Omit<WorkOrder, 'id' | 'workId' | 'createdAt' | 'updatedAt' | 'history'>) => WorkOrder
  updateWorkOrder: (id: string, patch: Partial<WorkOrder>) => void
  updateWorkStep: (workOrderId: string, stepIndex: number, patch: Partial<WorkOrder['steps'][0]>) => void
  addWorkHistory: (workOrderId: string, entry: { userName: string; action: string; details?: string }) => void
  deleteWorkOrder: (id: string) => void

  // work statuses
  addWorkStatus: (s: Omit<WorkStatus, 'id'>) => void
  updateWorkStatus: (id: string, patch: Partial<WorkStatus>) => void
  deleteWorkStatus: (id: string) => void

  // gold stock
  addGoldStock: (g: Omit<GoldStock, 'id' | 'createdAt'>) => GoldStock
  updateGoldStock: (id: string, patch: Partial<GoldStock>) => void
  deleteGoldStock: (id: string) => void
  addStockMovement: (m: Omit<StockMovement, 'id' | 'timestamp'>) => void
  addStockAdjustment: (a: Omit<StockAdjustment, 'id' | 'timestamp'>) => void
  addWastageRecord: (w: Omit<WastageRecord, 'id'>) => void

  // stones
  addStone: (s: Omit<StoneItem, 'id' | 'createdAt' | 'remainingQuantity'>) => StoneItem
  updateStone: (id: string, patch: Partial<StoneItem>) => void
  deleteStone: (id: string) => void

  // products
  addProduct: (p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product
  updateProduct: (id: string, patch: Partial<Product>) => void
  deleteProduct: (id: string) => void
  decrementProductStock: (id: string, qty: number) => void

  // suppliers
  addSupplier: (s: Omit<Supplier, 'id' | 'createdAt' | 'totalPurchase' | 'totalPaid'>) => Supplier
  updateSupplier: (id: string, patch: Partial<Supplier>) => void
  deleteSupplier: (id: string) => void

  // purchases
  addPurchase: (p: Omit<Purchase, 'id' | 'purchaseId' | 'createdAt'>) => Purchase
  updatePurchase: (id: string, patch: Partial<Purchase>) => void
  deletePurchase: (id: string) => void

  // customers
  setCustomers: (customers: Customer[]) => void
  addCustomer: (c: Omit<Customer, 'id' | 'customerId' | 'createdAt' | 'totalPurchase' | 'totalPaid' | 'totalDue' | 'totalBills'>) => Customer
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  deleteCustomer: (id: string) => void

  // sales
  addSale: (s: Omit<Sale, 'id' | 'invoiceNo' | 'createdAt'>) => Sale
  updateSale: (id: string, patch: Partial<Sale>) => void
  deleteSale: (id: string) => void

  // payments
  addPayment: (p: Omit<Payment, 'id' | 'paymentId' | 'createdAt'>) => Payment
  deletePayment: (id: string) => void

  // returns
  addReturn: (r: Omit<SalesReturn, 'id' | 'returnId' | 'createdAt'>) => SalesReturn
  deleteReturn: (id: string) => void

  // exchanges
  addExchange: (e: Omit<OldGoldExchange, 'id' | 'voucherNo' | 'createdAt'>) => OldGoldExchange
  updateExchange: (id: string, patch: Partial<OldGoldExchange>) => void
  deleteExchange: (id: string) => void

  // quality checks
  addQualityCheck: (q: Omit<QualityCheck, 'id'>) => QualityCheck

  // notifications
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (forUserId?: string) => void

  // purities
  addPurity: (p: Omit<Purity, 'id'>) => void
  updatePurity: (id: string, patch: Partial<Purity>) => void
  deletePurity: (id: string) => void

  // categories
  addCategory: (c: Omit<Category, 'id'>) => void
  updateCategory: (id: string, patch: Partial<Category>) => void
  deleteCategory: (id: string) => void

  // settings
  updateSettings: (patch: Partial<ShopSettings>) => void
}

export const useJewelleryStore = create<JewelleryState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      goldStock: [],
      stockMovements: [],
      stockAdjustments: [],
      wastageRecords: [],
      stones: [],
      products: [],
      suppliers: [],
      purchases: [],
      customers: [],
      sales: [],
      payments: [],
      returns: [],
      exchanges: [],
      workflows: [],
      workOrders: [],
      workStatuses: [],
      qualityChecks: [],
      auditLogs: [],
      notifications: [],
      purities: [],
      categories: [],
      settings: DEFAULT_SETTINGS,
      seeded: false,

      hydrateSeed: () => {
        if (get().seeded) return
        set({
          users: SEED_USERS,
          goldStock: SEED_GOLD_STOCK,
          stones: SEED_STONES,
          products: SEED_PRODUCTS,
          suppliers: SEED_SUPPLIERS,
          purchases: SEED_PURCHASES,
          customers: SEED_CUSTOMERS,
          sales: SEED_SALES,
          payments: SEED_PAYMENTS,
          returns: SEED_RETURNS,
          exchanges: SEED_EXCHANGES,
          workflows: SEED_WORKFLOWS,
          workOrders: SEED_WORK_ORDERS,
          wastageRecords: SEED_WASTAGE,
          qualityChecks: SEED_QCS,
          auditLogs: SEED_AUDIT_LOGS,
          notifications: SEED_NOTIFICATIONS,
          workStatuses: DEFAULT_STATUSES,
          purities: DEFAULT_PURITIES,
          categories: DEFAULT_CATEGORIES,
          settings: DEFAULT_SETTINGS,
          seeded: true,
        })
      },

      resetAll: () => {
        set({
          users: SEED_USERS,
          goldStock: SEED_GOLD_STOCK,
          stones: SEED_STONES,
          products: SEED_PRODUCTS,
          suppliers: SEED_SUPPLIERS,
          purchases: SEED_PURCHASES,
          customers: SEED_CUSTOMERS,
          sales: SEED_SALES,
          payments: SEED_PAYMENTS,
          returns: SEED_RETURNS,
          exchanges: SEED_EXCHANGES,
          workflows: SEED_WORKFLOWS,
          workOrders: SEED_WORK_ORDERS,
          wastageRecords: SEED_WASTAGE,
          qualityChecks: SEED_QCS,
          auditLogs: SEED_AUDIT_LOGS,
          notifications: SEED_NOTIFICATIONS,
          workStatuses: DEFAULT_STATUSES,
          purities: DEFAULT_PURITIES,
          categories: DEFAULT_CATEGORIES,
          settings: DEFAULT_SETTINGS,
          currentUser: null,
          seeded: true,
        })
      },

      login: (username, password) => {
        const user = get().users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password && u.active,
        )
        if (user) {
          const updated = { ...user, lastLogin: new Date().toISOString() }
          set((s) => ({
            users: s.users.map((u) => (u.id === user.id ? updated : u)),
            currentUser: updated,
          }))
          get().logAction('LOGIN', 'User', user.id, `${user.name} logged in`)
          return updated
        }
        return null
      },

      logout: () => {
        const u = get().currentUser
        if (u) get().logAction('LOGOUT', 'User', u.id, `${u.name} logged out`)
        set({ currentUser: null })
      },

      logAction: (action, entity, entityId, details) => {
        const user = get().currentUser
        const entry: AuditLog = {
          id: genId('al'),
          timestamp: new Date().toISOString(),
          userName: user?.name ?? 'System',
          action,
          entity,
          entityId,
          details,
        }
        set((s) => ({ auditLogs: [entry, ...s.auditLogs] }))
      },

      addUser: (u) => {
        const newUser: User = { ...u, id: genId('usr'), createdAt: new Date().toISOString() }
        set((s) => ({ users: [...s.users, newUser] }))
        get().logAction('CREATE_USER', 'User', newUser.id, `Created user ${newUser.name} (${newUser.role})`)
        return newUser
      },
      updateUser: (id, patch) => {
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }))
        get().logAction('UPDATE_USER', 'User', id, `Updated user`)
      },
      deleteUser: (id) => {
        set((s) => ({ users: s.users.filter((u) => u.id !== id) }))
        get().logAction('DELETE_USER', 'User', id, `Deleted user`)
      },

      addWorkflow: (w) => {
        const newW: Workflow = { ...w, id: genId('wf'), createdAt: new Date().toISOString() }
        set((s) => ({ workflows: [...s.workflows, newW] }))
        get().logAction('CREATE_WORKFLOW', 'Workflow', newW.id, `Created workflow ${newW.name}`)
        return newW
      },
      updateWorkflow: (id, patch) => {
        set((s) => ({ workflows: s.workflows.map((w) => (w.id === id ? { ...w, ...patch } : w)) }))
        get().logAction('UPDATE_WORKFLOW', 'Workflow', id, `Updated workflow`)
      },
      deleteWorkflow: (id) => {
        set((s) => ({ workflows: s.workflows.filter((w) => w.id !== id) }))
        get().logAction('DELETE_WORKFLOW', 'Workflow', id, `Deleted workflow`)
      },

      addWorkOrder: (w) => {
        const seq = get().settings.workOrderSeq
        const workId = `${get().settings.workOrderPrefix}-${seq}`
        const nowIso = new Date().toISOString()
        const newW: WorkOrder = {
          ...w,
          id: genId('wo'),
          workId,
          history: [{ id: genId('h'), timestamp: nowIso, userName: get().currentUser?.name ?? 'System', action: 'Created work order', details: `${workId} created for ${w.productName}` }],
          createdAt: nowIso,
          updatedAt: nowIso,
        }
        set((s) => ({
          workOrders: [newW, ...s.workOrders],
          settings: { ...s.settings, workOrderSeq: seq + 1 },
        }))
        get().logAction('CREATE_WORK_ORDER', 'WorkOrder', workId, `Created work order ${workId} for ${w.productName}`)
        return newW
      },
      updateWorkOrder: (id, patch) => {
        set((s) => ({
          workOrders: s.workOrders.map((w) =>
            w.id === id ? { ...w, ...patch, updatedAt: new Date().toISOString() } : w,
          ),
        }))
      },
      updateWorkStep: (workOrderId, stepIndex, patch) => {
        set((s) => ({
          workOrders: s.workOrders.map((w) => {
            if (w.id !== workOrderId) return w
            const steps = w.steps.map((st, i) => (i === stepIndex ? { ...st, ...patch } : st))
            return { ...w, steps, updatedAt: new Date().toISOString() }
          }),
        }))
      },
      addWorkHistory: (workOrderId, entry) => {
        const e = { id: genId('h'), timestamp: new Date().toISOString(), ...entry }
        set((s) => ({
          workOrders: s.workOrders.map((w) =>
            w.id === workOrderId ? { ...w, history: [...w.history, e], updatedAt: new Date().toISOString() } : w,
          ),
        }))
      },
      deleteWorkOrder: (id) => {
        set((s) => ({ workOrders: s.workOrders.filter((w) => w.id !== id) }))
        get().logAction('DELETE_WORK_ORDER', 'WorkOrder', id, `Deleted work order`)
      },

      addWorkStatus: (st) => {
        set((s) => ({ workStatuses: [...s.workStatuses, { ...st, id: genId('st') }] }))
      },
      updateWorkStatus: (id, patch) => {
        set((s) => ({ workStatuses: s.workStatuses.map((st) => (st.id === id ? { ...st, ...patch } : st)) }))
      },
      deleteWorkStatus: (id) => {
        set((s) => ({ workStatuses: s.workStatuses.filter((st) => st.id !== id) }))
      },

      addGoldStock: (g) => {
        const newG: GoldStock = { ...g, id: genId('gs'), createdAt: new Date().toISOString() }
        set((s) => ({ goldStock: [newG, ...s.goldStock] }))
        get().logAction('CREATE_GOLD_STOCK', 'GoldStock', newG.stockId, `Added gold stock ${newG.stockId} (${newG.grossWeight}g ${newG.purity})`)
        return newG
      },
      updateGoldStock: (id, patch) => {
        set((s) => ({ goldStock: s.goldStock.map((g) => (g.id === id ? { ...g, ...patch } : g)) }))
      },
      deleteGoldStock: (id) => {
        set((s) => ({ goldStock: s.goldStock.filter((g) => g.id !== id) }))
      },
      addStockMovement: (m) => {
        const newM: StockMovement = { ...m, id: genId('sm'), timestamp: new Date().toISOString() }
        set((s) => ({ stockMovements: [newM, ...s.stockMovements] }))
      },
      addStockAdjustment: (a) => {
        const newA: StockAdjustment = { ...a, id: genId('sa'), timestamp: new Date().toISOString() }
        set((s) => ({ stockAdjustments: [newA, ...s.stockAdjustments] }))
        get().logAction('STOCK_ADJUSTMENT', a.itemType, a.itemId, `Adjusted ${a.itemName}: ${a.adjustmentType} ${a.weight ?? a.quantity} (${a.reason})`)
      },
      addWastageRecord: (w) => {
        const newW: WastageRecord = { ...w, id: genId('wst') }
        set((s) => ({ wastageRecords: [newW, ...s.wastageRecords] }))
      },

      addStone: (st) => {
        const newS: StoneItem = { ...st, id: genId('st'), remainingQuantity: st.quantity - st.usedQuantity, createdAt: new Date().toISOString() }
        set((s) => ({ stones: [newS, ...s.stones] }))
        return newS
      },
      updateStone: (id, patch) => {
        set((s) => ({
          stones: s.stones.map((st) => (st.id === id ? { ...st, ...patch, remainingQuantity: (patch.quantity ?? st.quantity) - (patch.usedQuantity ?? st.usedQuantity) } : st)),
        }))
      },
      deleteStone: (id) => set((s) => ({ stones: s.stones.filter((st) => st.id !== id) })),

      addProduct: (p) => {
        const nowIso = new Date().toISOString()
        const newP: Product = { ...p, id: genId('prd'), createdAt: nowIso, updatedAt: nowIso }
        set((s) => ({ products: [newP, ...s.products] }))
        get().logAction('CREATE_PRODUCT', 'Product', newP.productCode, `Added product ${newP.productCode} (${newP.name})`)
        return newP
      },
      updateProduct: (id, patch) => {
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)) }))
      },
      deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),
      decrementProductStock: (id, qty) => {
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock - qty) } : p)) }))
      },

      addSupplier: (sup) => {
        const newS: Supplier = { ...sup, id: genId('sup'), totalPurchase: 0, totalPaid: 0, createdAt: new Date().toISOString() }
        set((s) => ({ suppliers: [newS, ...s.suppliers] }))
        return newS
      },
      updateSupplier: (id, patch) => set((s) => ({ suppliers: s.suppliers.map((sup) => (sup.id === id ? { ...sup, ...patch } : sup)) })),
      deleteSupplier: (id) => set((s) => ({ suppliers: s.suppliers.filter((sup) => sup.id !== id) })),

      addPurchase: (p) => {
        const seq = get().settings.purchaseSeq
        const purchaseId = `${get().settings.purchasePrefix}-${String(seq).padStart(4, '0')}`
        const newP: Purchase = { ...p, id: genId('pur'), purchaseId, createdAt: new Date().toISOString() }
        set((s) => ({
          purchases: [newP, ...s.purchases],
          settings: { ...s.settings, purchaseSeq: seq + 1 },
          suppliers: s.suppliers.map((sup) => sup.id === p.supplierId ? { ...sup, totalPurchase: sup.totalPurchase + p.grandTotal, totalPaid: sup.totalPaid + p.paidAmount } : sup),
        }))
        get().logAction('CREATE_PURCHASE', 'Purchase', purchaseId, `Created purchase ${purchaseId} from ${p.supplierName} (₹${p.grandTotal})`)
        return newP
      },
      updatePurchase: (id, patch) => set((s) => ({ purchases: s.purchases.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deletePurchase: (id) => set((s) => ({ purchases: s.purchases.filter((p) => p.id !== id) })),

      setCustomers: (customers) => set({ customers }),
      addCustomer: (c) => {
        const seq = get().customers.length + 1
        const customerId = `CUST-${String(seq).padStart(3, '0')}`
        const newC: Customer = { ...c, id: genId('cus'), customerId, totalPurchase: 0, totalPaid: 0, totalDue: 0, totalBills: 0, createdAt: new Date().toISOString() }
        set((s) => ({ customers: [newC, ...s.customers] }))
        return newC
      },
      updateCustomer: (id, patch) => set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteCustomer: (id) => set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

      addSale: (sale) => {
        const seq = get().settings.invoiceSeq
        const invoiceNo = `${get().settings.invoicePrefix}-${String(seq).padStart(5, '0')}`
        const newS: Sale = { ...sale, id: genId('sale'), invoiceNo, createdAt: new Date().toISOString() }
        set((s) => ({
          sales: [newS, ...s.sales],
          settings: { ...s.settings, invoiceSeq: seq + 1 },
          customers: s.customers.map((c) => c.id === sale.customerId ? {
            ...c,
            totalPurchase: c.totalPurchase + sale.grandTotal,
            totalPaid: c.totalPaid + sale.paidAmount,
            totalDue: c.totalDue + sale.dueAmount,
            totalBills: c.totalBills + 1,
          } : c),
        }))
        // decrement product stock
        newS.items.forEach((it) => { if (it.productId) get().decrementProductStock(it.productId, it.quantity) })
        get().logAction('CREATE_SALE', 'Sale', invoiceNo, `Created invoice ${invoiceNo} for ${sale.customerName} (₹${sale.grandTotal})`)
        return newS
      },
      updateSale: (id, patch) => set((s) => ({ sales: s.sales.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl)) })),
      deleteSale: (id) => set((s) => ({ sales: s.sales.filter((sl) => sl.id !== id) })),

      addPayment: (p) => {
        const seq = get().payments.length + 1
        const paymentId = `PAY-2026-${String(seq).padStart(4, '0')}`
        const newP: Payment = { ...p, id: genId('pay'), paymentId, createdAt: new Date().toISOString() }
        set((s) => ({
          payments: [newP, ...s.payments],
          sales: s.sales.map((sl) => sl.id === p.saleId ? {
            ...sl,
            paidAmount: sl.paidAmount + p.amount,
            dueAmount: Math.max(0, sl.dueAmount - p.amount),
            status: sl.paidAmount + p.amount >= sl.grandTotal ? 'PAID' : 'PARTIAL',
          } : sl),
          customers: s.customers.map((c) => c.id === p.customerId ? { ...c, totalPaid: c.totalPaid + p.amount, totalDue: Math.max(0, c.totalDue - p.amount) } : c),
        }))
        get().logAction('CREATE_PAYMENT', 'Payment', paymentId, `Recorded payment ${paymentId} from ${p.customerName} (₹${p.amount})`)
        return newP
      },
      deletePayment: (id) => set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),

      addReturn: (r) => {
        const seq = get().returns.length + 1
        const returnId = `RET-2026-${String(seq).padStart(4, '0')}`
        const newR: SalesReturn = { ...r, id: genId('ret'), returnId, createdAt: new Date().toISOString() }
        set((s) => ({ returns: [newR, ...s.returns] }))
        get().logAction('CREATE_RETURN', 'SalesReturn', returnId, `Created return ${returnId} for ${r.customerName}`)
        return newR
      },
      deleteReturn: (id) => set((s) => ({ returns: s.returns.filter((r) => r.id !== id) })),

      addExchange: (e) => {
        const seq = get().exchanges.length + 11
        const voucherNo = `EX-2026-${String(seq).padStart(4, '0')}`
        const newE: OldGoldExchange = { ...e, id: genId('ex'), voucherNo, createdAt: new Date().toISOString() }
        set((s) => ({ exchanges: [newE, ...s.exchanges] }))
        return newE
      },
      updateExchange: (id, patch) => set((s) => ({ exchanges: s.exchanges.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteExchange: (id) => set((s) => ({ exchanges: s.exchanges.filter((e) => e.id !== id) })),

      addQualityCheck: (q) => {
        const newQ: QualityCheck = { ...q, id: genId('qc') }
        set((s) => ({ qualityChecks: [newQ, ...s.qualityChecks] }))
        get().logAction(q.result === 'APPROVED' ? 'QC_APPROVED' : 'QC_REJECTED', 'QualityCheck', q.workId, `QC ${q.result.toLowerCase()} for ${q.workId}`)
        return newQ
      },

      addNotification: (n) => {
        const newN: AppNotification = { ...n, id: genId('ntf'), timestamp: new Date().toISOString(), read: false }
        set((s) => ({ notifications: [newN, ...s.notifications] }))
      },
      markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllNotificationsRead: (forUserId) => set((s) => ({
        notifications: s.notifications.map((n) =>
          (forUserId === undefined || n.forUserId === forUserId || (!forUserId && !n.forUserId)) ? { ...n, read: true } : n,
        ),
      })),

      addPurity: (p) => set((s) => ({ purities: [...s.purities, { ...p, id: genId('pu') }] })),
      updatePurity: (id, patch) => set((s) => ({ purities: s.purities.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deletePurity: (id) => set((s) => ({ purities: s.purities.filter((p) => p.id !== id) })),

      addCategory: (c) => set((s) => ({ categories: [...s.categories, { ...c, id: genId('cat') }] })),
      updateCategory: (id, patch) => set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: 'ss-jewellery-erp-v2',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} }
        }
        return window.localStorage
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.seeded) state.hydrateSeed()
      },
    },
  ),
)

// ===== Helpers =====
export const formatCurrency = (n: number, currency = '₹') => {
  if (!Number.isFinite(n)) return `${currency}0`
  const fixed = Math.round(n * 100) / 100
  const [whole, frac] = fixed.toFixed(2).split('.')
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${currency}${withCommas}.${frac}`
}

export const formatCompact = (n: number, currency = '₹') => {
  if (n >= 10000000) return `${currency}${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000) return `${currency}${(n / 100000).toFixed(2)}L`
  if (n >= 1000) return `${currency}${(n / 1000).toFixed(1)}k`
  return `${currency}${n.toFixed(0)}`
}

export const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return iso }
}

export const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

export const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

export const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const d = Math.floor(hrs / 24)
  if (d < 30) return `${d}d ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

export const isOverdue = (iso: string) => new Date(iso) < new Date()
