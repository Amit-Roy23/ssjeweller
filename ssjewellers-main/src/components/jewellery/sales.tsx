'use client'

import * as React from 'react'
import {
  Plus, Search, ReceiptIndianRupee, Trash2, Eye, Printer, Gem, X, Download, Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatCurrency, formatDateTime, formatDate, formatCompact } from '@/lib/store'
import { PAYMENT_OPTIONS, type Sale, type SaleItem, type PaymentMode, type Product, type Customer } from '@/lib/types'
import { StatusBadge } from './status-badge'
import {
  useSales,
  useCreateSale,
  useCancelSale,
  useRecordPayment,
  useCustomers,
  useProducts,
  useSettings,
  useAuthMe,
} from '@/lib/hooks/use-erp-queries'
import { toast } from 'sonner'

const PAGE_SIZE = 8

export function SalesView() {
  const [tab, setTab] = React.useState<'sales' | 'payments'>('sales')
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('ALL')
  const [page, setPage] = React.useState(1)
  const [newOpen, setNewOpen] = React.useState(false)
  const [viewSaleId, setViewSaleId] = React.useState<string | null>(null)
  const [cancelId, setCancelId] = React.useState<string | null>(null)
  const [cancelReason, setCancelReason] = React.useState('Customer returned/cancelled order')
  const [paySaleId, setPaySaleId] = React.useState<string | null>(null)

  const { data: salesData, isLoading: loadingSales } = useSales({
    search: search || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    page,
    limit: PAGE_SIZE,
  })

  const { data: customersData } = useCustomers()
  const { data: productsData } = useProducts({ inStock: true })
  const { data: settingsData } = useSettings()
  const { data: authData } = useAuthMe()

  const createSaleMutation = useCreateSale()
  const cancelSaleMutation = useCancelSale()
  const recordPaymentMutation = useRecordPayment()

  const currency = settingsData?.settings?.currency || '₹'
  const currentUser = authData?.user
  const customers: Customer[] = (customersData?.customers || []).map((c: any) => ({
    id: c.id,
    customerId: c.customerId,
    name: c.name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    city: c.city,
    pincode: c.pincode,
    gstin: c.gstin,
    pan: c.pan,
    totalPurchase: Number(c.totalPurchasePaise || 0) / 100,
    totalPaid: Number(c.totalPaidPaise || 0) / 100,
    totalDue: Number(c.totalDuePaise || 0) / 100,
    totalBills: Number(c.totalBills || 0),
    createdAt: c.createdAt,
  }))

  const products: Product[] = (productsData?.products || []).map((p: any) => ({
    id: p.id,
    productCode: p.productCode,
    barcode: p.barcode,
    name: p.name,
    category: p.category?.name || p.category || 'General',
    metal: p.metal || 'GOLD',
    purity: p.purity || '22K',
    grossWeight: Number(p.grossWeightMg || 0) / 1000,
    netWeight: Number(p.netWeightMg || 0) / 1000,
    stoneWeight: Number(p.stoneWeightMg || 0) / 1000,
    wastage: Number(p.wastageMg || 0) / 1000,
    makingCharge: Number(p.makingChargePaise || 0) / 100,
    otherCharges: Number(p.otherChargesPaise || 0) / 100,
    costPrice: Number(p.costPricePaise || 0) / 100,
    sellingPrice: Number(p.sellingPricePaise || 0) / 100,
    gstRate: Number(p.gstRateBps || 300) / 100,
    stock: Number(p.stock || 0),
    hsnCode: p.hsnCode || '7113',
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }))

  const sales: Sale[] = (salesData?.sales || []).map((s: any) => ({
    id: s.id,
    invoiceNo: s.invoiceNo,
    customerId: s.customerId,
    customerName: s.customerName,
    customerPhone: s.customerPhone,
    customerAddress: s.customerAddress || undefined,
    customerGstin: s.customerGstin || undefined,
    items: (s.items || []).map((it: any) => ({
      productId: it.productId,
      productCode: it.productCode || undefined,
      name: it.name,
      hsn: it.hsn,
      metal: it.metal,
      purity: it.purity,
      grossWeight: Number(it.grossWeightMg || 0) / 1000,
      netWeight: Number(it.netWeightMg || 0) / 1000,
      stoneWeight: Number(it.stoneWeightMg || 0) / 1000,
      rate: Number(it.ratePaisePerGram || 0) / 100,
      makingAmount: Number(it.makingAmountPaise || 0) / 100,
      stoneAmount: Number(it.stoneAmountPaise || 0) / 100,
      otherCharges: Number(it.otherChargesPaise || 0) / 100,
      subtotal: Number(it.subtotalPaise || 0) / 100,
      discount: Number(it.discountPaise || 0) / 100,
      gstRate: Number(it.gstRateBps || 0) / 100,
      gstAmount: Number(it.gstAmountPaise || 0) / 100,
      total: Number(it.totalPaise || 0) / 100,
      quantity: it.quantity || 1,
    })),
    subtotal: Number(s.subtotalPaise || 0) / 100,
    totalMaking: Number(s.totalMakingPaise || 0) / 100,
    totalStone: Number(s.totalStonePaise || 0) / 100,
    totalOther: Number(s.totalOtherPaise || 0) / 100,
    totalDiscount: Number(s.totalDiscountPaise || 0) / 100,
    totalGst: Number(s.totalGstPaise || 0) / 100,
    grandTotal: Number(s.grandTotalPaise || 0) / 100,
    paidAmount: Number(s.paidAmountPaise || 0) / 100,
    dueAmount: Number(s.dueAmountPaise || 0) / 100,
    paymentMode: s.paymentMode,
    status: s.status,
    oldGoldAdjustment: Number(s.oldGoldAdjustmentPaise || 0) / 100,
    branch: s.branch || 'Main Branch',
    billedBy: s.billedBy?.name || 'Admin',
    createdAt: s.createdAt,
  }))

  const viewSale = viewSaleId ? sales.find((s) => s.id === viewSaleId) || null : null
  const paySale = paySaleId ? sales.find((s) => s.id === paySaleId) || null : null

  const allPayments = (salesData?.sales || []).flatMap((s: any) =>
    (s.payments || []).map((p: any) => ({
      id: p.id,
      paymentId: p.paymentId || p.id,
      invoiceNo: s.invoiceNo,
      customerName: s.customerName,
      amount: Number(p.amountPaise || 0) / 100,
      paymentMode: p.paymentMode,
      date: p.paymentDate || p.createdAt,
      receivedBy: p.receivedByName || 'Admin',
    }))
  )

  const pagination = salesData?.pagination || { totalCount: sales.length, totalPages: 1 }
  const totalPages = Math.max(1, pagination.totalPages || 1)

  const stats = {
    today: sales.filter((s) => new Date(s.createdAt) >= new Date(new Date().setHours(0, 0, 0, 0))).reduce((sum, s) => sum + s.grandTotal, 0),
    month: sales.filter((s) => new Date(s.createdAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((sum, s) => sum + s.grandTotal, 0),
    unpaid: sales.reduce((sum, s) => sum + s.dueAmount, 0),
    count: pagination.totalCount || sales.length,
  }

  const handleCancel = async () => {
    if (!cancelId) return
    try {
      await cancelSaleMutation.mutateAsync({ id: cancelId, reason: cancelReason })
      toast.success('Sale bill cancelled and stock restored')
      setCancelId(null)
    } catch (err: any) {
      toast.error(err.message || 'Error cancelling sale')
    }
  }

  const handleCreateSale = async (data: any) => {
    try {
      const payload = {
        customerId: data.customerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress || null,
        customerGstin: data.customerGstin || null,
        paymentMode: data.paymentMode || 'CASH',
        paidAmountPaise: Math.round((data.paidAmount || 0) * 100),
        oldGoldAdjustmentPaise: Math.round((data.oldGoldAdjustment || 0) * 100),
        branch: data.branch || 'Main Branch',
        items: data.items.map((it: any) => ({
          productId: it.productId || null,
          productCode: it.productCode || null,
          name: it.name,
          hsn: it.hsn || '7113',
          metal: it.metal || 'GOLD',
          purity: it.purity || '22K',
          grossWeightMg: Math.round((it.grossWeight || 0) * 1000),
          netWeightMg: Math.round((it.netWeight || 0) * 1000),
          stoneWeightMg: Math.round((it.stoneWeight || 0) * 1000),
          ratePaisePerGram: Math.round((it.rate || 0) * 100),
          makingAmountPaise: Math.round((it.makingAmount || 0) * 100),
          stoneAmountPaise: Math.round((it.stoneAmount || 0) * 100),
          otherChargesPaise: Math.round((it.otherCharges || 0) * 100),
          discountPaise: Math.round((it.discount || 0) * 100),
          gstRateBps: Math.round((it.gstRate || 3) * 100),
          quantity: it.quantity || 1,
        })),
      }

      const res = await createSaleMutation.mutateAsync(payload)
      toast.success(`Bill ${res.sale?.invoiceNo || 'created'} generated successfully`)
      setNewOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create bill')
    }
  }

  const handleRecordPayment = async (amount: number, mode: PaymentMode, ref: string) => {
    if (!paySale) return
    try {
      await recordPaymentMutation.mutateAsync({
        saleId: paySale.id,
        data: {
          amountPaise: Math.round(amount * 100),
          paymentMode: mode,
          reference: ref || null,
          notes: `Payment for bill ${paySale.invoiceNo}`,
        },
      })
      toast.success('Payment recorded successfully')
      setPaySaleId(null)
    } catch (err: any) {
      toast.error(err.message || 'Error recording payment')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><ReceiptIndianRupee className="h-5 w-5 text-primary" /> Sales &amp; Billing</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{stats.count} bills · {formatCompact(stats.month, currency)} this month</p>
        </div>
        <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New Bill</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Today&apos;s Sales</p><p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(stats.today, currency)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">This Month</p><p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(stats.month, currency)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Unpaid Balance</p><p className="text-base md:text-lg font-bold mt-0.5 text-rose-600 dark:text-rose-400">{formatCompact(stats.unpaid, currency)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Total Bills</p><p className="text-base md:text-lg font-bold mt-0.5">{stats.count}</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'sales' | 'payments')}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="sales">Bills</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-3 mt-3">
          <Card><CardContent className="p-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search invoice, customer, phone…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="DUE">Due</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent></Card>

          {loadingSales ? (
            <Card><CardContent className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /><p className="text-sm text-muted-foreground mt-2">Loading sales bills...</p></CardContent></Card>
          ) : sales.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><ReceiptIndianRupee className="h-12 w-12 mx-auto text-muted-foreground/50" /><p className="text-sm text-muted-foreground mt-3">No bills found</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {sales.map((s) => (
                <Card key={s.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{s.invoiceNo}</p>
                          <StatusBadge status={s.status} />
                          <Badge variant="outline" className="text-[10px]">{s.paymentMode}</Badge>
                        </div>
                        <p className="text-sm mt-0.5 truncate">{s.customerName}</p>
                        <p className="text-[11px] text-muted-foreground">{s.customerPhone} · {formatDateTime(s.createdAt)} · {s.items.length} item(s)</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base md:text-lg font-bold">{formatCurrency(s.grandTotal, currency)}</p>
                        {s.dueAmount > 0 && <p className="text-[10px] text-rose-600 dark:text-rose-400">Due: {formatCurrency(s.dueAmount, currency)}</p>}
                        <div className="flex justify-end gap-1 mt-1">
                          {s.dueAmount > 0 && s.status !== 'CANCELLED' && (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPaySaleId(s.id)}>Payment</Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewSaleId(s.id)}><Eye className="h-3.5 w-3.5" /></Button>
                          {s.status !== 'CANCELLED' && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setCancelId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-3">
          <Card><CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Payment ID</th>
                    <th className="text-left font-medium px-3 py-2">Invoice</th>
                    <th className="text-left font-medium px-3 py-2">Customer</th>
                    <th className="text-right font-medium px-3 py-2">Amount</th>
                    <th className="text-left font-medium px-3 py-2">Mode</th>
                    <th className="text-left font-medium px-3 py-2">Date</th>
                    <th className="text-left font-medium px-3 py-2">Received By</th>
                  </tr>
                </thead>
                <tbody>
                  {allPayments.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No payments recorded</td></tr>
                  ) : allPayments.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-medium">{p.paymentId}</td>
                      <td className="px-3 py-2 text-xs">{p.invoiceNo ?? '-'}</td>
                      <td className="px-3 py-2">{p.customerName}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatCurrency(p.amount, currency)}</td>
                      <td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{p.paymentMode}</Badge></td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(p.date)}</td>
                      <td className="px-3 py-2 text-xs">{p.receivedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <NewBillDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        customers={customers}
        products={products}
        currency={currency}
        isSaving={createSaleMutation.isPending}
        onSave={handleCreateSale}
      />

      <ViewBillDialog sale={viewSale} onClose={() => setViewSaleId(null)} currency={currency} />

      {paySale && (
        <PaymentDialog
          sale={paySale}
          onClose={() => setPaySaleId(null)}
          currency={currency}
          isSaving={recordPaymentMutation.isPending}
          onSave={handleRecordPayment}
        />
      )}

      <AlertDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this bill?</AlertDialogTitle>
            <AlertDialogDescription>The bill will be marked as cancelled and inventory items will be returned to stock.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>Cancellation Reason</Label>
            <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelSaleMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelSaleMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelSaleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Cancel Bill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function NewBillDialog({ open, onOpenChange, customers, products, currency, isSaving, onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  customers: Customer[]
  products: Product[]
  currency: string
  isSaving: boolean
  onSave: (sale: any) => void
}) {
  const [customerId, setCustomerId] = React.useState('')
  const [items, setItems] = React.useState<SaleItem[]>([])
  const [oldGoldAdj, setOldGoldAdj] = React.useState(0)
  const [paymentMode, setPaymentMode] = React.useState<PaymentMode>('CASH')
  const [amountPaid, setAmountPaid] = React.useState(0)
  const [status, setStatus] = React.useState<Sale['status']>('PAID')

  React.useEffect(() => {
    if (open) {
      setCustomerId(customers[0]?.id || '')
      setItems([])
      setOldGoldAdj(0)
      setPaymentMode('CASH')
      setAmountPaid(0)
      setStatus('PAID')
    }
  }, [open, customers])

  const customer = customers.find((c) => c.id === customerId)

  const addItem = (productId: string) => {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    if (items.some((i) => i.productId === p.id)) { toast.error('Product already added'); return }
    const makingAmount = p.makingCharge
    const rate = Math.max(100, Math.round((p.sellingPrice - p.makingCharge) / Math.max(0.1, p.netWeight || p.grossWeight || 1)))
    const subtotal = p.sellingPrice
    setItems((arr) => [...arr, {
      productId: p.id,
      productCode: p.productCode,
      name: p.name,
      hsn: p.hsnCode || '7113',
      metal: p.metal || 'GOLD',
      purity: p.purity || '22K',
      grossWeight: p.grossWeight,
      netWeight: p.netWeight,
      stoneWeight: p.stoneWeight,
      rate,
      makingAmount,
      stoneAmount: 0,
      otherCharges: p.otherCharges,
      subtotal,
      discount: 0,
      gstRate: p.gstRate || 3,
      gstAmount: 0,
      total: subtotal,
      quantity: 1,
    }])
  }

  const removeItem = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i))
  const updateQty = (i: number, qty: number) => setItems((arr) => arr.map((it, idx) => idx === i ? {
    ...it,
    quantity: Math.max(1, qty),
    total: it.subtotal * Math.max(1, qty),
  } : it))

  const totals = React.useMemo(() => {
    const totalGram = items.reduce((s, it) => s + (it.netWeight || it.grossWeight || 0) * it.quantity, 0)
    const subtotal = items.reduce((s, it) => s + it.subtotal * it.quantity, 0)
    const totalMaking = items.reduce((s, it) => s + it.makingAmount * it.quantity, 0)
    const grandTotal = Math.max(0, subtotal - oldGoldAdj)
    return { totalGram, subtotal, totalMaking, totalGst: 0, grandTotal }
  }, [items, oldGoldAdj])

  const valid = items.length > 0 && !!customerId

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Bill</DialogTitle>
          <DialogDescription>Create a new sales invoice</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Customer *</Label>
            {customers.length > 0 ? (
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.phone}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-rose-500">No customers found. Please add a customer first.</p>
            )}
            {customer && (
              <div className="bg-muted/40 rounded-lg p-2 text-xs">
                <p className="font-medium">{customer.name}</p>
                <p className="text-muted-foreground">{customer.phone} · {customer.address ?? customer.city}</p>
                {customer.gstin && <p className="text-muted-foreground">GSTIN: {customer.gstin}</p>}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Items</Label>
            {products.length > 0 && (
              <Select value="" onValueChange={addItem}>
                <SelectTrigger><SelectValue placeholder="+ Add product from inventory" /></SelectTrigger>
                <SelectContent>{products.filter((p) => p.stock > 0 && !items.some((i) => i.productId === p.id)).map((p) => <SelectItem key={p.id} value={p.id}>{p.productCode} · {p.name} · {formatCurrency(p.sellingPrice, currency)} ({p.stock} in stock)</SelectItem>)}</SelectContent>
              </Select>
            )}
            {items.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center bg-muted/30 rounded-md">No items added</p> : (
              <div className="border border-border rounded-lg overflow-hidden">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{it.name}</p>
                      <p className="text-[11px] text-muted-foreground">{it.productCode} · {it.purity} · {it.netWeight.toFixed(2)}g</p>
                    </div>
                    <Input type="number" min="1" value={it.quantity} onChange={(e) => updateQty(idx, parseInt(e.target.value) || 1)} className="w-14 h-8 text-center" />
                    <p className="text-sm font-semibold tabular-nums w-24 text-right">{formatCurrency(it.total, currency)}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => removeItem(idx)}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Old Gold Adjustment (₹)</Label><Input type="number" value={oldGoldAdj} onChange={(e) => setOldGoldAdj(parseFloat(e.target.value) || 0)} /></div>
            <div className="space-y-1.5"><Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Sale['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PAID">Paid</SelectItem><SelectItem value="PARTIAL">Partial</SelectItem><SelectItem value="DUE">Due</SelectItem></SelectContent>
              </Select>
            </div>
            {status !== 'PAID' && (
              <div className="space-y-1.5"><Label>Amount Paid (₹)</Label><Input type="number" value={amountPaid} onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)} /></div>
            )}
          </div>

          <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
            {oldGoldAdj > 0 && (
              <>
                <Row label="Sub Total" value={formatCurrency(totals.subtotal, currency)} />
                <Row label="Old Gold Adj" value={`- ${formatCurrency(oldGoldAdj, currency)}`} />
                <div className="border-t border-border my-1" />
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm sm:text-base">Grand Gram</span>
              <span className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {totals.totalGram.toFixed(2)} g
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm sm:text-base">Total Amount</span>
              <span className="text-lg sm:text-xl font-bold text-primary tabular-nums">
                {formatCurrency(totals.grandTotal, currency)}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={() => valid && onSave({
            customerId: customerId,
            customerName: customer?.name ?? 'Customer',
            customerPhone: customer?.phone ?? '',
            customerAddress: customer?.address,
            customerGstin: customer?.gstin,
            items,
            subtotal: totals.subtotal,
            totalMaking: totals.totalMaking,
            grandTotal: totals.grandTotal,
            paidAmount: status === 'PAID' ? totals.grandTotal : amountPaid,
            paymentMode,
            oldGoldAdjustment: oldGoldAdj,
          })} disabled={!valid || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Create Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium tabular-nums">{value}</span></div>
}

function ViewBillDialog({ sale, onClose, currency }: {
  sale: Sale | null
  onClose: () => void
  currency: string
}) {
  return (
    <Dialog open={!!sale} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {sale && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><ReceiptIndianRupee className="h-5 w-5 text-primary" />{sale.invoiceNo}</span>
                <StatusBadge status={sale.status} />
              </DialogTitle>
              <DialogDescription>{formatDateTime(sale.createdAt)} · Billed by {sale.billedBy}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="bg-muted/40 rounded-lg p-3 text-sm">
                <p className="font-semibold">{sale.customerName}</p>
                <p className="text-[11px] text-muted-foreground">{sale.customerPhone}</p>
                {sale.customerAddress && <p className="text-[11px] text-muted-foreground">{sale.customerAddress}</p>}
                {sale.customerGstin && <p className="text-[11px] text-muted-foreground">GSTIN: {sale.customerGstin}</p>}
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                {sale.items.map((it, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2.5 border-b border-border last:border-0">
                    <Gem className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{it.name}</p>
                      <p className="text-[11px] text-muted-foreground">{it.productCode} · {it.purity} · {it.netWeight.toFixed(2)}g net</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-muted-foreground">x{it.quantity}</p>
                      <p className="text-sm font-semibold tabular-nums">{formatCurrency(it.total, currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 text-sm">
                {sale.oldGoldAdjustment > 0 && (
                  <>
                    <Row label="Sub Total" value={formatCurrency(sale.subtotal, currency)} />
                    <Row label="Old Gold Adj" value={`- ${formatCurrency(sale.oldGoldAdjustment, currency)}`} />
                    <div className="border-t border-border my-1" />
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Grand Gram</span>
                  <span className="text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {sale.items.reduce((sum, it) => sum + (it.netWeight || it.grossWeight || 0) * it.quantity, 0).toFixed(2)} g
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    {formatCurrency(sale.grandTotal, currency)}
                  </span>
                </div>
                {sale.dueAmount > 0 && <div className="flex items-center justify-between text-rose-600 dark:text-rose-400"><span>Due</span><span className="font-medium">{formatCurrency(sale.dueAmount, currency)}</span></div>}
                <Row label="Payment Mode" value={sale.paymentMode} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1.5" />Print</Button>
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PaymentDialog({ sale, onClose, currency, isSaving, onSave }: {
  sale: Sale
  onClose: () => void
  currency: string
  isSaving: boolean
  onSave: (amount: number, mode: PaymentMode, ref: string) => void
}) {
  const [amount, setAmount] = React.useState(sale.dueAmount)
  const [mode, setMode] = React.useState<PaymentMode>('CASH')
  const [ref, setRef] = React.useState('')

  return (
    <Dialog open onOpenChange={(o) => !isSaving && !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment — {sale.invoiceNo}</DialogTitle>
          <DialogDescription>Due: {formatCurrency(sale.dueAmount, currency)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Amount (₹)</Label><Input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} /></div>
          <div className="space-y-1.5"><Label>Payment Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PAYMENT_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {mode !== 'CASH' && <div className="space-y-1.5"><Label>Reference</Label><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Transaction ID" /></div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={() => amount > 0 && onSave(amount, mode, ref)} disabled={amount <= 0 || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
