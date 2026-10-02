'use client'

import * as React from 'react'
import {
  Plus, Search, Coins, Edit3, Trash2, ArrowRightLeft, Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import { METAL_OPTIONS, MATERIAL_OPTIONS, type GoldStock, type MaterialType, type MetalType } from '@/lib/types'
import { StatusBadge } from './status-badge'
import {
  useGoldStock,
  useAddGoldStock,
  useUpdateGoldStock,
  useDeleteGoldStock,
  useMovements,
  useWastageRecords,
  useSuppliers,
  usePurities,
  useSettings,
  useAuthMe,
  useAdjustStock,
} from '@/lib/hooks/use-erp-queries'
import { toast } from 'sonner'

export function GoldInventoryView() {
  const { data: goldData, isLoading: loading } = useGoldStock()
  const { data: movementsData } = useMovements()
  const { data: wastagesData } = useWastageRecords()
  const { data: suppliersData } = useSuppliers()
  const { data: puritiesData } = usePurities()
  const { data: settingsData } = useSettings()
  const { data: authData } = useAuthMe()

  const addGoldMutation = useAddGoldStock()
  const updateGoldMutation = useUpdateGoldStock()
  const deleteGoldMutation = useDeleteGoldStock()
  const adjustStockMutation = useAdjustStock()

  const currency = settingsData?.settings?.currency || '₹'
  const defaultGoldRate = Number(settingsData?.settings?.defaultGoldRate24K || 7200)
  const suppliers = (suppliersData?.suppliers || []) as any[]
  const purities = (puritiesData?.purities || []) as any[]
  const stockMovements = (movementsData?.movements || []) as any[]
  const wastageRecords = (wastagesData?.wastages || []) as any[]
  const currentUser = authData?.user

  const goldStock: GoldStock[] = (goldData?.goldStocks || []).map((g: any) => ({
    id: g.id,
    stockId: g.stockId,
    materialType: g.materialType,
    metal: g.metal,
    purity: g.purity,
    karat: g.karat || g.purity,
    grossWeight: Number(g.grossWeightMg || 0) / 1000,
    fineGoldWeight: Number(g.fineGoldWeightMg || 0) / 1000,
    supplierId: g.supplierId || undefined,
    supplierName: g.supplier?.name || undefined,
    purchaseDate: g.purchaseDate ? String(g.purchaseDate) : new Date().toISOString(),
    purchaseRate: Number(g.purchaseRatePaisePerGram || 0) / 100,
    purchaseValue: Number(g.purchaseValuePaise || 0) / 100,
    currentLocation: g.currentLocation || 'Vault A',
    status: g.status || 'AVAILABLE',
    referenceNumber: g.referenceNumber || undefined,
    createdAt: g.createdAt,
  }))

  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('ALL')
  const [editing, setEditing] = React.useState<GoldStock | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [moveOpen, setMoveOpen] = React.useState<GoldStock | null>(null)

  const isSaving = addGoldMutation.isPending || updateGoldMutation.isPending
  const isDeleting = deleteGoldMutation.isPending

  const filtered = React.useMemo(() => {
    return goldStock.filter((g) => {
      const q = search.trim().toLowerCase()
      const matchQ = !q || g.stockId.toLowerCase().includes(q) || (g.supplierName ?? '').toLowerCase().includes(q) || (g.referenceNumber ?? '').toLowerCase().includes(q)
      const matchS = statusFilter === 'ALL' || g.status === statusFilter
      return matchQ && matchS
    })
  }, [goldStock, search, statusFilter])

  const stats = React.useMemo(() => {
    const available = goldStock.filter((g) => g.status === 'AVAILABLE')
    const inProd = goldStock.filter((g) => g.status === 'IN_PRODUCTION')
    return {
      totalGross: available.reduce((s, g) => s + g.grossWeight, 0),
      totalFine: available.reduce((s, g) => s + g.fineGoldWeight, 0),
      totalValue: available.reduce((s, g) => s + g.purchaseValue, 0),
      inProdWeight: inProd.reduce((s, g) => s + g.grossWeight, 0),
    }
  }, [goldStock])

  const openAdd = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (g: GoldStock) => { setEditing(g); setDialogOpen(true) }

  const handleSave = async (data: Partial<GoldStock>) => {
    try {
      const payload = {
        stockId: data.stockId,
        materialType: data.materialType || 'GOLD_BAR',
        metal: data.metal || 'GOLD',
        purity: data.purity || '22K',
        karat: data.karat || data.purity || '22K',
        grossWeightMg: Math.round((data.grossWeight || 0) * 1000),
        fineGoldWeightMg: Math.round((data.fineGoldWeight || 0) * 1000),
        supplierId: data.supplierId || null,
        purchaseDate: data.purchaseDate || new Date().toISOString(),
        purchaseRatePaisePerGram: Math.round((data.purchaseRate || 0) * 100),
        purchaseValuePaise: Math.round((data.purchaseValue || 0) * 100),
        currentLocation: data.currentLocation || 'Vault A',
        status: data.status || 'AVAILABLE',
        referenceNumber: data.referenceNumber || null,
      }

      if (editing) {
        await updateGoldMutation.mutateAsync({ id: editing.id, data: payload })
        toast.success('Gold stock updated successfully')
      } else {
        await addGoldMutation.mutateAsync(payload)
        toast.success('Gold stock added successfully')
      }
      setDialogOpen(false)
      setEditing(null)
    } catch (err: any) {
      toast.error(err.message || 'Error saving gold stock')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteGoldMutation.mutateAsync(deleteId)
      toast.success('Gold stock removed successfully')
      setDeleteId(null)
    } catch (err: any) {
      toast.error(err.message || 'Error deleting gold stock')
    }
  }

  const handleMovement = async (from: string, to: string, reason: string, remarks: string) => {
    if (!moveOpen) return
    try {
      await adjustStockMutation.mutateAsync({
        itemType: 'GOLD',
        itemId: moveOpen.id,
        adjustmentType: 'TRANSFER',
        quantity: 0,
        weightMg: Math.round(moveOpen.grossWeight * 1000),
        reason: `${reason}: ${remarks || 'Transferred from ' + from + ' to ' + to}`,
      })
      await updateGoldMutation.mutateAsync({
        id: moveOpen.id,
        data: { currentLocation: to },
      })
      toast.success('Movement recorded successfully')
      setMoveOpen(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to record movement')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Coins className="h-5 w-5 text-primary" /> Gold &amp; Raw Material</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{goldStock.length} stock entries · {stats.totalGross.toFixed(1)}g available</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" /> Add Stock</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">Available Gross</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{stats.totalGross.toFixed(2)}g</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">Fine Gold</p>
          <p className="text-base md:text-lg font-bold mt-0.5 text-primary">{stats.totalFine.toFixed(2)}g</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">Stock Value</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(stats.totalValue, currency)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">In Production</p>
          <p className="text-base md:text-lg font-bold mt-0.5 text-amber-600 dark:text-amber-400">{stats.inProdWeight.toFixed(2)}g</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="stock">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="wastage">Wastage</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-3 mt-3">
          {/* Filters */}
          <Card><CardContent className="p-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search stock ID, supplier, ref…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="IN_PRODUCTION">In Production</SelectItem>
                  <SelectItem value="USED">Used</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent></Card>

          {loading ? (
            <Card><CardContent className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /><p className="text-sm text-muted-foreground mt-2">Loading gold inventory...</p></CardContent></Card>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><Coins className="h-12 w-12 mx-auto text-muted-foreground/50" /><p className="text-sm text-muted-foreground mt-3">No stock entries</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((g) => (
                <Card key={g.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{g.stockId}</p>
                          <StatusBadge status={g.status} />
                          <Badge variant="outline" className="text-[10px]">{g.materialType.replace(/_/g, ' ')}</Badge>
                          <Badge variant="outline" className="text-[10px]">{g.purity}</Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                          <div><p className="text-[10px] text-muted-foreground">Gross</p><p className="font-medium tabular-nums">{g.grossWeight.toFixed(2)}g</p></div>
                          <div><p className="text-[10px] text-muted-foreground">Fine Gold</p><p className="font-medium tabular-nums text-primary">{g.fineGoldWeight.toFixed(2)}g</p></div>
                          <div><p className="text-[10px] text-muted-foreground">Rate/g</p><p className="font-medium tabular-nums">{formatCurrency(g.purchaseRate, currency)}</p></div>
                          <div><p className="text-[10px] text-muted-foreground">Value</p><p className="font-medium tabular-nums">{formatCurrency(g.purchaseValue, currency)}</p></div>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {g.supplierName ?? 'Direct Purchase'} · {formatDate(g.purchaseDate)} · Location: {g.currentLocation}
                          {g.referenceNumber && ` · Ref: ${g.referenceNumber}`}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMoveOpen(g)}><ArrowRightLeft className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(g)}><Edit3 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(g.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="movements" className="mt-3">
          <Card><CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Item</th>
                    <th className="text-left font-medium px-3 py-2">From → To</th>
                    <th className="text-right font-medium px-3 py-2">Weight</th>
                    <th className="text-left font-medium px-3 py-2">Reason</th>
                    <th className="text-left font-medium px-3 py-2">By</th>
                    <th className="text-left font-medium px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stockMovements.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No movements recorded</td></tr>
                  ) : stockMovements.slice(0, 30).map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">{m.itemName || m.itemType}</td>
                      <td className="px-3 py-2 text-xs">{m.fromLocation || 'Stock'} → {m.toLocation || 'Vault'}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{m.weightMg ? `${(Number(m.weightMg) / 1000).toFixed(2)}g` : m.quantity}</td>
                      <td className="px-3 py-2 text-xs">{m.reason}</td>
                      <td className="px-3 py-2 text-xs">{m.performedByName || 'Admin'}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(m.createdAt || m.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="wastage" className="mt-3">
          <Card><CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Work ID</th>
                    <th className="text-left font-medium px-3 py-2">Step</th>
                    <th className="text-left font-medium px-3 py-2">User</th>
                    <th className="text-right font-medium px-3 py-2">Input</th>
                    <th className="text-right font-medium px-3 py-2">Output</th>
                    <th className="text-right font-medium px-3 py-2">Wastage</th>
                    <th className="text-right font-medium px-3 py-2">%</th>
                    <th className="text-left font-medium px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {wastageRecords.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No wastage records</td></tr>
                  ) : wastageRecords.map((w) => (
                    <tr key={w.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-medium">{w.workOrder?.orderNumber || w.workId || 'WO'}</td>
                      <td className="px-3 py-2">{w.stepName || 'Production'}</td>
                      <td className="px-3 py-2 text-xs">{w.user?.name || w.userName || 'Karigar'}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{(Number(w.inputWeightMg || 0) / 1000).toFixed(3)}g</td>
                      <td className="px-3 py-2 text-right tabular-nums">{(Number(w.outputWeightMg || 0) / 1000).toFixed(3)}g</td>
                      <td className="px-3 py-2 text-right tabular-nums text-rose-600 dark:text-rose-400">{(Number(w.wastageMg || 0) / 1000).toFixed(3)}g</td>
                      <td className="px-3 py-2 text-right tabular-nums">{(Number(w.wastagePercentBps || 0) / 100).toFixed(2)}%</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(w.createdAt || w.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <GoldStockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        suppliers={suppliers}
        defaultGoldRate={defaultGoldRate}
        purities={purities}
        isSaving={isSaving}
        onSave={handleSave}
      />

      {moveOpen && (
        <MovementDialog
          stock={moveOpen}
          onClose={() => setMoveOpen(null)}
          onSave={handleMovement}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this stock entry?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the stock record from inventory.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

function GoldStockDialog({ open, onOpenChange, editing, suppliers, defaultGoldRate, purities, isSaving, onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: GoldStock | null
  suppliers: any[]
  defaultGoldRate: number
  purities: any[]
  isSaving: boolean
  onSave: (data: Partial<GoldStock>) => void
}) {
  const [form, setForm] = React.useState<Partial<GoldStock>>({})

  React.useEffect(() => {
    if (open) {
      setForm(editing ?? {
        stockId: `GB-${Date.now().toString().slice(-4)}`,
        materialType: 'GOLD_BAR',
        metal: 'GOLD',
        purity: purities[0]?.label ?? '22K',
        karat: purities[0]?.label ?? '22K',
        grossWeight: 0,
        fineGoldWeight: 0,
        purchaseRate: defaultGoldRate,
        purchaseValue: 0,
        currentLocation: 'Vault A',
        status: 'AVAILABLE',
        purchaseDate: new Date().toISOString().slice(0, 10),
      })
    }
  }, [open, editing, defaultGoldRate, purities])

  const update = (patch: Partial<GoldStock>) => setForm((f) => ({ ...f, ...patch }))

  // Auto-calc fine gold weight & purchase value
  React.useEffect(() => {
    const purityObj = purities.find((p) => p.label === form.purity)
    const pct = purityObj?.percentage ?? (form.purity === '24K' ? 99.9 : form.purity === '22K' ? 91.6 : 75)
    const fine = ((form.grossWeight ?? 0) * pct) / 100
    const value = (form.grossWeight ?? 0) * (form.purchaseRate ?? 0)
    if (Math.abs((form.fineGoldWeight ?? 0) - fine) > 0.01) update({ fineGoldWeight: Math.round(fine * 100) / 100 })
    if (Math.abs((form.purchaseValue ?? 0) - value) > 1) update({ purchaseValue: Math.round(value) })
  }, [form.grossWeight, form.purchaseRate, form.purity, form.fineGoldWeight, form.purchaseValue, purities])

  const selectSupplier = (id: string) => {
    if (id === 'none') { update({ supplierId: undefined, supplierName: undefined }); return }
    const sup = suppliers.find((s) => s.id === id)
    update({ supplierId: id, supplierName: sup?.name })
  }

  const selectPurity = (label: string) => {
    const pur = purities.find((p) => p.label === label)
    update({ purity: label, karat: label, metal: pur?.metal ?? form.metal ?? 'GOLD' })
  }

  const valid = (form.stockId?.trim()?.length ?? 0) > 0 && (form.grossWeight ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.stockId}` : 'Add Gold / Raw Material'}</DialogTitle>
          <DialogDescription>{editing ? 'Update stock entry' : 'Record new gold or raw material received'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5"><Label>Stock ID *</Label><Input value={form.stockId ?? ''} onChange={(e) => update({ stockId: e.target.value })} placeholder="GB-001" /></div>
          <div className="space-y-1.5"><Label>Material Type</Label>
            <Select value={form.materialType} onValueChange={(v) => update({ materialType: v as MaterialType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MATERIAL_OPTIONS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Metal</Label>
            <Select value={form.metal} onValueChange={(v) => update({ metal: v as MetalType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{METAL_OPTIONS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Purity</Label>
            <Select value={form.purity} onValueChange={selectPurity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {purities.filter((p) => p.active !== false).map((p) => {
                  const pct = typeof p.percentage === 'object' && p.percentage != null
                    ? (typeof p.percentage.toNumber === 'function' ? p.percentage.toNumber() : Number(p.percentage.toString ? p.percentage.toString() : p.percentage))
                    : Number(p.percentage || 0)
                  return (
                    <SelectItem key={p.id} value={p.label}>
                      {p.label} ({pct}%)
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Gross Weight (g) *</Label><Input type="number" step="0.001" value={form.grossWeight ?? 0} onChange={(e) => update({ grossWeight: parseFloat(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>Fine Gold Weight (g)</Label><Input type="number" step="0.01" value={form.fineGoldWeight ?? 0} readOnly className="bg-muted/50 font-semibold" /></div>
          <div className="space-y-1.5"><Label>Supplier</Label>
            <Select value={form.supplierId ?? 'none'} onValueChange={selectSupplier}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent><SelectItem value="none">No supplier</SelectItem>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Purchase Date</Label><Input type="date" value={(form.purchaseDate ?? '').slice(0, 10)} onChange={(e) => update({ purchaseDate: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Rate per Gram (₹)</Label><Input type="number" value={form.purchaseRate ?? 0} onChange={(e) => update({ purchaseRate: parseFloat(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>Purchase Value (₹)</Label><Input type="number" value={form.purchaseValue ?? 0} readOnly className="bg-muted/50 font-semibold" /></div>
          <div className="space-y-1.5"><Label>Location</Label><Input value={form.currentLocation ?? ''} onChange={(e) => update({ currentLocation: e.target.value })} placeholder="Vault A" /></div>
          <div className="space-y-1.5"><Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update({ status: v as GoldStock['status'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="AVAILABLE">Available</SelectItem><SelectItem value="IN_PRODUCTION">In Production</SelectItem><SelectItem value="USED">Used</SelectItem><SelectItem value="SOLD">Sold</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Reference Number</Label><Input value={form.referenceNumber ?? ''} onChange={(e) => update({ referenceNumber: e.target.value })} placeholder="Supplier invoice no" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={() => valid && onSave(form)} disabled={!valid || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {editing ? 'Save Changes' : 'Add Stock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MovementDialog({ stock, onClose, onSave }: {
  stock: GoldStock
  onClose: () => void
  onSave: (from: string, to: string, reason: string, remarks: string) => void
}) {
  const [from, setFrom] = React.useState(stock.currentLocation)
  const [to, setTo] = React.useState('')
  const [reason, setReason] = React.useState('INTERNAL_TRANSFER')
  const [remarks, setRemarks] = React.useState('')
  const [inFlight, setInFlight] = React.useState(false)

  const handleRecord = async () => {
    if (!to.trim()) return
    setInFlight(true)
    try {
      await onSave(from, to, reason, remarks)
    } finally {
      setInFlight(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !inFlight && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Record Movement — {stock.stockId}</DialogTitle><DialogDescription>Track gold from one location to another</DialogDescription></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5"><Label>From Location</Label><Input value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>To Location *</Label><Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Production Floor / Karigar / Vault B" /></div>
          <div className="space-y-1.5"><Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERNAL_TRANSFER">Internal Transfer</SelectItem>
                <SelectItem value="PRODUCTION">Production Issue</SelectItem>
                <SelectItem value="RETURN">Return to Stock</SelectItem>
                <SelectItem value="QC">Quality Check</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={inFlight}>Cancel</Button>
          <Button onClick={handleRecord} disabled={!to.trim() || inFlight}>
            {inFlight ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Record Movement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
