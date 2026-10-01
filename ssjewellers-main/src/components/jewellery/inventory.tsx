'use client'

import * as React from 'react'
import {
  Plus,
  Search,
  Filter,
  Package,
  Edit3,
  Trash2,
  Gem,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useJewelleryStore, formatCurrency } from '@/lib/store'
import {
  CATEGORY_OPTIONS,
  KARAT_OPTIONS,
  METAL_OPTIONS,
  type InventoryItem,
  type ItemCategory,
  type KaratType,
  type MetalType,
} from '@/lib/types'
import { toast } from 'sonner'

const PAGE_SIZE = 8

export function InventoryView() {
  const { inventory, settings, addInventory, updateInventory, deleteInventory } = useJewelleryStore()

  const [search, setSearch] = React.useState('')
  const [metalFilter, setMetalFilter] = React.useState<MetalType | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = React.useState<ItemCategory | 'ALL'>('ALL')
  const [page, setPage] = React.useState(1)
  const [editing, setEditing] = React.useState<InventoryItem | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const filtered = React.useMemo(() => {
    return inventory.filter((it) => {
      const q = search.trim().toLowerCase()
      const matchQ = !q || it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q)
      const matchM = metalFilter === 'ALL' || it.metal === metalFilter
      const matchC = categoryFilter === 'ALL' || it.category === categoryFilter
      return matchQ && matchM && matchC
    })
  }, [inventory, search, metalFilter, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  React.useEffect(() => { if (page > totalPages) setPage(1) }, [page, totalPages])

  const stats = React.useMemo(() => {
    const totalStockValue = inventory.reduce((s, it) => s + it.costPrice * it.stock, 0)
    const totalSellingValue = inventory.reduce((s, it) => s + it.sellingPrice * it.stock, 0)
    const totalUnits = inventory.reduce((s, it) => s + it.stock, 0)
    const lowStock = inventory.filter((it) => it.stock <= 2).length
    return { totalStockValue, totalSellingValue, totalUnits, lowStock }
  }, [inventory])

  const openAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (it: InventoryItem) => {
    setEditing(it)
    setDialogOpen(true)
  }

  const handleDelete = () => {
    if (!deleteId) return
    deleteInventory(deleteId)
    toast.success('Item deleted from inventory')
    setDeleteId(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Inventory
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {inventory.length} SKUs · {stats.totalUnits} units · {formatCurrency(stats.totalStockValue, settings.currency)} stock value
          </p>
        </div>
        <Button onClick={openAdd} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Item
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">Stock Value (Cost)</p>
            <p className="text-base md:text-lg font-bold mt-0.5">{formatCurrency(stats.totalStockValue, settings.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">Selling Value</p>
            <p className="text-base md:text-lg font-bold mt-0.5">{formatCurrency(stats.totalSellingValue, settings.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">Total Units</p>
            <p className="text-base md:text-lg font-bold mt-0.5">{stats.totalUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Low Stock
            </p>
            <p className="text-base md:text-lg font-bold mt-0.5 text-amber-600 dark:text-amber-400">{stats.lowStock}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={metalFilter} onValueChange={(v) => { setMetalFilter(v as MetalType | 'ALL'); setPage(1) }}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Metal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Metals</SelectItem>
                {METAL_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v as ItemCategory | 'ALL'); setPage(1) }}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory grid (responsive — cards on mobile, table on desktop) */}
      {pageItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mt-3">No items match your filters</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-2">
            {pageItems.map((it) => (
              <InventoryCardMobile
                key={it.id}
                item={it}
                currency={settings.currency}
                onEdit={() => openEdit(it)}
                onDelete={() => setDeleteId(it.id)}
              />
            ))}
          </div>

          {/* Desktop: table */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2.5">Item</th>
                    <th className="text-left font-medium px-3 py-2.5">Metal / Karat</th>
                    <th className="text-right font-medium px-3 py-2.5">Net Wt</th>
                    <th className="text-right font-medium px-3 py-2.5">Making</th>
                    <th className="text-right font-medium px-3 py-2.5">Cost</th>
                    <th className="text-right font-medium px-3 py-2.5">Selling</th>
                    <th className="text-center font-medium px-3 py-2.5">Stock</th>
                    <th className="text-right font-medium px-3 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((it) => {
                    const metalOpt = METAL_OPTIONS.find((m) => m.value === it.metal)
                    return (
                      <tr key={it.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-md bg-gradient-to-br ${it.imageColor ?? 'from-amber-300 to-amber-500'} flex items-center justify-center shrink-0`}>
                              <Gem className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[180px]">{it.name}</p>
                              <p className="text-[11px] text-muted-foreground">{it.sku} · {it.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className={`text-[11px] ${metalOpt?.color ?? ''}`}>{it.metal}</Badge>
                          <span className="ml-1 text-[11px] text-muted-foreground">{it.karat}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{it.netWeight.toFixed(2)}g</td>
                        <td className="px-3 py-2.5 text-right text-[11px] text-muted-foreground">
                          {it.makingChargeType === 'PERCENT' && `${it.makingChargeValue}%`}
                          {it.makingChargeType === 'PER_GRAM' && `${formatCurrency(it.makingChargeValue, settings.currency)}/g`}
                          {it.makingChargeType === 'FIXED' && formatCurrency(it.makingChargeValue, settings.currency)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(it.costPrice, settings.currency)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{formatCurrency(it.sellingPrice, settings.currency)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <Badge variant={it.stock <= 2 ? 'destructive' : 'secondary'} className="text-[11px]">{it.stock}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(it)}>
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(it.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit dialog */}
      <InventoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSave={(data) => {
          if (editing) {
            updateInventory(editing.id, data)
            toast.success('Item updated')
          } else {
            addInventory(data as Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>)
            toast.success('Item added to inventory')
          }
          setDialogOpen(false)
        }}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the item from your inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function InventoryCardMobile({
  item,
  currency,
  onEdit,
  onDelete,
}: {
  item: InventoryItem
  currency: string
  onEdit: () => void
  onDelete: () => void
}) {
  const metalOpt = METAL_OPTIONS.find((m) => m.value === item.metal)
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${item.imageColor ?? 'from-amber-300 to-amber-500'} flex items-center justify-center shrink-0`}>
            <Gem className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">{item.sku}</p>
              </div>
              <Badge variant={item.stock <= 2 ? 'destructive' : 'secondary'} className="text-[10px] shrink-0">
                {item.stock} left
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="outline" className={`text-[10px] ${metalOpt?.color ?? ''}`}>{item.metal}</Badge>
              <Badge variant="outline" className="text-[10px]">{item.karat}</Badge>
              <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
              <div>
                <p className="text-[10px] text-muted-foreground">Selling</p>
                <p className="text-sm font-semibold">{formatCurrency(item.sellingPrice, currency)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Net Wt</p>
                <p className="text-sm font-medium tabular-nums">{item.netWeight.toFixed(2)}g</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InventoryDialog({
  open,
  onOpenChange,
  editing,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: InventoryItem | null
  onSave: (data: Partial<InventoryItem>) => void
}) {
  const [form, setForm] = React.useState<Partial<InventoryItem>>({})

  React.useEffect(() => {
    if (open) {
      setForm(editing ?? {
        name: '',
        sku: '',
        category: 'Necklace' as ItemCategory,
        metal: 'GOLD' as MetalType,
        karat: '22K' as KaratType,
        grossWeight: 0,
        netWeight: 0,
        stoneWeight: 0,
        stoneValue: 0,
        makingChargeType: 'PERCENT',
        makingChargeValue: 14,
        touch: 91.6,
        costPrice: 0,
        sellingPrice: 0,
        stock: 1,
        branch: 'Main Branch',
        imageColor: 'from-amber-400 to-yellow-600',
      })
    }
  }, [open, editing])

  const update = (patch: Partial<InventoryItem>) => setForm((f) => ({ ...f, ...patch }))

  const valid = React.useMemo(() => {
    return (
      (form.name?.trim()?.length ?? 0) > 0 &&
      (form.sku?.trim()?.length ?? 0) > 0 &&
      (form.netWeight ?? 0) >= 0 &&
      (form.costPrice ?? 0) >= 0 &&
      (form.sellingPrice ?? 0) >= 0
    )
  }, [form])

  const submit = () => {
    if (!valid) return
    onSave(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          <DialogDescription>
            {editing ? `Editing ${editing.name}` : 'Add a new jewellery item to your inventory'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="name">Item Name *</Label>
            <Input id="name" value={form.name ?? ''} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Antique Temple Necklace" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU *</Label>
            <Input id="sku" value={form.sku ?? ''} onChange={(e) => update({ sku: e.target.value })} placeholder="e.g. NK-22K-001" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock">Stock Quantity</Label>
            <Input id="stock" type="number" min="0" value={form.stock ?? 0} onChange={(e) => update({ stock: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Metal</Label>
            <Select value={form.metal} onValueChange={(v) => update({ metal: v as MetalType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METAL_OPTIONS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Karat</Label>
            <Select value={form.karat} onValueChange={(v) => update({ karat: v as KaratType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KARAT_OPTIONS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => update({ category: v as ItemCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="touch">Touch / Purity %</Label>
            <Input id="touch" type="number" step="0.1" value={form.touch ?? 0} onChange={(e) => update({ touch: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gw">Gross Weight (g)</Label>
            <Input id="gw" type="number" step="0.001" value={form.grossWeight ?? 0} onChange={(e) => update({ grossWeight: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nw">Net Weight (g)</Label>
            <Input id="nw" type="number" step="0.001" value={form.netWeight ?? 0} onChange={(e) => update({ netWeight: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sw">Stone Weight (g)</Label>
            <Input id="sw" type="number" step="0.001" value={form.stoneWeight ?? 0} onChange={(e) => update({ stoneWeight: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sv">Stone Value (₹)</Label>
            <Input id="sv" type="number" value={form.stoneValue ?? 0} onChange={(e) => update({ stoneValue: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Making Charge Type</Label>
            <Select value={form.makingChargeType} onValueChange={(v) => update({ makingChargeType: v as InventoryItem['makingChargeType'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENT">Percent (%)</SelectItem>
                <SelectItem value="PER_GRAM">Per Gram (₹/g)</SelectItem>
                <SelectItem value="FIXED">Fixed (₹)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mc">Making Charge Value</Label>
            <Input id="mc" type="number" step="0.1" value={form.makingChargeValue ?? 0} onChange={(e) => update({ makingChargeValue: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp">Cost Price (₹)</Label>
            <Input id="cp" type="number" value={form.costPrice ?? 0} onChange={(e) => update({ costPrice: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp">Selling Price (₹)</Label>
            <Input id="sp" type="number" value={form.sellingPrice ?? 0} onChange={(e) => update({ sellingPrice: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="branch">Branch</Label>
            <Input id="branch" value={form.branch ?? ''} onChange={(e) => update({ branch: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!valid}>
            {editing ? 'Save Changes' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
