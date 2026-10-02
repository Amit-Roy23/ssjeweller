'use client'

import * as React from 'react'
import {
  Plus, Repeat, Trash2, ArrowLeftRight, Banknote, Loader2,
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
import { formatCurrency, formatDate } from '@/lib/store'
import { KARAT_OPTIONS, type OldGoldExchange, type ExchangeType, type KaratType } from '@/lib/types'
import {
  useExchanges,
  useCreateExchange,
  useSettings,
} from '@/lib/hooks/use-erp-queries'
import { toast } from 'sonner'

export function ExchangeView() {
  const { data: exchangeData, isLoading: loading } = useExchanges()
  const { data: settingsData } = useSettings()
  const createExchangeMutation = useCreateExchange()

  const currency = settingsData?.settings?.currency || '₹'
  const defaultGoldRate = Number(settingsData?.settings?.defaultGoldRate24K || 7200)

  const exchanges: OldGoldExchange[] = (exchangeData?.exchanges || []).map((e: any) => ({
    id: e.id,
    voucherNo: e.voucherNo,
    customerName: e.customerName,
    customerPhone: e.customerPhone,
    type: e.type,
    itemDescription: e.itemDescription,
    grossWeight: Number(e.grossWeightMg || 0) / 1000,
    netWeight: Number(e.netWeightMg || 0) / 1000,
    karat: e.karat,
    touch: Number(e.touchBps || 0) / 100,
    ratePerGram: Number(e.ratePaisePerGram || 0) / 100,
    totalValue: Number(e.totalValuePaise || 0) / 100,
    adjustedAgainstSaleId: e.adjustedAgainstSaleId || undefined,
    adjustedAgainstInvoice: e.adjustedAgainstInvoice || undefined,
    paidAmount: Number(e.paidAmountPaise || 0) / 100,
    date: String(e.date || e.createdAt),
    createdAt: e.createdAt,
  }))

  const [dialogOpen, setDialogOpen] = React.useState(false)
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

  const handleSave = async (data: Partial<OldGoldExchange>) => {
    try {
      const payload = {
        customerName: data.customerName,
        customerPhone: data.customerPhone || '9999999999',
        type: data.type || 'BUY',
        itemDescription: data.itemDescription,
        grossWeightMg: Math.round((data.grossWeight || 0) * 1000),
        netWeightMg: Math.round((data.netWeight || 0) * 1000),
        karat: data.karat || '22K',
        touchBps: Math.round((data.touch || 91.6) * 100),
        ratePaisePerGram: Math.round((data.ratePerGram || 0) * 100),
        adjustedAgainstInvoice: data.adjustedAgainstInvoice || null,
        paidAmountPaise: Math.round((data.paidAmount || 0) * 100),
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      }

      const res = await createExchangeMutation.mutateAsync(payload)
      toast.success(`Exchange voucher ${res.exchange?.voucherNo || 'created'} generated successfully`)
      setDialogOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create exchange voucher')
    }
  }

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
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          New Voucher
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">Today&apos;s Buy/Exchange</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{formatCurrency(stats.todayValue, currency)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{stats.todayCount} vouchers</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">This Month</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{formatCurrency(stats.monthValue, currency)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Banknote className="h-3 w-3" /> Total Buy</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{formatCurrency(stats.totalBuy, currency)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><ArrowLeftRight className="h-3 w-3" /> Total Exchange</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{formatCurrency(stats.totalExch, currency)}</p>
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
      {loading ? (
        <Card><CardContent className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /><p className="text-sm text-muted-foreground mt-2">Loading exchange vouchers...</p></CardContent></Card>
      ) : filtered.length === 0 ? (
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
                        Rate: <span className="font-medium tabular-nums">{formatCurrency(ex.ratePerGram, currency)}/g</span>
                      </span>
                      <span className="text-[11px] text-muted-foreground">{formatDate(ex.date || ex.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <p className="text-base md:text-lg font-bold text-primary">{formatCurrency(ex.totalValue, currency)}</p>
                    {ex.adjustedAgainstInvoice && (
                      <p className="text-[10px] text-muted-foreground">vs {ex.adjustedAgainstInvoice}</p>
                    )}
                    {ex.paidAmount > 0 && ex.type === 'BUY' && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Paid: {formatCurrency(ex.paidAmount, currency)}</p>
                    )}
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
        defaultGoldRate={defaultGoldRate}
        currency={currency}
        isSaving={createExchangeMutation.isPending}
        onSave={handleSave}
      />
    </div>
  )
}

function ExchangeDialog({
  open, onOpenChange, defaultGoldRate, currency, isSaving, onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  defaultGoldRate: number
  currency: string
  isSaving: boolean
  onSave: (data: Partial<OldGoldExchange>) => void
}) {
  const [form, setForm] = React.useState<Partial<OldGoldExchange>>({})

  React.useEffect(() => {
    if (open) {
      setForm({
        customerName: '',
        customerPhone: '',
        type: 'BUY',
        itemDescription: '',
        grossWeight: 0,
        netWeight: 0,
        karat: '22K',
        touch: 91.6,
        ratePerGram: Math.round(defaultGoldRate * 0.916),
        totalValue: 0,
        paidAmount: 0,
        date: new Date().toISOString().slice(0, 10),
      })
    }
  }, [open, defaultGoldRate])

  const update = (patch: Partial<OldGoldExchange>) => setForm((f) => ({ ...f, ...patch }))

  // Auto-calc total value when net weight / rate changes
  React.useEffect(() => {
    const total = (form.netWeight ?? 0) * (form.ratePerGram ?? 0)
    if (total !== form.totalValue) {
      setForm((f) => ({ ...f, totalValue: Math.round(total) }))
    }
  }, [form.netWeight, form.ratePerGram, form.totalValue])

  // Auto-set touch based on karat
  const selectKarat = (k: KaratType) => {
    const touchMap: Record<KaratType, number> = {
      '24K': 99.9, '22K': 91.6, '20K': 83.3, '18K': 75, '14K': 58.5, '925': 92.5, 'PT950': 95, 'NA': 0,
    }
    const touch = touchMap[k] || 91.6
    const rate = Math.round((defaultGoldRate * touch) / 100)
    update({ karat: k, touch, ratePerGram: rate })
  }

  const valid = (form.customerName?.trim()?.length ?? 0) > 0 && (form.netWeight ?? 0) > 0 && (form.itemDescription?.trim()?.length ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Exchange Voucher</DialogTitle>
          <DialogDescription>Record old gold buy-back or exchange</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5">
            <Label>Customer Name *</Label>
            <Input value={form.customerName ?? ''} onChange={(e) => update({ customerName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone *</Label>
            <Input value={form.customerPhone ?? ''} onChange={(e) => update({ customerPhone: e.target.value })} placeholder="10-digit mobile number" />
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
          <span className="text-muted-foreground">Total Valuation</span>
          <span className="text-lg font-bold text-primary">{formatCurrency(form.totalValue ?? 0, currency)}</span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={() => valid && onSave(form)} disabled={!valid || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Create Voucher
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
