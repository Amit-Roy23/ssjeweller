'use client'

import * as React from 'react'
import {
  Plus, Hammer, Edit3, Trash2, Phone, Star, Clock, CheckCircle2, AlertCircle, Loader2,
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
import { useJewelleryStore, formatCurrency, formatDate } from '@/lib/store'
import { CATEGORY_OPTIONS, KARAT_OPTIONS, METAL_OPTIONS, type Karigar, type WorkOrder, type WorkOrderStatus, type ItemCategory, type MetalType, type KaratType } from '@/lib/types'
import { toast } from 'sonner'

const WO_STATUSES: { value: WorkOrderStatus; label: string; color: string; icon: React.ElementType }[] = [
  { value: 'PENDING', label: 'Pending', color: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30', icon: Clock },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', icon: Loader2 },
  { value: 'READY', label: 'Ready', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30', icon: CheckCircle2 },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30', icon: AlertCircle },
]

export function KarigarView() {
  const { karigars, workOrders, settings, addKarigar, updateKarigar, deleteKarigar, addWorkOrder, updateWorkOrder, deleteWorkOrder } = useJewelleryStore()
  const [editing, setEditing] = React.useState<Karigar | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [woEditing, setWoEditing] = React.useState<WorkOrder | null>(null)
  const [woDialogOpen, setWoDialogOpen] = React.useState(false)
  const [woDeleteId, setWoDeleteId] = React.useState<string | null>(null)

  const openAdd = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (k: Karigar) => { setEditing(k); setDialogOpen(true) }
  const openWoAdd = () => { setWoEditing(null); setWoDialogOpen(true) }

  const handleDelete = () => { if (deleteId) { deleteKarigar(deleteId); toast.success('Karigar removed'); setDeleteId(null) } }
  const handleWoDelete = () => { if (woDeleteId) { deleteWorkOrder(woDeleteId); toast.success('Work order deleted'); setWoDeleteId(null) } }

  const stats = React.useMemo(() => {
    const active = workOrders.filter((w) => w.status === 'PENDING' || w.status === 'IN_PROGRESS').length
    const ready = workOrders.filter((w) => w.status === 'READY').length
    const overdue = workOrders.filter((w) => new Date(w.dueDate) < new Date() && w.status !== 'DELIVERED' && w.status !== 'CANCELLED').length
    const outstanding = karigars.reduce((s, k) => s + k.outstandingPayment, 0)
    return { active, ready, overdue, outstanding }
  }, [workOrders, karigars])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Hammer className="h-5 w-5 text-primary" />
            Karigar & Work Orders
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {karigars.length} artisans · {stats.active} active · {stats.ready} ready · {stats.overdue} overdue
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">Active Work Orders</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{stats.active}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">Ready for Delivery</p>
          <p className="text-base md:text-lg font-bold mt-0.5 text-cyan-600 dark:text-cyan-400">{stats.ready}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">Overdue</p>
          <p className="text-base md:text-lg font-bold mt-0.5 text-rose-600 dark:text-rose-400">{stats.overdue}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground">Outstanding Pay</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{formatCurrency(stats.outstanding, settings.currency)}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="work-orders">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="karigars">Karigars</TabsTrigger>
        </TabsList>

        <TabsContent value="work-orders" className="space-y-3 mt-3">
          <div className="flex justify-end">
            <Button onClick={openWoAdd}><Plus className="h-4 w-4 mr-1.5" />New Work Order</Button>
          </div>
          {workOrders.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Hammer className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mt-3">No work orders</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {workOrders.map((wo) => {
                const status = WO_STATUSES.find((s) => s.value === wo.status)!
                const StatusIcon = status.icon
                const isOverdue = new Date(wo.dueDate) < new Date() && wo.status !== 'DELIVERED' && wo.status !== 'CANCELLED'
                return (
                  <Card key={wo.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{wo.orderNo}</p>
                            <Badge variant="outline" className={`text-[10px] border ${status.color}`}>
                              <StatusIcon className="h-2.5 w-2.5 mr-1" />{status.label}
                            </Badge>
                            {isOverdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                          </div>
                          <p className="text-sm mt-0.5 line-clamp-2">{wo.itemDescription}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">{wo.category}</Badge>
                            <Badge variant="outline" className="text-[10px]">{wo.metal} · {wo.karat}</Badge>
                            <span className="text-[11px] text-muted-foreground">
                              Given: {wo.givenWeight}g → Expected: {wo.expectedWeight}g
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Karigar</p>
                              <p className="text-xs font-medium">{wo.karigarName}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Making</p>
                              <p className="text-xs font-medium">{formatCurrency(wo.makingCharge, settings.currency)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Due</p>
                              <p className={`text-xs font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400' : ''}`}>{formatDate(wo.dueDate)}</p>
                            </div>
                            <div className="flex gap-0.5">
                              <Button variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => { setWoEditing(wo); setWoDialogOpen(true) }}>
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                onClick={() => setWoDeleteId(wo.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          {wo.customerName && (
                            <p className="text-[11px] text-muted-foreground mt-1">For: {wo.customerName}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="karigars" className="space-y-3 mt-3">
          <div className="flex justify-end">
            <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" />Add Karigar</Button>
          </div>
          {karigars.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <Hammer className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mt-3">No karigars yet</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {karigars.map((k) => (
                <Card key={k.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-gold-gradient text-white font-bold flex items-center justify-center shrink-0">
                        {k.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{k.name}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" />{k.phone}
                            </p>
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(k)}>
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setDeleteId(k.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{k.specialty}</Badge>
                          {k.status === 'ACTIVE' ? (
                            <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                          )}
                          <div className="flex items-center gap-0.5 text-[10px]">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{k.rating}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-border text-center">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Orders</p>
                            <p className="text-xs font-semibold">{k.totalOrders}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Pending</p>
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{k.pendingOrders}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Outstanding</p>
                            <p className="text-xs font-semibold">{formatCurrency(k.outstandingPayment, settings.currency)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <KarigarDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSave={(data) => {
          if (editing) {
            updateKarigar(editing.id, data)
            toast.success('Karigar updated')
          } else {
            addKarigar(data as Omit<Karigar, 'id' | 'createdAt' | 'totalOrders' | 'pendingOrders' | 'outstandingPayment'>)
            toast.success('Karigar added')
          }
          setDialogOpen(false)
        }}
      />

      <WorkOrderDialog
        open={woDialogOpen}
        onOpenChange={setWoDialogOpen}
        editing={woEditing}
        karigars={karigars}
        onSave={(data) => {
          if (woEditing) {
            updateWorkOrder(woEditing.id, data)
            toast.success('Work order updated')
          } else {
            addWorkOrder(data as Omit<WorkOrder, 'id' | 'orderNo' | 'createdAt' | 'updatedAt'>)
            toast.success('Work order created')
          }
          setWoDialogOpen(false)
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this karigar?</AlertDialogTitle>
            <AlertDialogDescription>The karigar record will be removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!woDeleteId} onOpenChange={(o) => !o && setWoDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this work order?</AlertDialogTitle>
            <AlertDialogDescription>The work order will be removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleWoDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function KarigarDialog({
  open, onOpenChange, editing, onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: Karigar | null
  onSave: (data: Partial<Karigar>) => void
}) {
  const [form, setForm] = React.useState<Partial<Karigar>>({})

  React.useEffect(() => {
    if (open) {
      setForm(editing ?? {
        name: '', phone: '', specialty: 'Necklace', rating: 4.5, status: 'ACTIVE', address: '',
      })
    }
  }, [open, editing])

  const update = (patch: Partial<Karigar>) => setForm((f) => ({ ...f, ...patch }))
  const valid = (form.name?.trim()?.length ?? 0) > 0 && (form.phone?.trim()?.length ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Karigar' : 'Add Karigar'}</DialogTitle>
          <DialogDescription>{editing ? `Editing ${editing.name}` : 'Register a new artisan'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Name *</Label>
            <Input value={form.name ?? ''} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone *</Label>
            <Input value={form.phone ?? ''} onChange={(e) => update({ phone: e.target.value })} placeholder="+91 ..." />
          </div>
          <div className="space-y-1.5">
            <Label>Specialty</Label>
            <Select value={form.specialty} onValueChange={(v) => update({ specialty: v as ItemCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Rating</Label>
            <Input type="number" min="0" max="5" step="0.1" value={form.rating ?? 4.5} onChange={(e) => update({ rating: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update({ status: v as Karigar['status'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Input value={form.address ?? ''} onChange={(e) => update({ address: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => valid && onSave(form)} disabled={!valid}>{editing ? 'Save Changes' : 'Add Karigar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function WorkOrderDialog({
  open, onOpenChange, editing, karigars, onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: WorkOrder | null
  karigars: Karigar[]
  onSave: (data: Partial<WorkOrder>) => void
}) {
  const [form, setForm] = React.useState<Partial<WorkOrder>>({})

  React.useEffect(() => {
    if (open) {
      const today = new Date().toISOString().slice(0, 10)
      const defaultDue = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
      setForm(editing ?? {
        karigarId: karigars[0]?.id ?? '',
        karigarName: karigars[0]?.name ?? '',
        customerName: '',
        itemDescription: '',
        category: 'Necklace',
        metal: 'GOLD',
        karat: '22K',
        givenWeight: 0,
        expectedWeight: 0,
        receivedWeight: undefined,
        makingCharge: 0,
        dueDate: defaultDue,
        status: 'PENDING',
        notes: '',
        createdAt: today,
        updatedAt: today,
      })
    }
  }, [open, editing, karigars])

  const update = (patch: Partial<WorkOrder>) => setForm((f) => ({ ...f, ...patch }))

  const selectKarigar = (id: string) => {
    const k = karigars.find((k) => k.id === id)
    update({ karigarId: id, karigarName: k?.name ?? '' })
  }

  const valid = (form.karigarId?.length ?? 0) > 0 && (form.itemDescription?.trim()?.length ?? 0) > 0 && (form.givenWeight ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.orderNo}` : 'New Work Order'}</DialogTitle>
          <DialogDescription>Assign work to a karigar</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Karigar *</Label>
            <Select value={form.karigarId} onValueChange={selectKarigar}>
              <SelectTrigger><SelectValue placeholder="Select karigar" /></SelectTrigger>
              <SelectContent>
                {karigars.map((k) => <SelectItem key={k.id} value={k.id}>{k.name} · {k.specialty}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Item Description *</Label>
            <Input value={form.itemDescription ?? ''} onChange={(e) => update({ itemDescription: e.target.value })} placeholder="e.g. Custom 22K Temple Necklace, 40g" />
          </div>
          <div className="space-y-1.5">
            <Label>Customer Name</Label>
            <Input value={form.customerName ?? ''} onChange={(e) => update({ customerName: e.target.value })} placeholder="(optional)" />
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
            <Label>Given Weight (g) *</Label>
            <Input type="number" step="0.001" value={form.givenWeight ?? 0} onChange={(e) => update({ givenWeight: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Expected Weight (g)</Label>
            <Input type="number" step="0.001" value={form.expectedWeight ?? 0} onChange={(e) => update({ expectedWeight: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Received Weight (g)</Label>
            <Input type="number" step="0.001" value={form.receivedWeight ?? ''} onChange={(e) => update({ receivedWeight: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="(when ready)" />
          </div>
          <div className="space-y-1.5">
            <Label>Making Charge (₹)</Label>
            <Input type="number" value={form.makingCharge ?? 0} onChange={(e) => update({ makingCharge: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-1.5">
            <Label>Due Date</Label>
            <Input type="date" value={(form.dueDate ?? '').slice(0, 10)} onChange={(e) => update({ dueDate: new Date(e.target.value).toISOString() })} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update({ status: v as WorkOrderStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WO_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Input value={form.notes ?? ''} onChange={(e) => update({ notes: e.target.value })} placeholder="Any special instructions" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => valid && onSave(form)} disabled={!valid}>{editing ? 'Save Changes' : 'Create Work Order'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
