'use client'

import * as React from 'react'
import { Plus, Search, Gem, Edit3, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { useJewelleryStore, formatCurrency, formatCompact } from '@/lib/store'
import { type StoneItem } from '@/lib/types'
import { toast } from 'sonner'

export function StoneInventoryView() {
  const { stones, suppliers, settings, addStone, updateStone, deleteStone } = useJewelleryStore()
  const [search, setSearch] = React.useState('')
  const [editing, setEditing] = React.useState<StoneItem | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const filtered = stones.filter((s) => {
    const q = search.trim().toLowerCase()
    return !q || s.type.toLowerCase().includes(q) || s.stoneId.toLowerCase().includes(q) || s.shape.toLowerCase().includes(q)
  })

  const stats = {
    totalValue: stones.reduce((s, x) => s + x.purchaseCost, 0),
    totalCarats: stones.reduce((s, x) => s + x.weight, 0),
    totalQty: stones.reduce((s, x) => s + x.remainingQuantity, 0),
    lowStock: stones.filter((s) => s.remainingQuantity <= 5).length,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Gem className="h-5 w-5 text-primary" /> Stone &amp; Diamond Inventory</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{stones.length} stone types · {stats.totalCarats} carats total</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus className="h-4 w-4 mr-1.5" /> Add Stone</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Total Value</p><p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(stats.totalValue, settings.currency)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Total Carats</p><p className="text-base md:text-lg font-bold mt-0.5">{stats.totalCarats}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Remaining Qty</p><p className="text-base md:text-lg font-bold mt-0.5">{stats.totalQty}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Low Stock</p><p className="text-base md:text-lg font-bold mt-0.5 text-amber-600 dark:text-amber-400">{stats.lowStock}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by type, ID, shape…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </CardContent></Card>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Gem className="h-12 w-12 mx-auto text-muted-foreground/50" /><p className="text-sm text-muted-foreground mt-3">No stones found</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s) => {
            const usedPct = s.quantity > 0 ? (s.usedQuantity / s.quantity) * 100 : 0
            return (
              <Card key={s.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{s.stoneId}</p>
                        <Badge variant="outline" className="text-[10px]">{s.type}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{s.shape} · {s.size}</p>
                      <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                        <div><p className="text-[10px] text-muted-foreground">Quantity</p><p className="font-medium">{s.remainingQuantity}/{s.quantity}</p></div>
                        <div><p className="text-[10px] text-muted-foreground">Weight</p><p className="font-medium">{s.weight} {s.unit}</p></div>
                        <div><p className="text-[10px] text-muted-foreground">Cost</p><p className="font-medium">{formatCompact(s.purchaseCost, settings.currency)}</p></div>
                        <div><p className="text-[10px] text-muted-foreground">Supplier</p><p className="font-medium text-xs truncate">{s.supplierName ?? '-'}</p></div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                          <span>Used</span><span>{usedPct.toFixed(0)}%</span>
                        </div>
                        <Progress value={usedPct} className="h-1" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(s); setDialogOpen(true) }}><Edit3 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <StoneDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} suppliers={suppliers} onSave={(data) => {
        if (editing) { updateStone(editing.id, data); toast.success('Stone updated') }
        else { addStone(data as Omit<StoneItem, 'id' | 'createdAt' | 'remainingQuantity'>); toast.success('Stone added') }
        setDialogOpen(false)
      }} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this stone?</AlertDialogTitle><AlertDialogDescription>The stone record will be removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleteId) { deleteStone(deleteId); toast.success('Stone removed'); setDeleteId(null) } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StoneDialog({ open, onOpenChange, editing, suppliers, onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: StoneItem | null
  suppliers: ReturnType<typeof useJewelleryStore.getState>['suppliers']
  onSave: (data: Partial<StoneItem>) => void
}) {
  const [form, setForm] = React.useState<Partial<StoneItem>>({})

  React.useEffect(() => {
    if (open) setForm(editing ?? { stoneId: '', type: 'Diamond', shape: 'Round', size: '', quantity: 0, weight: 0, unit: 'carat', purchaseCost: 0, usedQuantity: 0 })
  }, [open, editing])

  const update = (patch: Partial<StoneItem>) => setForm((f) => ({ ...f, ...patch }))
  const valid = (form.stoneId?.trim()?.length ?? 0) > 0 && (form.quantity ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? 'Edit Stone' : 'Add Stone'}</DialogTitle><DialogDescription>{editing ? `Editing ${editing.stoneId}` : 'Add a new stone or diamond'}</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5 col-span-2"><Label>Stone ID *</Label><Input value={form.stoneId ?? ''} onChange={(e) => update({ stoneId: e.target.value })} placeholder="DM-001" /></div>
          <div className="space-y-1.5"><Label>Type</Label><Input value={form.type ?? ''} onChange={(e) => update({ type: e.target.value })} placeholder="Diamond / Ruby / Emerald" /></div>
          <div className="space-y-1.5"><Label>Shape</Label><Input value={form.shape ?? ''} onChange={(e) => update({ shape: e.target.value })} placeholder="Round / Oval / Princess" /></div>
          <div className="space-y-1.5"><Label>Size</Label><Input value={form.size ?? ''} onChange={(e) => update({ size: e.target.value })} placeholder="0.3ct / 4x6mm" /></div>
          <div className="space-y-1.5"><Label>Unit</Label><Input value={form.unit ?? 'carat'} onChange={(e) => update({ unit: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Quantity *</Label><Input type="number" value={form.quantity ?? 0} onChange={(e) => update({ quantity: parseInt(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>Weight ({form.unit})</Label><Input type="number" step="0.01" value={form.weight ?? 0} onChange={(e) => update({ weight: parseFloat(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>Purchase Cost (₹)</Label><Input type="number" value={form.purchaseCost ?? 0} onChange={(e) => update({ purchaseCost: parseFloat(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>Used Quantity</Label><Input type="number" value={form.usedQuantity ?? 0} onChange={(e) => update({ usedQuantity: parseInt(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Supplier</Label>
            <Select value={form.supplierId ?? 'none'} onValueChange={(v) => { if (v === 'none') { update({ supplierId: undefined, supplierName: undefined }); return } const sup = suppliers.find((s) => s.id === v); update({ supplierId: v, supplierName: sup?.name }) }}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger><SelectContent><SelectItem value="none">No supplier</SelectItem>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => valid && onSave(form)} disabled={!valid}>{editing ? 'Save Changes' : 'Add Stone'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
