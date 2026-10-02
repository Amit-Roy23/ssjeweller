'use client'

import * as React from 'react'
import { Plus, Search, ShoppingCart, Eye, Trash2, Truck, Loader2 } from 'lucide-react'
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
import { formatCurrency, formatCompact, formatDate } from '@/lib/store'
import { MATERIAL_OPTIONS, type Purchase, type PurchaseItem, type MaterialType, type Supplier } from '@/lib/types'
import { StatusBadge } from './status-badge'
import {
  usePurchases,
  useCreatePurchase,
  useCancelPurchase,
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  useSettings,
  useAuthMe,
} from '@/lib/hooks/use-erp-queries'
import { toast } from 'sonner'

export function PurchaseView() {
  const { data: purchasesData, isLoading: loadingPurchases } = usePurchases()
  const { data: suppliersData } = useSuppliers()
  const { data: settingsData } = useSettings()
  const { data: authData } = useAuthMe()

  const createPurchaseMutation = useCreatePurchase()
  const cancelPurchaseMutation = useCancelPurchase()

  const currency = settingsData?.settings?.currency || '₹'
  const currentUser = authData?.user
  const suppliers = (suppliersData?.suppliers || []) as any[]

  const purchases: Purchase[] = (purchasesData?.purchases || []).map((p: any) => ({
    id: p.id,
    purchaseId: p.purchaseNumber || p.purchaseId || p.id,
    supplierId: p.supplierId,
    supplierName: p.supplierName || p.supplier?.name || 'Unknown',
    invoiceNumber: p.invoiceNumber,
    purchaseDate: String(p.purchaseDate),
    subtotal: Number(p.subtotalPaise || 0) / 100,
    totalTax: Number(p.totalTaxPaise || 0) / 100,
    grandTotal: Number(p.grandTotalPaise || 0) / 100,
    paidAmount: Number(p.paidAmountPaise || 0) / 100,
    paymentStatus: p.paymentStatus,
    items: (p.items || []).map((it: any) => ({
      materialType: it.materialType,
      description: it.description,
      purity: it.purity,
      grossWeight: Number(it.grossWeightMg || 0) / 1000,
      netWeight: Number(it.netWeightMg || 0) / 1000,
      rate: Number(it.ratePaisePerGram || 0) / 100,
      makingCharges: Number(it.makingChargesPaise || 0) / 100,
      tax: Number(it.taxPaise || 0) / 100,
      total: Number(it.totalPaise || 0) / 100,
    })),
    notes: p.notes || undefined,
    performedBy: p.performedBy?.name || 'Admin',
    createdAt: p.createdAt,
  }))

  const [tab, setTab] = React.useState<'purchases' | 'suppliers'>('purchases')
  const [search, setSearch] = React.useState('')
  const [newOpen, setNewOpen] = React.useState(false)
  const [viewP, setViewP] = React.useState<Purchase | null>(null)
  const [cancelId, setCancelId] = React.useState<string | null>(null)
  const [cancelReason, setCancelReason] = React.useState('Order cancelled')

  const isCancelling = cancelPurchaseMutation.isPending

  const filtered = purchases.filter((p) => {
    const q = search.trim().toLowerCase()
    return !q || p.purchaseId.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q) || p.invoiceNumber.toLowerCase().includes(q)
  })

  const stats = {
    today: purchases.filter((p) => new Date(p.purchaseDate) >= new Date(new Date().setHours(0, 0, 0, 0))).reduce((s, p) => s + p.grandTotal, 0),
    month: purchases.filter((p) => new Date(p.purchaseDate) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).reduce((s, p) => s + p.grandTotal, 0),
    total: purchases.reduce((s, p) => s + p.grandTotal, 0),
    due: purchases.reduce((s, p) => s + (p.grandTotal - p.paidAmount), 0),
  }

  const handleCancelPurchase = async () => {
    if (!cancelId) return
    try {
      await cancelPurchaseMutation.mutateAsync({ id: cancelId, reason: cancelReason })
      toast.success('Purchase cancelled successfully')
      setCancelId(null)
    } catch (err: any) {
      toast.error(err.message || 'Error cancelling purchase')
    }
  }

  const handleCreatePurchase = async (data: any) => {
    try {
      const payload = {
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        invoiceNumber: data.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
        purchaseDate: data.purchaseDate || new Date().toISOString(),
        paidAmountPaise: Math.round((data.paidAmount || 0) * 100),
        notes: data.notes || '',
        items: data.items.map((it: any) => ({
          materialType: it.materialType,
          description: it.description,
          purity: it.purity,
          grossWeightMg: Math.round((it.grossWeight || 0) * 1000),
          netWeightMg: Math.round((it.netWeight || 0) * 1000),
          ratePaisePerGram: Math.round((it.rate || 0) * 100),
          makingChargesPaise: Math.round((it.makingCharges || 0) * 100),
          taxPaise: Math.round((it.tax || 0) * 100),
        })),
      }
      const res = await createPurchaseMutation.mutateAsync(payload)
      toast.success(`Purchase ${res.purchase?.purchaseNumber || 'created'} successfully`)
      setNewOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create purchase')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" /> Purchase Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{purchases.length} purchases · {formatCompact(stats.month, currency)} this month</p>
        </div>
        <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New Purchase</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Today&apos;s Purchase</p><p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(stats.today, currency)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">This Month</p><p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(stats.month, currency)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Total Purchase</p><p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(stats.total, currency)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Due to Suppliers</p><p className="text-base md:text-lg font-bold mt-0.5 text-rose-600 dark:text-rose-400">{formatCompact(stats.due, currency)}</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'purchases' | 'suppliers')}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-3 mt-3">
          <Card><CardContent className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search purchase ID, supplier, invoice…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardContent></Card>

          {loadingPurchases ? (
            <Card><CardContent className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /><p className="text-sm text-muted-foreground mt-2">Loading purchases...</p></CardContent></Card>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50" /><p className="text-sm text-muted-foreground mt-3">No purchases found</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{p.purchaseId}</p>
                          <StatusBadge status={p.paymentStatus} />
                        </div>
                        <p className="text-sm mt-0.5">{p.supplierName}</p>
                        <p className="text-[11px] text-muted-foreground">Invoice: {p.invoiceNumber} · {formatDate(p.purchaseDate)} · {p.items.length} item(s)</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold">{formatCurrency(p.grandTotal, currency)}</p>
                        {p.paymentStatus !== 'PAID' && <p className="text-[10px] text-rose-600 dark:text-rose-400">Due: {formatCurrency(p.grandTotal - p.paidAmount, currency)}</p>}
                        <div className="flex justify-end gap-1 mt-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewP(p)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setCancelId(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="suppliers" className="mt-3">
          <SuppliersTab />
        </TabsContent>
      </Tabs>

      <NewPurchaseDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        suppliers={suppliers}
        currency={currency}
        isSaving={createPurchaseMutation.isPending}
        onSave={handleCreatePurchase}
      />

      {/* View purchase */}
      <Dialog open={!!viewP} onOpenChange={(o) => !o && setViewP(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewP && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">{viewP.purchaseId} <StatusBadge status={viewP.paymentStatus} /></DialogTitle>
                <DialogDescription>{viewP.supplierName} · {formatDate(viewP.purchaseDate)}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="border border-border rounded-lg overflow-hidden">
                  {viewP.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border-b border-border last:border-0 text-sm">
                      <div><p className="font-medium">{it.description}</p><p className="text-[11px] text-muted-foreground">{it.materialType.replace(/_/g, ' ')} · {it.purity} · {it.grossWeight}g</p></div>
                      <p className="font-semibold tabular-nums">{formatCurrency(it.total, currency)}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatCurrency(viewP.subtotal, currency)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="font-medium">{formatCurrency(viewP.totalTax, currency)}</span></div>
                  <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="font-semibold">Grand Total</span><span className="text-lg font-bold text-primary">{formatCurrency(viewP.grandTotal, currency)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(viewP.paidAmount, currency)}</span></div>
                  {viewP.grandTotal - viewP.paidAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Due</span><span className="font-medium text-rose-600 dark:text-rose-400">{formatCurrency(viewP.grandTotal - viewP.paidAmount, currency)}</span></div>}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this purchase?</AlertDialogTitle>
            <AlertDialogDescription>The purchase invoice will be marked as cancelled.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>Cancellation Reason</Label>
            <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelPurchase}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Cancel Purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SuppliersTab() {
  const { data: suppliersData, isLoading: loading } = useSuppliers()
  const { data: settingsData } = useSettings()

  const createSupplierMutation = useCreateSupplier()
  const updateSupplierMutation = useUpdateSupplier()
  const deleteSupplierMutation = useDeleteSupplier()

  const currency = settingsData?.settings?.currency || '₹'
  const suppliers: Supplier[] = (suppliersData?.suppliers || []).map((s: any) => ({
    id: s.id,
    supplierId: s.supplierCode || s.supplierId || s.id,
    name: s.name,
    companyName: s.companyName || undefined,
    phone: s.phone,
    email: s.email || undefined,
    address: s.address || undefined,
    gstin: s.gstin || undefined,
    pan: s.pan || undefined,
    openingBalance: Number(s.openingBalancePaise || 0) / 100,
    totalPurchase: Number(s.totalPurchasePaise || 0) / 100,
    totalPaid: Number(s.totalPaidPaise || 0) / 100,
    createdAt: s.createdAt,
  }))

  const [search, setSearch] = React.useState('')
  const [editing, setEditing] = React.useState<Supplier | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const isSaving = createSupplierMutation.isPending || updateSupplierMutation.isPending
  const isDeleting = deleteSupplierMutation.isPending

  const filtered = suppliers.filter((s) => {
    const q = search.trim().toLowerCase()
    return !q || s.name.toLowerCase().includes(q) || s.phone.includes(q) || (s.gstin ?? '').toLowerCase().includes(q)
  })

  const handleSave = async (data: Partial<Supplier>) => {
    try {
      if (editing) {
        await updateSupplierMutation.mutateAsync({ id: editing.id, data })
        toast.success('Supplier updated successfully')
      } else {
        await createSupplierMutation.mutateAsync(data)
        toast.success('Supplier added successfully')
      }
      setDialogOpen(false)
      setEditing(null)
    } catch (err: any) {
      toast.error(err.message || 'Error saving supplier')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteSupplierMutation.mutateAsync(id)
      toast.success('Supplier removed successfully')
      setDeleteId(null)
    } catch (err: any) {
      toast.error(err.message || 'Error deleting supplier')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search suppliers…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus className="h-4 w-4 mr-1.5" /> Add Supplier</Button>
      </div>

      {loading ? (
        <Card><CardContent className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /><p className="text-sm text-muted-foreground mt-2">Loading suppliers...</p></CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Truck className="h-12 w-12 mx-auto text-muted-foreground/50" /><p className="text-sm text-muted-foreground mt-3">No suppliers found</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{s.name}</p>
                    {s.companyName && <p className="text-[11px] text-muted-foreground">{s.companyName}</p>}
                    <p className="text-[11px] text-muted-foreground mt-0.5">{s.phone}{s.email && ` · ${s.email}`}</p>
                    {s.gstin && <p className="text-[11px] text-muted-foreground">GSTIN: {s.gstin}</p>}
                    <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-border text-xs">
                      <div><p className="text-[10px] text-muted-foreground">Total Purchase</p><p className="font-medium">{formatCompact(s.totalPurchase, currency)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Due</p><p className="font-medium text-rose-600 dark:text-rose-400">{formatCompact(s.totalPurchase - s.totalPaid, currency)}</p></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(s); setDialogOpen(true) }}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        isSaving={isSaving}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this supplier?</AlertDialogTitle>
            <AlertDialogDescription>The supplier record will be removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SupplierDialog({ open, onOpenChange, editing, isSaving, onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: Supplier | null
  isSaving: boolean
  onSave: (data: any) => void
}) {
  const [form, setForm] = React.useState<any>({})

  React.useEffect(() => {
    if (open) setForm(editing ?? { name: '', companyName: '', phone: '', email: '', address: '', gstin: '', pan: '', openingBalance: 0 })
  }, [open, editing])

  const update = (patch: any) => setForm((f: any) => ({ ...f, ...patch }))
  const valid = (form.name?.trim()?.length ?? 0) > 0 && (form.phone?.trim()?.length ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5 col-span-2"><Label>Name *</Label><Input value={form.name ?? ''} onChange={(e) => update({ name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Company Name</Label><Input value={form.companyName ?? ''} onChange={(e) => update({ companyName: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Phone *</Label><Input value={form.phone ?? ''} onChange={(e) => update({ phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email ?? ''} onChange={(e) => update({ email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>GSTIN</Label><Input value={form.gstin ?? ''} onChange={(e) => update({ gstin: e.target.value })} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Address</Label><Input value={form.address ?? ''} onChange={(e) => update({ address: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>PAN</Label><Input value={form.pan ?? ''} onChange={(e) => update({ pan: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Opening Balance (₹)</Label><Input type="number" value={form.openingBalance ?? 0} onChange={(e) => update({ openingBalance: parseFloat(e.target.value) || 0 })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={() => valid && onSave(form)} disabled={!valid || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {editing ? 'Save Changes' : 'Add Supplier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NewPurchaseDialog({ open, onOpenChange, suppliers, currency, isSaving, onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  suppliers: any[]
  currency: string
  isSaving: boolean
  onSave: (data: any) => void
}) {
  const [supplierId, setSupplierId] = React.useState('')
  const [invoiceNumber, setInvoiceNumber] = React.useState('')
  const [purchaseDate, setPurchaseDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [items, setItems] = React.useState<PurchaseItem[]>([])
  const [paidAmount, setPaidAmount] = React.useState(0)
  const [notes, setNotes] = React.useState('')

  React.useEffect(() => {
    if (open) { setSupplierId(suppliers[0]?.id || ''); setInvoiceNumber(`INV-${Date.now().toString().slice(-4)}`); setPurchaseDate(new Date().toISOString().slice(0, 10)); setItems([]); setPaidAmount(0); setNotes('') }
  }, [open, suppliers])

  const supplier = suppliers.find((s) => s.id === supplierId)
  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const grandTotal = subtotal

  const addItem = () => setItems((arr) => [...arr, { materialType: 'GOLD_BAR', description: 'Raw Gold', purity: '22K', grossWeight: 10, netWeight: 10, rate: 7000, makingCharges: 0, tax: 0, total: 70000 }])
  const updateItem = (i: number, patch: Partial<PurchaseItem>) => setItems((arr) => arr.map((it, idx) => {
    if (idx !== i) return it
    const updated = { ...it, ...patch }
    updated.total = (updated.rate * (updated.netWeight || updated.grossWeight || 0)) + (updated.makingCharges || 0) + (updated.tax || 0)
    return updated
  }))
  const removeItem = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i))

  const valid = !!supplier && items.length > 0 && items.every((i) => i.description.trim() && i.grossWeight > 0)

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Purchase</DialogTitle><DialogDescription>Record gold/material purchase from supplier</DialogDescription></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-1"><Label>Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger><SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1.5"><Label>Invoice Number</Label><Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Supplier invoice no" /></div>
            <div className="space-y-1.5"><Label>Purchase Date</Label><Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} /></div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label>Items</Label><Button variant="outline" size="sm" className="h-7 text-xs" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add Item</Button></div>
            {items.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center bg-muted/30 rounded-md">No items added yet</p> : (
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-1 p-2 rounded-lg border border-border text-xs">
                    <Select value={it.materialType} onValueChange={(v) => updateItem(i, { materialType: v as MaterialType })}>
                      <SelectTrigger className="col-span-3 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{MATERIAL_OPTIONS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input className="col-span-4 h-8" placeholder="Description" value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} />
                    <Input className="col-span-2 h-8" placeholder="Purity" value={it.purity} onChange={(e) => updateItem(i, { purity: e.target.value })} />
                    <Input className="col-span-2 h-8" type="number" step="0.001" placeholder="Gross g" value={it.grossWeight || ''} onChange={(e) => updateItem(i, { grossWeight: parseFloat(e.target.value) || 0, netWeight: parseFloat(e.target.value) || 0 })} />
                    <Input className="col-span-2 h-8" type="number" placeholder="Rate/g" value={it.rate || ''} onChange={(e) => updateItem(i, { rate: parseFloat(e.target.value) || 0 })} />
                    <Input className="col-span-2 h-8" type="number" placeholder="Making" value={it.makingCharges || ''} onChange={(e) => updateItem(i, { makingCharges: parseFloat(e.target.value) || 0 })} />
                    <div className="col-span-3 flex items-center justify-between">
                      <span className="font-semibold tabular-nums">{formatCurrency(it.total, currency)}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(i)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Paid Amount (₹)</Label><Input type="number" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} /></div>
          </div>

          <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatCurrency(subtotal, currency)}</span></div>
            <div className="flex justify-between border-t border-border pt-1"><span className="font-semibold">Grand Total</span><span className="text-lg font-bold text-primary">{formatCurrency(grandTotal, currency)}</span></div>
            {grandTotal - paidAmount > 0 && <div className="flex justify-between text-rose-600 dark:text-rose-400"><span>Due</span><span className="font-medium">{formatCurrency(grandTotal - paidAmount, currency)}</span></div>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={() => valid && onSave({
            supplierId, supplierName: supplier?.name ?? '', invoiceNumber, purchaseDate,
            items, subtotal, totalTax: 0, grandTotal, paidAmount, notes,
          })} disabled={!valid || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Create Purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
