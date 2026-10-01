// S.S JEWELLERY ERP — Domain Types

// ===== Auth & Users =====
export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF'

export interface User {
  id: string
  username: string
  name: string
  phone: string
  email?: string
  role: UserRole
  password: string // mock — plain text for demo only
  active: boolean
  specialty?: string // e.g. "Melting", "Polishing"
  createdAt: string
  lastLogin?: string
}

// ===== Purity & Categories =====
export interface Purity {
  id: string
  label: string // e.g. "22K"
  percentage: number // e.g. 91.6
  metal: MetalType
  active: boolean
}

export interface Category {
  id: string
  name: string
  active: boolean
}

export type MetalType = 'GOLD' | 'SILVER' | 'DIAMOND' | 'PLATINUM' | 'OTHER'
export type MaterialType = 'GOLD_BAR' | 'GOLD_COIN' | 'GOLD_SCRAP' | 'SILVER' | 'ALLOY' | 'STONE' | 'DIAMOND' | 'ACCESSORY' | 'OTHER'

// ===== Work Statuses =====
export type WorkStatusValue =
  | 'PENDING' | 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'ON_HOLD'
  | 'COMPLETED' | 'REWORK_REQUIRED' | 'REJECTED' | 'CANCELLED' | 'QUALITY_CHECK' | 'APPROVED'

export interface WorkStatus {
  id: string
  value: WorkStatusValue
  label: string
  color: string
  active: boolean
}

// ===== Workflow =====
export interface WorkflowStep {
  id: string
  name: string
  description?: string
  defaultUserId?: string
  estimatedHours?: number
  order: number
}

export interface Workflow {
  id: string
  name: string
  description?: string
  steps: WorkflowStep[]
  active: boolean
  createdAt: string
}

export type WorkPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface WorkStepExecution {
  stepId: string
  stepName: string
  assignedTo?: string // user id
  assignedToName?: string
  status: WorkStatusValue
  inputWeight?: number
  outputWeight?: number
  wastage?: number
  remarks?: string
  startedAt?: string
  completedAt?: string
  dueDate?: string
}

export interface WorkHistoryEntry {
  id: string
  timestamp: string
  userName: string
  action: string
  details?: string
}

export interface WorkOrder {
  id: string
  workId: string // WF-10025
  productCode?: string
  productName: string
  customerName?: string
  workflowId: string
  workflowName: string
  steps: WorkStepExecution[]
  currentStepIndex: number
  grossWeight: number
  netWeight?: number
  purity: string
  metal: MetalType
  priority: WorkPriority
  status: WorkStatusValue
  assignedTo?: string
  assignedToName?: string
  startDate: string
  expectedCompletion: string
  actualCompletion?: string
  history: WorkHistoryEntry[]
  notes?: string
  createdAt: string
  updatedAt: string
}

// ===== Gold / Raw Material Inventory =====
export interface GoldStock {
  id: string
  stockId: string // GB-001
  materialType: MaterialType
  metal: MetalType
  purity: string
  karat: string
  grossWeight: number
  fineGoldWeight: number
  supplierId?: string
  supplierName?: string
  purchaseDate: string
  purchaseRate: number // per gram
  purchaseValue: number
  currentLocation: string
  status: 'AVAILABLE' | 'IN_PRODUCTION' | 'USED' | 'SOLD'
  referenceNumber?: string
  createdAt: string
}

export interface StockMovement {
  id: string
  itemType: 'GOLD' | 'STONE' | 'PRODUCT'
  itemId: string
  itemName: string
  fromLocation: string
  toLocation: string
  fromUser?: string
  toUser?: string
  weight?: number
  quantity?: number
  reason: string
  reference?: string
  remarks?: string
  timestamp: string
  performedBy: string
}

export interface StockAdjustment {
  id: string
  itemType: 'GOLD' | 'STONE' | 'PRODUCT'
  itemId: string
  itemName: string
  adjustmentType: 'INCREASE' | 'DECREASE'
  weight?: number
  quantity?: number
  reason: 'WASTAGE' | 'DAMAGE' | 'MISSING' | 'CORRECTION' | 'PHYSICAL_ADJUSTMENT' | 'INTERNAL_TRANSFER'
  remarks: string
  timestamp: string
  performedBy: string
}

export interface WastageRecord {
  id: string
  workOrderId: string
  workId: string
  stepName: string
  userId: string
  userName: string
  inputWeight: number
  outputWeight: number
  wastageWeight: number
  wastagePercent: number
  date: string
}

// ===== Stone Inventory =====
export interface StoneItem {
  id: string
  stoneId: string
  type: string // Diamond, Ruby, Emerald, etc.
  shape: string // Round, Oval, Princess, etc.
  size: string
  quantity: number
  weight: number // carats
  unit: string
  purchaseCost: number
  supplierId?: string
  supplierName?: string
  usedQuantity: number
  remainingQuantity: number
  createdAt: string
}

// ===== Products (Finished Jewellery) =====
export interface Product {
  id: string
  productCode: string // SJ-RING-001
  barcode: string
  name: string
  category: string
  subCategory?: string
  designNumber?: string
  metal: MetalType
  purity: string
  grossWeight: number
  netWeight: number
  stoneWeight: number
  wastage: number
  makingCharge: number
  otherCharges: number
  gstRate: number
  sellingPrice: number
  costPrice: number
  stock: number
  hsnCode?: string
  imageColor?: string
  createdAt: string
  updatedAt: string
}

// ===== Suppliers =====
export interface Supplier {
  id: string
  name: string
  companyName?: string
  phone: string
  email?: string
  address?: string
  gstin?: string
  pan?: string
  openingBalance: number
  totalPurchase: number
  totalPaid: number
  createdAt: string
}

// ===== Purchase =====
export interface PurchaseItem {
  materialType: MaterialType
  description: string
  purity: string
  grossWeight: number
  netWeight: number
  rate: number
  makingCharges: number
  tax: number
  total: number
}

export interface Purchase {
  id: string
  purchaseId: string // PUR-2026-0001
  supplierId: string
  supplierName: string
  invoiceNumber: string
  purchaseDate: string
  items: PurchaseItem[]
  subtotal: number
  totalTax: number
  grandTotal: number
  paidAmount: number
  paymentStatus: 'PAID' | 'PARTIAL' | 'DUE'
  notes?: string
  performedBy: string
  createdAt: string
}

// ===== Customers =====
export interface Customer {
  id: string
  customerId: string // CUST-001
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
  pincode?: string
  gstin?: string
  pan?: string
  dateOfBirth?: string
  anniversary?: string
  totalPurchase: number
  totalPaid: number
  totalDue: number
  totalBills: number
  createdAt: string
}

// ===== Sales =====
export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'BANK' | 'CHEQUE' | 'CREDIT'

export interface SaleItem {
  productId?: string
  productCode?: string
  name: string
  hsn?: string
  metal: MetalType
  purity: string
  grossWeight: number
  netWeight: number
  stoneWeight: number
  rate: number
  makingAmount: number
  stoneAmount: number
  otherCharges: number
  subtotal: number
  discount: number
  gstRate: number
  gstAmount: number
  total: number
  quantity: number
}

export interface Sale {
  id: string
  invoiceNo: string
  customerId: string
  customerName: string
  customerPhone: string
  customerAddress?: string
  customerGstin?: string
  items: SaleItem[]
  subtotal: number
  totalMaking: number
  totalStone: number
  totalOther: number
  totalDiscount: number
  totalGst: number
  grandTotal: number
  paidAmount: number
  dueAmount: number
  paymentMode: PaymentMode
  paymentRef?: string
  status: 'PAID' | 'PARTIAL' | 'DUE' | 'CANCELLED'
  oldGoldAdjustment: number
  branch: string
  billedBy: string
  createdAt: string
}

// ===== Payments =====
export interface Payment {
  id: string
  paymentId: string // PAY-2026-0001
  saleId?: string
  invoiceNo?: string
  customerId: string
  customerName: string
  amount: number
  paymentMode: PaymentMode
  transactionId?: string
  receivedBy: string
  remarks?: string
  date: string
  createdAt: string
}

// ===== Sales Return =====
export interface SalesReturn {
  id: string
  returnId: string // RET-2026-0001
  originalInvoiceNo: string
  saleId: string
  customerName: string
  productName: string
  returnQuantity: number
  returnWeight: number
  reason: string
  refundAmount: number
  exchangeAmount: number
  restockingStatus: 'PENDING' | 'DONE'
  date: string
  createdAt: string
}

// ===== Exchange (Old Gold) =====
export type ExchangeType = 'BUY' | 'EXCHANGE'

export interface OldGoldExchange {
  id: string
  voucherNo: string
  customerName: string
  customerPhone: string
  type: ExchangeType
  itemDescription: string
  grossWeight: number
  netWeight: number
  karat: string
  touch: number
  ratePerGram: number
  totalValue: number
  adjustedAgainstInvoice?: string
  paidAmount: number
  date: string
  createdAt: string
}

// ===== Quality Check =====
export interface QualityCheck {
  id: string
  workOrderId: string
  workId: string
  productName: string
  weightChecked: boolean
  purityChecked: boolean
  designChecked: boolean
  stoneChecked: boolean
  finishingChecked: boolean
  result: 'APPROVED' | 'REJECTED'
  remarks?: string
  checkedBy: string
  date: string
}

// ===== Audit Log =====
export interface AuditLog {
  id: string
  timestamp: string
  userName: string
  action: string
  entity: string
  entityId?: string
  oldValue?: string
  newValue?: string
  details?: string
}

// ===== Notifications =====
export interface AppNotification {
  id: string
  type: 'WORK_ASSIGNED' | 'WORK_COMPLETED' | 'WORK_OVERDUE' | 'WORK_REJECTED' | 'REWORK_REQUIRED' | 'STOCK_LOW' | 'PAYMENT_DUE' | 'NEW_SALE' | 'NEW_PURCHASE' | 'WORK_REASSIGNED' | 'WORK_DEADLINE'
  title: string
  message: string
  forUserId?: string // undefined = admin
  read: boolean
  timestamp: string
  link?: string
}

// ===== Settings =====
export interface ShopSettings {
  shopName: string
  ownerName: string
  phone: string
  email: string
  address: string
  city: string
  pincode: string
  gstin: string
  pan: string
  defaultGstRate: number
  defaultGoldRate24K: number
  defaultSilverRate: number
  branch: string
  currency: string
  invoicePrefix: string
  invoiceSeq: number
  purchasePrefix: string
  purchaseSeq: number
  workOrderPrefix: string
  workOrderSeq: number
  invoiceFooter: string
  termsConditions: string
}

// ===== Constants =====
export const METAL_OPTIONS: { value: MetalType; label: string; color: string }[] = [
  { value: 'GOLD', label: 'Gold', color: 'text-amber-600 dark:text-amber-400' },
  { value: 'SILVER', label: 'Silver', color: 'text-slate-500' },
  { value: 'DIAMOND', label: 'Diamond', color: 'text-cyan-600 dark:text-cyan-400' },
  { value: 'PLATINUM', label: 'Platinum', color: 'text-zinc-500' },
  { value: 'OTHER', label: 'Other', color: 'text-rose-600 dark:text-rose-400' },
]

export const MATERIAL_OPTIONS: { value: MaterialType; label: string }[] = [
  { value: 'GOLD_BAR', label: 'Gold Bar' },
  { value: 'GOLD_COIN', label: 'Gold Coin' },
  { value: 'GOLD_SCRAP', label: 'Gold Scrap' },
  { value: 'SILVER', label: 'Silver' },
  { value: 'ALLOY', label: 'Alloy' },
  { value: 'STONE', label: 'Stone' },
  { value: 'DIAMOND', label: 'Diamond' },
  { value: 'ACCESSORY', label: 'Accessory' },
  { value: 'OTHER', label: 'Other' },
]

export const PAYMENT_OPTIONS: { value: PaymentMode; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CREDIT', label: 'Credit' },
]

export const PRIORITY_OPTIONS: { value: WorkPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400' },
  { value: 'NORMAL', label: 'Normal', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { value: 'HIGH', label: 'High', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
]

export const DEFAULT_STATUSES: WorkStatus[] = [
  { id: 'st-1', value: 'PENDING', label: 'Pending', color: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30', active: true },
  { id: 'st-2', value: 'ASSIGNED', label: 'Assigned', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30', active: true },
  { id: 'st-3', value: 'ACCEPTED', label: 'Accepted', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30', active: true },
  { id: 'st-4', value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', active: true },
  { id: 'st-5', value: 'ON_HOLD', label: 'On Hold', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30', active: true },
  { id: 'st-6', value: 'COMPLETED', label: 'Completed', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', active: true },
  { id: 'st-7', value: 'REWORK_REQUIRED', label: 'Rework Required', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30', active: true },
  { id: 'st-8', value: 'REJECTED', label: 'Rejected', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30', active: true },
  { id: 'st-9', value: 'CANCELLED', label: 'Cancelled', color: 'bg-muted text-muted-foreground', active: true },
  { id: 'st-10', value: 'QUALITY_CHECK', label: 'Quality Check', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30', active: true },
  { id: 'st-11', value: 'APPROVED', label: 'Approved', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30', active: true },
]

export const DEFAULT_PURITIES: Purity[] = [
  { id: 'pu-1', label: '24K', percentage: 99.9, metal: 'GOLD', active: true },
  { id: 'pu-2', label: '22K', percentage: 91.6, metal: 'GOLD', active: true },
  { id: 'pu-3', label: '20K', percentage: 83.3, metal: 'GOLD', active: true },
  { id: 'pu-4', label: '18K', percentage: 75, metal: 'GOLD', active: true },
  { id: 'pu-5', label: '14K', percentage: 58.5, metal: 'GOLD', active: true },
  { id: 'pu-6', label: '925', percentage: 92.5, metal: 'SILVER', active: true },
  { id: 'pu-7', label: 'PT950', percentage: 95, metal: 'PLATINUM', active: true },
]

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Ring', active: true },
  { id: 'cat-2', name: 'Necklace', active: true },
  { id: 'cat-3', name: 'Chain', active: true },
  { id: 'cat-4', name: 'Bracelet', active: true },
  { id: 'cat-5', name: 'Bangle', active: true },
  { id: 'cat-6', name: 'Earrings', active: true },
  { id: 'cat-7', name: 'Pendant', active: true },
  { id: 'cat-8', name: 'Nose Pin', active: true },
  { id: 'cat-9', name: 'Anklet', active: true },
  { id: 'cat-10', name: 'Bridal Set', active: true },
  { id: 'cat-11', name: "Men's Jewellery", active: true },
  { id: 'cat-12', name: "Kids Jewellery", active: true },
]
