'use client'

import * as React from 'react'
import { Plus, Search, Truck, Eye, Trash2, Edit3, Phone, Mail, MapPin, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatCompact, formatCurrency } from '@/lib/store'
import {
  useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, useSettings,
} from '@/lib/hooks/use-erp-queries'
import type { Supplier } from '@/lib/types'
import { toast } from 'sonner'

export function SuppliersView() {
  const { data: supplierData, isLoading: loading, refetch: loadSuppliers } = useSuppliers()
  const { data: settingsData } = useSettings()

  const createSupplierMutation = useCreateSupplier()
  const updateSupplierMutation = useUpdateSupplier()
  const deleteSupplierMutation = useDeleteSupplier()

  const currency = settingsData?.settings?.currency || '₹'

  const suppliers: Supplier[] = (supplierData?.suppliers || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    companyName: s.category || s.companyName,
    phone: s.phone,
    email: s.email || undefined,
    address: s.address || undefined,
    city: s.city || undefined,
    pincode: s.pincode || undefined,
    gstin: s.gstin || undefined,
    pan: s.pan || undefined,
    category: s.category || undefined,
    openingBalance: Number(s.openingBalancePaise || 0) / 100,
    totalPurchase: Number(s.totalPurchasesPaise || 0) / 100,
    totalPaid: Number(s.totalPaidPaise || 0) / 100,
    active: s.active !== undefined ? s.active : true,
    createdAt: s.createdAt,
  }))

  const [search, setSearch] = React.useState('')
  const [editing, setEditing] = React.useState<Supplier | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const isSaving = createSupplierMutation.isPending || updateSupplierMutation.isPending
  const isDeleting = deleteSupplierMutation.isPending

  const handleSave = async (data: Partial<Supplier>) => {
    try {
      if (editing) {
        await updateSupplierMutation.mutateAsync({ id: editing.id, data })
        toast.success('Supplier updated successfully')
      } else {
        await createSupplierMutation.mutateAsync(data)
        toast.success('Supplier created successfully')
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

  const filtered = suppliers.filter((s) => {
    const q = search.trim().toLowerCase()
    return !q || s.name.toLowerCase().includes(q) || s.phone.includes(q) || (s.gstin ?? '').toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Suppliers</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{suppliers.length} suppliers · {formatCompact(suppliers.reduce((s, x) => s + x.totalPurchase, 0), currency)} total purchase</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => loadSuppliers()} disabled={loading} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus className="h-4 w-4 mr-1.5" /> Add Supplier</Button>
        </div>
      </div>

      <Card><CardContent className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search suppliers by name, phone, GSTIN…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </CardContent></Card>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Truck className="h-12 w-12 mx-auto text-muted-foreground/50" /><p className="text-sm text-muted-foreground mt-3">{loading ? 'Loading suppliers...' : 'No suppliers found'}</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{s.name}</p>
                    {s.companyName && <p className="text-[11px] text-muted-foreground">{s.companyName}</p>}
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{s.phone}</p>
                    {s.email && <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Mail className="h-2.5 w-2.5" />{s.email}</p>}
                    {s.address && <p className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{s.address}</p>}
                    {s.gstin && <p className="text-[11px] text-muted-foreground mt-1">GSTIN: {s.gstin}</p>}
                    <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-border text-xs">
                      <div><p className="text-[10px] text-muted-foreground">Total Purchase</p><p className="font-medium">{formatCompact(s.totalPurchase, currency)}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Due</p><p className="font-medium text-rose-600 dark:text-rose-400">{formatCurrency(s.totalPurchase - s.totalPaid, currency)}</p></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(s); setDialogOpen(true) }}><Edit3 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SupplierDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSave={handleSave} isSaving={isSaving} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this supplier?</AlertDialogTitle><AlertDialogDescription>The supplier record will be removed from the database.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) handleDelete(deleteId) }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SupplierDialog({ open, onOpenChange, editing, onSave, isSaving }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: Supplier | null
  onSave: (data: Partial<Supplier>) => void
  isSaving?: boolean
}) {
  const [form, setForm] = React.useState<Partial<Supplier>>({})

  React.useEffect(() => {
    if (open) setForm(editing ?? { name: '', companyName: '', phone: '', email: '', address: '', gstin: '', pan: '', openingBalance: 0 })
  }, [open, editing])

  const update = (patch: Partial<Supplier>) => setForm((f) => ({ ...f, ...patch }))
  const valid = (form.name?.trim()?.length ?? 0) > 0 && (form.phone?.trim()?.length ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle><DialogDescription>{editing ? `Editing ${editing.name}` : 'Register a new supplier'}</DialogDescription></DialogHeader>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => valid && onSave(form)} disabled={!valid || isSaving}>
            {isSaving ? 'Saving...' : editing ? 'Save Changes' : 'Add Supplier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
