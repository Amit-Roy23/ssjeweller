'use client'

import * as React from 'react'
import {
  Plus, Repeat, Edit3, Trash2, Gem, ArrowLeftRight, Banknote,
} from 'lucide-react'
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
import { useJewelleryStore, formatCurrency, formatDate } from '@/lib/store'
import { KARAT_OPTIONS, type OldGoldExchange, type ExchangeType, type KaratType } from '@/lib/types'
import { toast } from 'sonner'

export function ExchangeView() {
  const { exchanges, settings, addExchange, updateExchange, deleteExchange } = useJewelleryStore()
  const [editing, setEditing] = React.useState<OldGoldExchange | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [typeFilter, setTypeFilter] = React.useState<string>('ALL')

  const filtered = React.useMemo(() => {
    return exchanges.filter((e) => typeFilter === 'ALL' || e.type === typeFilter)
  }, [exchanges, typeFilter])

  const stats = React.useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    return {
      todayCount: exchanges.filter((e) => new Date(e.createdAt) >= todayStart).length,
      todayValue: exchanges.filter((e) => new Date(e.createdAt) >= todayStart).reduce((s, e) => s + e.totalValue, 0),
      monthValue: exchanges.filter((e) => new Date(e.createdAt) >= monthStart).reduce((s, e) => s + e.totalValue, 0),
      totalBuy: exchanges.filter((e) => e.type === 'BUY').reduce((s, e) => s + e.totalValue, 0),
      totalExch: exchanges.filter((e) => e.type === 'EXCHANGE').reduce((s, e) => s + e.totalValue, 0),
    }
  }, [exchanges])

  const openAdd = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (e: OldGoldExchange) => { setEditing(e); setDialogOpen(true) }
  const handleDelete = () => { if (deleteId) { deleteExchange(deleteId); toast.success('Voucher removed'); setDeleteId(null) } }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            Old Gold Exchange
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Buy-back and exchange tracking · {exchanges.length} vouchers
          </p>
        </div>
        <Button onClick={openAdd} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          New Voucher
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">Today&apos;s Buy/Exchange</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{formatCurrency(stats.todayValue, settings.currency)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{stats.todayCount} vouchers</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">This Month</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{formatCurrency(stats.monthValue, settings.currency)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Banknote className="h-3 w-3" /> Total Buy</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{formatCurrency(stats.totalBuy, settings.currency)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><ArrowLeftRight className="h-3 w-3" /> Total Exchange</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{formatCurrency(stats.totalExch, settings.currency)}</p>
        </CardContent></Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="BUY">Buy</SelectItem>
                <SelectItem value="EXCHANGE">Exchange</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Repeat className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mt-3">No vouchers yet</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((ex) => (
            <Card key={ex.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{ex.voucherNo}</p>
                      <Badge variant="outline" className={`text-[10px] ${ex.type === 'BUY' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {ex.type === 'BUY' ? 'BUY' : 'EXCHANGE'}
                      </Badge>
                    </div>
                    <p className="text-sm mt-0.5">{ex.itemDescription}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {ex.customerName} · {ex.customerPhone}
                    </p>
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{ex.karat} · {ex.touch}%</Badge>
                      <span className="text-[11px] text-muted-foreground">
                        Net: <span className="font-medium tabular-nums">{ex.netWeight.toFixed(2)}g</span>
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Rate: <span className="font-medium tabular-nums">{formatCurrency(ex.ratePerGram, settings.currency)}/g</span>
                      </span>
                      <span className="text-[11px] text-muted-foreground">{formatDate(ex.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <p className="text-base md:text-lg font-bold text-primary">{formatCurrency(ex.totalValue, settings.currency)}</p>
                    {ex.adjustedAgainstInvoice && (
                      <p className="text-[10px] text-muted-foreground">vs {ex.adjustedAgainstInvoice}</p>
                    )}
                    {ex.paidAmount > 0 && ex.type === 'BUY' && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Paid: {formatCurrency(ex.paidAmount, settings.currency)}</p>
                    )}
                    <div className="flex gap-0.5 mt-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(ex)}>
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(ex.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ExchangeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        settings={settings}
        onSave={(data) => {
          if (editing) {
            updateExchange(editing.id, data)
            toast.success('Voucher updated')
          } else {
            addExchange(data as Omit<OldGoldExchange, 'id' | 'voucherNo' | 'createdAt'>)
            toast.success('Voucher created')
          }
          setDialogOpen(false)
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this voucher?</AlertDialogTitle>
            <AlertDialogDescription>The voucher will be removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ExchangeDialog({
  open, onOpenChange, editing, settings, onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: OldGoldExchange | null
  settings: ReturnType<typeof useJewelleryStore.getState>['settings']
  onSave: (data: Partial<OldGoldExchange>) => void
}) {
  const [form, setForm] = React.useState<Partial<OldGoldExchange>>({})

  React.useEffect(() => {
    if (open) {
      setForm(editing ?? {
        customerName: '',
        customerPhone: '',
        type: 'BUY',
        itemDescription: '',
        grossWeight: 0,
        netWeight: 0,
        karat: '22K',
        touch: 91.6,
        ratePerGram: 6680,
        totalValue: 0,
        paidAmount: 0,
        date: new Date().toISOString().slice(0, 10),
      })
    }
  }, [open, editing])

  const update = (patch: Partial<OldGoldExchange>) => setForm((f) => ({ ...f, ...patch }))

  // Auto-calc total value when net weight / rate changes
  React.useEffect(() => {
    const total = (form.netWeight ?? 0) * (form.ratePerGram ?? 0)
    if (total !== form.totalValue) {
      setForm((f) => ({ ...f, totalValue: Math.round(total) }))
    }
  }, [form.netWeight, form.ratePerGram])

  // Auto-set rate based on karat & gold rate
  React.useEffect(() => {
    if (form.karat && form.touch) {
      const baseRate = settings.defaultGoldRate24K
      // For 925 silver: use silver rate / 1000 (since rate is per kg)
      if (form.karat === '925') {
        const newRate = (settings.defaultSilverRate / 1000) * 0.925
        if (Math.abs((form.ratePerGram ?? 0) - newRate) > 1) {
          update({ ratePerGram: Math.round(newRate) })
        }
      } else if (form.karat === 'PT950') {
        const newRate = 1850 // platinum rate placeholder
        if (Math.abs((form.ratePerGram ?? 0) - newRate) > 1) {
          update({ ratePerGram: newRate })
        }
      } else {
        // gold: rate = 24K rate × touch%
        const newRate = Math.round((baseRate * (form.touch ?? 91.6)) / 100)
        if (Math.abs((form.ratePerGram ?? 0) - newRate) > 5) {
          update({ ratePerGram: newRate })
        }
      }
    }
  }, [form.karat, form.touch, settings.defaultGoldRate24K, settings.defaultSilverRate])

  // Auto-set touch based on karat
  const selectKarat = (k: KaratType) => {
    const touchMap: Record<KaratType, number> = {
      '24K': 99.9, '22K': 91.6, '18K': 75, '14K': 58.5, '925': 92.5, 'PT950': 95, 'NA': 0,
    }
    update({ karat: k, touch: touchMap[k] })
  }

  const valid = (form.customerName?.trim()?.length ?? 0) > 0 && (form.netWeight ?? 0) > 0 && (form.itemDescription?.trim()?.length ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.voucherNo}` : 'New Exchange Voucher'}</DialogTitle>
          <DialogDescription>Record old gold buy-back or exchange</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5">
            <Label>Customer Name *</Label>
            <Input value={form.customerName ?? ''} onChange={(e) => update({ customerName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.customerPhone ?? ''} onChange={(e) => update({ customerPhone: e.target.value })} placeholder="+91 ..." />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => update({ type: v as ExchangeType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">Buy (Cash Purchase)</SelectItem>
                <SelectItem value="EXCHANGE">Exchange (Adjust in Bill)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={(form.date ?? '').slice(0, 10)} onChange={(e) => update({ date: e.target.value })} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Item Description *</Label>
            <Input value={form.itemDescription ?? ''} onChange={(e) => update({ itemDescription: e.target.value })} placeholder="e.g. Old gold chain, broken, 22K" />
          </div>
          <div className="space-y-1.5">
            <Label>Karat</Label>
            <Select value={form.karat} onValueChange={selectKarat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KARAT_OPTIONS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Touch / Purity %</Label>
            <Input type="number" step="0.1" value={form.touch ?? 0} onChange={(e) => update({ touch: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Gross Weight (g)</Label>
            <Input type="number" step="0.001" value={form.grossWeight ?? 0} onChange={(e) => update({ grossWeight: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Net Weight (g) *</Label>
            <Input type="number" step="0.001" value={form.netWeight ?? 0} onChange={(e) => update({ netWeight: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Rate per Gram (₹)</Label>
            <Input type="number" value={form.ratePerGram ?? 0} onChange={(e) => update({ ratePerGram: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Total Value (₹)</Label>
            <Input type="number" value={form.totalValue ?? 0} readOnly className="bg-muted/50 font-semibold" />
          </div>
          {form.type === 'EXCHANGE' && (
            <div className="space-y-1.5">
              <Label>Adjusted Against Invoice</Label>
              <Input value={form.adjustedAgainstInvoice ?? ''} onChange={(e) => update({ adjustedAgainstInvoice: e.target.value })} placeholder="Invoice no (optional)" />
            </div>
          )}
          {form.type === 'BUY' && (
            <div className="space-y-1.5">
              <Label>Paid Amount (₹)</Label>
              <Input type="number" value={form.paidAmount ?? 0} onChange={(e) => update({ paidAmount: parseFloat(e.target.value) || 0 })} />
            </div>
          )}
        </div>

        <div className="bg-muted/40 rounded-lg p-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5"><Gem className="h-3.5 w-3.5" /> Payable</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(form.totalValue ?? 0, settings.currency)}</span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => valid && onSave(form)} disabled={!valid}>{editing ? 'Save Changes' : 'Create Voucher'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
