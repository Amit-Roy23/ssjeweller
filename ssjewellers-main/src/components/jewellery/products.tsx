'use client'

import * as React from 'react'
import { Plus, Search, Package, Edit3, Trash2, QrCode, Gem } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { METAL_OPTIONS, type Product, type MetalType } from '@/lib/types'
import { toast } from 'sonner'

export function ProductsView() {
  const { products, categories, purities, settings, addProduct, updateProduct, deleteProduct } = useJewelleryStore()
  const [search, setSearch] = React.useState('')
  const [catFilter, setCatFilter] = React.useState('ALL')
  const [editing, setEditing] = React.useState<Product | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase()
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.productCode.toLowerCase().includes(q) || p.barcode.includes(q)
    const matchC = catFilter === 'ALL' || p.category === catFilter
    return matchQ && matchC
  })

  const stats = {
    totalValue: products.reduce((s, p) => s + p.costPrice * p.stock, 0),
    totalSelling: products.reduce((s, p) => s + p.sellingPrice * p.stock, 0),
    totalUnits: products.reduce((s, p) => s + p.stock, 0),
    lowStock: products.filter((p) => p.stock <= 2).length,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Finished Jewellery</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{products.length} products · {stats.totalUnits} units</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus className="h-4 w-4 mr-1.5" /> Add Product</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Stock Value (Cost)</p><p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(stats.totalValue, settings.currency)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Selling Value</p><p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(stats.totalSelling, settings.currency)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Total Units</p><p className="text-base md:text-lg font-bold mt-0.5">{stats.totalUnits}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Low Stock</p><p className="text-base md:text-lg font-bold mt-0.5 text-amber-600 dark:text-amber-400">{stats.lowStock}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search name, code, barcode…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">All Categories</SelectItem>{categories.filter((c) => c.active).map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Package className="h-12 w-12 mx-auto text-muted-foreground/50" /><p className="text-sm text-muted-foreground mt-3">No products found</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const metalOpt = METAL_OPTIONS.find((m) => m.value === p.metal)
            return (
              <Card key={p.id}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${p.imageColor ?? 'from-amber-300 to-amber-500'} flex items-center justify-center shrink-0`}>
                      <Gem className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground">{p.productCode}</p>
                        </div>
                        <Badge variant={p.stock <= 2 ? 'destructive' : 'secondary'} className="text-[10px] shrink-0">{p.stock} left</Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${metalOpt?.color ?? ''}`}>{p.metal}</Badge>
                        <Badge variant="outline" className="text-[10px]">{p.purity}</Badge>
                        <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Selling</p>
                          <p className="text-sm font-semibold">{formatCurrency(p.sellingPrice, settings.currency)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">Net Wt</p>
                          <p className="text-sm font-medium tabular-nums">{p.netWeight.toFixed(2)}g</p>
                        </div>
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(p); setDialogOpen(true) }}><Edit3 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                        <QrCode className="h-2.5 w-2.5" /> {p.barcode}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ProductDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} categories={categories} purities={purities} settings={settings} onSave={(data) => {
        if (editing) { updateProduct(editing.id, data); toast.success('Product updated') }
        else { addProduct(data as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>); toast.success('Product added') }
        setDialogOpen(false)
      }} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this product?</AlertDialogTitle><AlertDialogDescription>The product will be removed from inventory.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleteId) { deleteProduct(deleteId); toast.success('Product removed'); setDeleteId(null) } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ProductDialog({ open, onOpenChange, editing, categories, purities, settings, onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: Product | null
  categories: ReturnType<typeof useJewelleryStore.getState>['categories']
  purities: ReturnType<typeof useJewelleryStore.getState>['purities']
  settings: ReturnType<typeof useJewelleryStore.getState>['settings']
  onSave: (data: Partial<Product>) => void
}) {
  const [form, setForm] = React.useState<Partial<Product>>({})

  React.useEffect(() => {
    if (open) setForm(editing ?? {
      productCode: '', barcode: String(Math.floor(Math.random() * 9000000000000) + 8900000000000),
      name: '', category: categories[0]?.name ?? 'Ring', metal: 'GOLD', purity: '22K',
      grossWeight: 0, netWeight: 0, stoneWeight: 0, wastage: 0, makingCharge: 0, otherCharges: 0,
      gstRate: settings.defaultGstRate, sellingPrice: 0, costPrice: 0, stock: 1, hsnCode: '7113',
      imageColor: 'from-amber-400 to-yellow-600',
    })
  }, [open, editing, categories, settings.defaultGstRate])

  const update = (patch: Partial<Product>) => setForm((f) => ({ ...f, ...patch }))
  const valid = (form.name?.trim()?.length ?? 0) > 0 && (form.productCode?.trim()?.length ?? 0) > 0 && (form.sellingPrice ?? 0) >= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle><DialogDescription>{editing ? `Editing ${editing.name}` : 'Add new finished jewellery product'}</DialogDescription></DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Product Name *</Label><Input value={form.name ?? ''} onChange={(e) => update({ name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Product Code *</Label><Input value={form.productCode ?? ''} onChange={(e) => update({ productCode: e.target.value })} placeholder="SJ-RING-001" /></div>
          <div className="space-y-1.5"><Label>Barcode</Label><Input value={form.barcode ?? ''} onChange={(e) => update({ barcode: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Category</Label><Select value={form.category} onValueChange={(v) => update({ category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.filter((c) => c.active).map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>HSN Code</Label><Input value={form.hsnCode ?? '7113'} onChange={(e) => update({ hsnCode: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Metal</Label><Select value={form.metal} onValueChange={(v) => update({ metal: v as MetalType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{METAL_OPTIONS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Purity</Label><Select value={form.purity} onValueChange={(v) => update({ purity: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{purities.filter((p) => p.active).map((p) => <SelectItem key={p.id} value={p.label}>{p.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><Label>Gross Weight (g)</Label><Input type="number" step="0.001" value={form.grossWeight ?? 0} onChange={(e) => update({ grossWeight: parseFloat(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>Net Weight (g)</Label><Input type="number" step="0.001" value={form.netWeight ?? 0} onChange={(e) => update({ netWeight: parseFloat(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>Stone Weight (g)</Label><Input type="number" step="0.001" value={form.stoneWeight ?? 0} onChange={(e) => update({ stoneWeight: parseFloat(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>Wastage (g)</Label><Input type="number" step="0.001" value={form.wastage ?? 0} onChange={(e) => update({ wastage: parseFloat(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>Making Charge (₹)</Label><Input type="number" value={form.makingCharge ?? 0} onChange={(e) => update({ makingCharge: parseFloat(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>Other Charges (₹)</Label><Input type="number" value={form.otherCharges ?? 0} onChange={(e) => update({ otherCharges: parseFloat(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>Cost Price (₹)</Label><Input type="number" value={form.costPrice ?? 0} onChange={(e) => update({ costPrice: parseFloat(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>Selling Price (₹)</Label><Input type="number" value={form.sellingPrice ?? 0} onChange={(e) => update({ sellingPrice: parseFloat(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>GST Rate (%)</Label><Input type="number" step="0.1" value={form.gstRate ?? 3} onChange={(e) => update({ gstRate: parseFloat(e.target.value) || 0 })} /></div>
          <div className="space-y-1.5"><Label>Stock</Label><Input type="number" value={form.stock ?? 1} onChange={(e) => update({ stock: parseInt(e.target.value) || 0 })} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => valid && onSave(form)} disabled={!valid}>{editing ? 'Save Changes' : 'Add Product'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
