'use client'

import * as React from 'react'
import { Plus, Search, Users, Edit3, Trash2, Phone, Mail, MapPin, ShoppingBag, Calendar, Eye, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useJewelleryStore, formatCurrency, formatDate, formatCompact } from '@/lib/store'
import type { Customer } from '@/lib/types'
import { toast } from 'sonner'

export function CustomersView() {
  const { sales, settings, setCustomers: storeSetCustomers } = useJewelleryStore()
  const storeCustomers = useJewelleryStore((s) => s.customers)
  const [customers, setCustomers] = React.useState<Customer[]>(storeCustomers)
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [editing, setEditing] = React.useState<Customer | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [viewC, setViewC] = React.useState<Customer | null>(null)

  // Fetch customers directly from Next.js API / Supabase DB
  const loadCustomers = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/customers')
      if (res.ok) {
        const data = await res.json()
        if (data.customers) {
          const mapped: Customer[] = data.customers.map((c: any) => ({
            id: c.id,
            customerId: c.customerId,
            name: c.name,
            phone: c.phone,
            email: c.email || undefined,
            address: c.address || undefined,
            city: c.city || undefined,
            pincode: c.pincode || undefined,
            gstin: c.gstin || undefined,
            pan: c.pan || undefined,
            dateOfBirth: c.dateOfBirth ? String(c.dateOfBirth) : undefined,
            anniversary: c.anniversary ? String(c.anniversary) : undefined,
            totalPurchase: Number(c.totalPurchasePaise || 0) / 100,
            totalPaid: Number(c.totalPaidPaise || 0) / 100,
            totalDue: Number(c.totalDuePaise || 0) / 100,
            totalBills: Number(c.totalBills || 0),
            createdAt: c.createdAt,
          }))
          setCustomers(mapped)
          if (storeSetCustomers) storeSetCustomers(mapped)
        }
      }
    } catch (err) {
      console.error('Failed to load customers from API:', err)
    } finally {
      setLoading(false)
    }
  }, [storeSetCustomers])

  React.useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const handleSave = async (data: Partial<Customer>) => {
    try {
      if (editing) {
        const res = await fetch(`/api/customers/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const resData = await res.json()
        if (!res.ok) throw new Error(resData.error || 'Failed to update customer')
        toast.success('Customer updated successfully in database')
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const resData = await res.json()
        if (!res.ok) throw new Error(resData.error || 'Failed to create customer')
        toast.success(`Customer ${resData.customer?.name} created successfully in Supabase`)
      }
      setDialogOpen(false)
      setEditing(null)
      await loadCustomers()
    } catch (err: any) {
      toast.error(err.message || 'Error saving customer')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const resData = await res.json()
        throw new Error(resData.error || 'Failed to delete customer')
      }
      toast.success('Customer removed')
      setDeleteId(null)
      await loadCustomers()
    } catch (err: any) {
      toast.error(err.message || 'Error deleting customer')
    }
  }

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email ?? '').toLowerCase().includes(q)
  })

  const topCustomers = [...customers].sort((a, b) => b.totalPurchase - a.totalPurchase).slice(0, 3)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Customers
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {customers.length} customers · {formatCompact(customers.reduce((s, c) => s + c.totalPurchase, 0), settings.currency)} lifetime value
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadCustomers} disabled={loading} title="Refresh from database">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Customer
          </Button>
        </div>
      </div>

      {topCustomers.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Top Customers</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {topCustomers.map((c, idx) => (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                  <div className="h-8 w-8 rounded-full bg-gold-gradient text-white text-xs font-bold flex items-center justify-center shrink-0">#{idx + 1}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatCompact(c.totalPurchase, settings.currency)} · {c.totalBills} bills</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search by name, phone, email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mt-3">{loading ? 'Loading customers from database...' : 'No customers found'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewC(c)}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                    {c.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground">{c.customerId}</p>
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setViewC(c) }}><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setEditing(c); setDialogOpen(true) }}><Edit3 className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(c.id) }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate"><Phone className="h-2.5 w-2.5" />{c.phone}</p>
                    {c.city && <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate"><MapPin className="h-2.5 w-2.5" />{c.city}</p>}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Total Purchase</p>
                        <p className="text-sm font-semibold">{formatCompact(c.totalPurchase, settings.currency)}</p>
                      </div>
                      {c.totalDue > 0 ? (
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">Due</p>
                          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{formatCompact(c.totalDue, settings.currency)}</p>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]"><ShoppingBag className="h-2.5 w-2.5 mr-1" />{c.totalBills} bills</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CustomerDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSave={handleSave} />

      <Dialog open={!!viewC} onOpenChange={(o) => !o && setViewC(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {viewC && (() => {
            const customerSales = sales.filter((s) => s.customerId === viewC.id)
            const salesGram = customerSales.reduce((acc, s) => acc + s.items.reduce((sum, it) => sum + (it.netWeight || it.grossWeight || 0) * it.quantity, 0), 0)
            const fallbackRate = settings.defaultGoldRate24K || 7250
            const totalPurchaseGrams = salesGram > 0 ? salesGram : (viewC.totalPurchase > 0 ? viewC.totalPurchase / fallbackRate : 0)

            const totalGrand = customerSales.reduce((acc, s) => acc + s.grandTotal, 0)
            const totalPaidAmount = customerSales.reduce((acc, s) => acc + s.paidAmount, 0)
            const paidRatio = totalGrand > 0 ? (totalPaidAmount / totalGrand) : (viewC.totalPurchase > 0 ? (viewC.totalPaid / viewC.totalPurchase) : 1)
            const paidGrams = totalPurchaseGrams * Math.min(1, Math.max(0, paidRatio))
            const dueGrams = Math.max(0, totalPurchaseGrams - paidGrams)

            const totalMakingCharges = customerSales.reduce((acc, s) => acc + (s.totalMaking || s.items.reduce((m, it) => m + (it.makingAmount || 0) * it.quantity, 0)), 0)

            return (
              <>
                <DialogHeader>
                  <DialogTitle>{viewC.name}</DialogTitle>
                  <DialogDescription>Customer since {formatDate(viewC.createdAt)}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-muted/40 rounded-lg p-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Purchase</p>
                        <p className="text-sm font-bold tabular-nums">{totalPurchaseGrams.toFixed(2)} g</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Paid</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{paidGrams.toFixed(2)} g</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Due</p>
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">{dueGrams.toFixed(2)} g</p>
                      </div>
                    </div>
                    {totalMakingCharges > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-muted/40 rounded-lg p-2 col-span-1">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Making Charges</p>
                          <p className="text-sm font-bold text-primary tabular-nums">{formatCurrency(totalMakingCharges, settings.currency)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{viewC.phone}</div>
                    {viewC.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{viewC.email}</div>}
                    {viewC.address && <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" /><span>{viewC.address}{viewC.city ? `, ${viewC.city}` : ''}{viewC.pincode ? ` - ${viewC.pincode}` : ''}</span></div>}
                    {viewC.dateOfBirth && <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />DOB: {formatDate(viewC.dateOfBirth)}</div>}
                    {viewC.gstin && <p className="text-xs text-muted-foreground">GSTIN: {viewC.gstin}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Recent Bills</p>
                    {customerSales.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0 text-sm">
                        <div>
                          <p className="font-medium">{s.invoiceNo}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDate(s.createdAt)} · {s.items.reduce((sum, it) => sum + (it.netWeight || it.grossWeight || 0) * it.quantity, 0).toFixed(2)}g
                          </p>
                        </div>
                        <span className="font-semibold tabular-nums">{formatCurrency(s.grandTotal, settings.currency)}</span>
                      </div>
                    ))}
                    {customerSales.length === 0 && <p className="text-xs text-muted-foreground py-2">No bills yet</p>}
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this customer?</AlertDialogTitle>
            <AlertDialogDescription>The customer record will be removed from the database.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CustomerDialog({ open, onOpenChange, editing, onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: Customer | null
  onSave: (data: Partial<Customer>) => void
}) {
  const [form, setForm] = React.useState<Partial<Customer>>({})

  React.useEffect(() => {
    if (open) setForm(editing ?? { name: '', phone: '', email: '', address: '', city: '', pincode: '', gstin: '', pan: '', dateOfBirth: '', anniversary: '' })
  }, [open, editing])

  const update = (patch: Partial<Customer>) => setForm((f) => ({ ...f, ...patch }))
  const valid = (form.name?.trim()?.length ?? 0) > 0 && (form.phone?.trim()?.length ?? 0) >= 10

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5 col-span-2"><Label>Name *</Label><Input value={form.name ?? ''} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Rahul Sharma" /></div>
          <div className="space-y-1.5"><Label>Phone (10 digits) *</Label><Input value={form.phone ?? ''} onChange={(e) => update({ phone: e.target.value })} placeholder="e.g. 9825012345" /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email ?? ''} onChange={(e) => update({ email: e.target.value })} placeholder="e.g. rahul@example.com" /></div>
          <div className="space-y-1.5 col-span-2"><Label>Address</Label><Input value={form.address ?? ''} onChange={(e) => update({ address: e.target.value })} placeholder="e.g. 102 Crystal Tower" /></div>
          <div className="space-y-1.5"><Label>City</Label><Input value={form.city ?? ''} onChange={(e) => update({ city: e.target.value })} placeholder="e.g. Surat" /></div>
          <div className="space-y-1.5"><Label>Pincode</Label><Input value={form.pincode ?? ''} onChange={(e) => update({ pincode: e.target.value })} placeholder="e.g. 395003" /></div>
          <div className="space-y-1.5"><Label>GSTIN</Label><Input value={form.gstin ?? ''} onChange={(e) => update({ gstin: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>PAN</Label><Input value={form.pan ?? ''} onChange={(e) => update({ pan: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth ? form.dateOfBirth.slice(0, 10) : ''} onChange={(e) => update({ dateOfBirth: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Anniversary</Label><Input type="date" value={form.anniversary ? form.anniversary.slice(0, 10) : ''} onChange={(e) => update({ anniversary: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => valid && onSave(form)} disabled={!valid}>{editing ? 'Save Changes' : 'Add Customer'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
