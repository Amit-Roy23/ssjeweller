'use client'

import * as React from 'react'
import {
  Plus, Search, ReceiptIndianRupee, Trash2, Eye, Printer, Gem, X, Download,
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
import { useJewelleryStore, formatCurrency, formatDateTime, formatDate, formatCompact } from '@/lib/store'
import { PAYMENT_OPTIONS, type Sale, type SaleItem, type PaymentMode } from '@/lib/types'
import { StatusBadge } from './status-badge'
import { toast } from 'sonner'

const PAGE_SIZE = 8

export function SalesView() {
  const { sales, customers, products, payments, settings, currentUser, addSale, deleteSale, addPayment } = useJewelleryStore()
  const [tab, setTab] = React.useState<'sales' | 'payments'>('sales')
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('ALL')
  const [page, setPage] = React.useState(1)
  const [newOpen, setNewOpen] = React.useState(false)
  const [viewSale, setViewSale] = React.useState<Sale | null>(null)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [payOpen, setPayOpen] = React.useState<Sale | null>(null)

  const filtered = sales.filter((s) => {
    const q = search.trim().toLowerCase()
    const matchQ = !q || s.invoiceNo.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q) || s.customerPhone.includes(q)
    const matchS = statusFilter === 'ALL' || s.status === statusFilter
    return matchQ && matchS
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const stats = {
    today: sales.filter((s) => new Date(s.createdAt) >= new Date(new Date().setHours(0, 0, 0, 0))).reduce((sum, s) => sum + s.grandTotal, 0),
    month: sales.filter((s) => new Date(s.createdAt) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((sum, s) => sum + s.grandTotal, 0),
    unpaid: sales.reduce((sum, s) => sum + s.dueAmount, 0),
    count: sales.length,
  }

  const handleDelete = () => { if (deleteId) { deleteSale(deleteId); toast.success('Bill deleted'); setDeleteId(null) } }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><ReceiptIndianRupee className="h-5 w-5 text-primary" /> Sales &amp; Billing</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{sales.length} bills · {formatCompact(stats.month, settings.currency)} this month</p>
        </div>
        <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New Bill</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Today&apos;s Sales</p><p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(stats.today, settings.currency)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">This Month</p><p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(stats.month, settings.currency)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Unpaid Balance</p><p className="text-base md:text-lg font-bold mt-0.5 text-rose-600 dark:text-rose-400">{formatCompact(stats.unpaid, settings.currency)}</p></CardContent></Card>
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
                <SelectContent><SelectItem value="ALL">All Status</SelectItem><SelectItem value="PAID">Paid</SelectItem><SelectItem value="PARTIAL">Partial</SelectItem><SelectItem value="DUE">Due</SelectItem><SelectItem value="CANCELLED">Cancelled</SelectItem></SelectContent>
              </Select>
            </div>
          </CardContent></Card>

          {pageItems.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><ReceiptIndianRupee className="h-12 w-12 mx-auto text-muted-foreground/50" /><p className="text-sm text-muted-foreground mt-3">No bills found</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {pageItems.map((s) => (
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
                        <p className="text-base md:text-lg font-bold">{formatCurrency(s.grandTotal, settings.currency)}</p>
                        {s.dueAmount > 0 && <p className="text-[10px] text-rose-600 dark:text-rose-400">Due: {formatCurrency(s.dueAmount, settings.currency)}</p>}
                        <div className="flex justify-end gap-1 mt-1">
                          {s.dueAmount > 0 && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPayOpen(s)}>Payment</Button>}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewSale(s)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
              <p className="text-xs text-muted-foreground">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
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
                  {payments.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No payments recorded</td></tr>
                  ) : payments.slice(0, 30).map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-medium">{p.paymentId}</td>
                      <td className="px-3 py-2 text-xs">{p.invoiceNo ?? '-'}</td>
                      <td className="px-3 py-2">{p.customerName}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatCurrency(p.amount, settings.currency)}</td>
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

      <NewBillDialog open={newOpen} onOpenChange={setNewOpen} customers={customers} products={products} settings={settings} currentUser={currentUser} onSave={(sale) => { const s = addSale(sale); toast.success(`Bill ${s.invoiceNo} created`); setNewOpen(false) }} />

      <ViewBillDialog sale={viewSale} onClose={() => setViewSale(null)} settings={settings} />

      {payOpen && (
        <PaymentDialog sale={payOpen} onClose={() => setPayOpen(null)} settings={settings} currentUser={currentUser} onSave={(amount, mode, ref) => {
          addPayment({ saleId: payOpen.id, invoiceNo: payOpen.invoiceNo, customerId: payOpen.customerId, customerName: payOpen.customerName, amount, paymentMode: mode, transactionId: ref, receivedBy: currentUser?.name ?? 'Admin', date: new Date().toISOString() })
          toast.success('Payment recorded')
          setPayOpen(null)
        }} />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this bill?</AlertDialogTitle><AlertDialogDescription>The bill will be permanently removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function NewBillDialog({ open, onOpenChange, customers, products, settings, currentUser, onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  customers: ReturnType<typeof useJewelleryStore.getState>['customers']
  products: ReturnType<typeof useJewelleryStore.getState>['products']
  settings: ReturnType<typeof useJewelleryStore.getState>['settings']
  currentUser: ReturnType<typeof useJewelleryStore.getState>['currentUser']
  onSave: (sale: Omit<Sale, 'id' | 'invoiceNo' | 'createdAt'>) => void
}) {
  const [customerId, setCustomerId] = React.useState('')
  const [items, setItems] = React.useState<SaleItem[]>([])
  const [oldGoldAdj, setOldGoldAdj] = React.useState(0)
  const [paymentMode, setPaymentMode] = React.useState<PaymentMode>('CASH')
  const [amountPaid, setAmountPaid] = React.useState(0)
  const [status, setStatus] = React.useState<Sale['status']>('PAID')

  React.useEffect(() => {
    if (open) { setCustomerId(''); setItems([]); setOldGoldAdj(0); setPaymentMode('CASH'); setAmountPaid(0); setStatus('PAID') }
  }, [open])

  const customer = customers.find((c) => c.id === customerId)

  const addItem = (productId: string) => {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    if (items.some((i) => i.productId === p.id)) { toast.error('Already added'); return }
    const makingAmount = p.makingCharge
    const rate = p.sellingPrice - p.makingCharge - (p.stoneWeight > 0 ? 0 : 0)
    const subtotal = p.sellingPrice
    setItems((arr) => [...arr, {
      productId: p.id, productCode: p.productCode, name: p.name, hsn: p.hsnCode, metal: p.metal, purity: p.purity,
      grossWeight: p.grossWeight, netWeight: p.netWeight, stoneWeight: p.stoneWeight,
      rate, makingAmount, stoneAmount: 0, otherCharges: p.otherCharges, subtotal,
      discount: 0, gstRate: 0, gstAmount: 0, total: subtotal, quantity: 1,
    }])
  }
  const removeItem = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i))
  const updateQty = (i: number, qty: number) => setItems((arr) => arr.map((it, idx) => idx === i ? {
    ...it, quantity: Math.max(1, qty),
    gstRate: 0,
    gstAmount: 0,
    total: it.subtotal * Math.max(1, qty),
  } : it))

  const totals = React.useMemo(() => {
    const totalGram = items.reduce((s, it) => s + (it.netWeight || it.grossWeight || 0) * it.quantity, 0)
    const subtotal = items.reduce((s, it) => s + it.subtotal * it.quantity, 0)
    const totalMaking = items.reduce((s, it) => s + it.makingAmount * it.quantity, 0)
    const grandTotal = Math.max(0, subtotal - oldGoldAdj)
    return { totalGram, subtotal, totalMaking, totalGst: 0, grandTotal }
  }, [items, oldGoldAdj])

  const valid = items.length > 0 && (!!customer || true)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Bill</DialogTitle><DialogDescription>Create a new sales invoice</DialogDescription></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Customer</Label>
            {customers.length > 0 && (
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select customer (or leave blank for walk-in)" /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {c.phone}</SelectItem>)}</SelectContent>
              </Select>
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
                <SelectContent>{products.filter((p) => p.stock > 0 && !items.some((i) => i.productId === p.id)).map((p) => <SelectItem key={p.id} value={p.id}>{p.productCode} · {p.name} · {formatCurrency(p.sellingPrice, settings.currency)} ({p.stock} in stock)</SelectItem>)}</SelectContent>
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
                    <p className="text-sm font-semibold tabular-nums w-24 text-right">{formatCurrency(it.total, settings.currency)}</p>
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
                <Row label="Sub Total" value={formatCurrency(totals.subtotal, settings.currency)} />
                <Row label="Old Gold Adj" value={`- ${formatCurrency(oldGoldAdj, settings.currency)}`} />
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
                {formatCurrency(totals.grandTotal, settings.currency)}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => valid && onSave({
          customerId: customerId || 'walk-in', customerName: customer?.name ?? 'Walk-in Customer', customerPhone: customer?.phone ?? '', customerAddress: customer?.address, customerGstin: customer?.gstin,
          items, subtotal: totals.subtotal, totalMaking: totals.totalMaking, totalStone: 0, totalOther: 0, totalDiscount: 0, totalGst: 0,
          grandTotal: totals.grandTotal, paidAmount: status === 'PAID' ? totals.grandTotal : amountPaid, dueAmount: status === 'PAID' ? 0 : Math.max(0, totals.grandTotal - amountPaid),
          paymentMode, status, oldGoldAdjustment: oldGoldAdj, branch: settings.branch, billedBy: currentUser?.name ?? 'Admin',
        })} disabled={!valid}>Create Bill</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="font-medium tabular-nums">{value}</span></div>
}

function ViewBillDialog({ sale, onClose, settings }: {
  sale: Sale | null
  onClose: () => void
  settings: ReturnType<typeof useJewelleryStore.getState>['settings']
}) {
  return (
    <Dialog open={!!sale} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {sale && (
          <>
            <DialogHeader><DialogTitle className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><ReceiptIndianRupee className="h-5 w-5 text-primary" />{sale.invoiceNo}</span><StatusBadge status={sale.status} /></DialogTitle><DialogDescription>{formatDateTime(sale.createdAt)} · Billed by {sale.billedBy}</DialogDescription></DialogHeader>
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
                      <p className="text-sm font-semibold tabular-nums">{formatCurrency(it.total, settings.currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 text-sm">
                {sale.oldGoldAdjustment > 0 && (
                  <>
                    <Row label="Sub Total" value={formatCurrency(sale.subtotal, settings.currency)} />
                    <Row label="Old Gold Adj" value={`- ${formatCurrency(sale.oldGoldAdjustment, settings.currency)}`} />
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
                    {formatCurrency(sale.grandTotal, settings.currency)}
                  </span>
                </div>
                {sale.dueAmount > 0 && <div className="flex items-center justify-between text-rose-600 dark:text-rose-400"><span>Due</span><span className="font-medium">{formatCurrency(sale.dueAmount, settings.currency)}</span></div>}
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

function PaymentDialog({ sale, onClose, settings, currentUser, onSave }: {
  sale: Sale
  onClose: () => void
  settings: ReturnType<typeof useJewelleryStore.getState>['settings']
  currentUser: ReturnType<typeof useJewelleryStore.getState>['currentUser']
  onSave: (amount: number, mode: PaymentMode, ref: string) => void
}) {
  const [amount, setAmount] = React.useState(sale.dueAmount)
  const [mode, setMode] = React.useState<PaymentMode>('CASH')
  const [ref, setRef] = React.useState('')

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Record Payment — {sale.invoiceNo}</DialogTitle><DialogDescription>Due: {formatCurrency(sale.dueAmount, settings.currency)}</DialogDescription></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>Amount (₹)</Label><Input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} /></div>
          <div className="space-y-1.5"><Label>Payment Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as PaymentMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {mode !== 'CASH' && <div className="space-y-1.5"><Label>Reference</Label><Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Transaction ID" /></div>}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => amount > 0 && onSave(amount, mode, ref)} disabled={amount <= 0}>Record Payment</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
