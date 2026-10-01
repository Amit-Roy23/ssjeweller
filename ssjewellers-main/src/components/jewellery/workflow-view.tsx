'use client'

import * as React from 'react'
import {
  Plus, Search, Workflow as WorkflowIcon, Eye, Trash2, Hammer, Clock, CheckCircle2,
  AlertTriangle, ChevronRight, ArrowRight, History, Filter, GitBranch, User, Weight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { useJewelleryStore, formatDate, formatDateTime, relativeTime, isOverdue, formatCurrency } from '@/lib/store'
import { PRIORITY_OPTIONS, METAL_OPTIONS, type WorkOrder, type WorkStatusValue, type WorkPriority, type MetalType, type Workflow } from '@/lib/types'
import { StatusBadge } from './status-badge'
import { toast } from 'sonner'

const PAGE_SIZE = 8

export function WorkflowView() {
  const { workOrders, workflows, users, currentUser, settings, addWorkOrder, updateWorkOrder, deleteWorkOrder, addWorkHistory, updateWorkStep } = useJewelleryStore()
  const [tab, setTab] = React.useState<'orders' | 'templates'>('orders')
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = React.useState<string>('ALL')
  const [userFilter, setUserFilter] = React.useState<string>('ALL')
  const [page, setPage] = React.useState(1)
  const [newOpen, setNewOpen] = React.useState(false)
  const [viewOrder, setViewOrder] = React.useState<WorkOrder | null>(null)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER'
  const isStaff = currentUser?.role === 'STAFF'

  const filtered = React.useMemo(() => {
    let list = workOrders
    // Staff only sees their own work
    if (isStaff) list = list.filter((w) => w.assignedTo === currentUser?.id || w.steps.some((s) => s.assignedTo === currentUser?.id))
    const q = search.trim().toLowerCase()
    list = list.filter((w) => {
      const matchQ = !q || w.workId.toLowerCase().includes(q) || w.productName.toLowerCase().includes(q) || (w.customerName ?? '').toLowerCase().includes(q) || (w.productCode ?? '').toLowerCase().includes(q)
      const matchS = statusFilter === 'ALL' || w.status === statusFilter
      const matchP = priorityFilter === 'ALL' || w.priority === priorityFilter
      const matchU = userFilter === 'ALL' || w.assignedTo === userFilter
      return matchQ && matchS && matchP && matchU
    })
    return list
  }, [workOrders, search, statusFilter, priorityFilter, userFilter, isStaff, currentUser])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const stats = React.useMemo(() => ({
    pending: workOrders.filter((w) => w.status === 'PENDING' || w.status === 'ASSIGNED').length,
    inProgress: workOrders.filter((w) => w.status === 'IN_PROGRESS').length,
    completed: workOrders.filter((w) => w.status === 'APPROVED' || w.status === 'COMPLETED').length,
    overdue: workOrders.filter((w) => isOverdue(w.expectedCompletion) && w.status !== 'APPROVED' && w.status !== 'COMPLETED' && w.status !== 'CANCELLED').length,
  }), [workOrders])

  const handleDelete = () => {
    if (!deleteId) return
    deleteWorkOrder(deleteId)
    toast.success('Work order deleted')
    setDeleteId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <WorkflowIcon className="h-5 w-5 text-primary" />
            Production Workflow
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isStaff ? 'Your assigned work' : `${workOrders.length} work orders · ${workflows.length} templates`}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setNewOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-1.5" /> New Work Order
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</p>
          <p className="text-base md:text-lg font-bold mt-0.5">{stats.pending}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Hammer className="h-3 w-3" /> In Progress</p>
          <p className="text-base md:text-lg font-bold mt-0.5 text-amber-600 dark:text-amber-400">{stats.inProgress}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</p>
          <p className="text-base md:text-lg font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Overdue</p>
          <p className="text-base md:text-lg font-bold mt-0.5 text-rose-600 dark:text-rose-400">{stats.overdue}</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'orders' | 'templates')}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="orders">Work Orders</TabsTrigger>
          {isAdmin && <TabsTrigger value="templates">Templates</TabsTrigger>}
        </TabsList>

        <TabsContent value="orders" className="space-y-3 mt-3">
          {/* Filters */}
          <Card><CardContent className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search work ID, product, customer…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REWORK_REQUIRED">Rework</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1) }}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priority</SelectItem>
                  {PRIORITY_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {isAdmin && (
                <Select value={userFilter} onValueChange={(v) => { setUserFilter(v); setPage(1) }}>
                  <SelectTrigger><SelectValue placeholder="User" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Users</SelectItem>
                    {users.filter((u) => u.active).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent></Card>

          {/* List */}
          {pageItems.length === 0 ? (
            <Card><CardContent className="py-12 text-center">
              <WorkflowIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mt-3">No work orders match your filters</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {pageItems.map((w) => {
                const overdueFlag = isOverdue(w.expectedCompletion) && w.status !== 'APPROVED' && w.status !== 'COMPLETED' && w.status !== 'CANCELLED'
                const completedSteps = w.steps.filter((s) => s.status === 'COMPLETED' || s.status === 'APPROVED' || s.status === 'SKIPPED').length
                const progress = Math.round((completedSteps / w.steps.length) * 100)
                const priorityOpt = PRIORITY_OPTIONS.find((p) => p.value === w.priority)
                return (
                  <Card key={w.id} className="overflow-hidden hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setViewOrder(w)}>
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{w.workId}</p>
                            <StatusBadge status={w.status} />
                            <Badge variant="outline" className={`text-[10px] ${priorityOpt?.color}`}>{priorityOpt?.label}</Badge>
                            {overdueFlag && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                          </div>
                          <p className="text-sm mt-0.5">{w.productName}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {w.grossWeight}g · {w.purity} · {w.assignedToName ?? 'Unassigned'}
                            {w.customerName && ` · ${w.customerName}`}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={progress} className="h-1.5 flex-1" />
                            <span className="text-[10px] text-muted-foreground shrink-0">{completedSteps}/{w.steps.length}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Due: {formatDate(w.expectedCompletion)} · Updated {relativeTime(w.updatedAt)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setViewOrder(w) }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(w.id) }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="templates" className="mt-3">
            <WorkflowTemplates workflows={workflows} users={users} />
          </TabsContent>
        )}
      </Tabs>

      {/* New work order dialog */}
      <NewWorkOrderDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        workflows={workflows}
        users={users}
        settings={settings}
        onSave={(data) => {
          const wo = addWorkOrder(data)
          toast.success(`Work order ${wo.workId} created`)
          setNewOpen(false)
        }}
      />

      {/* View / edit work order sheet */}
      <WorkOrderDetail
        order={viewOrder}
        onClose={() => setViewOrder(null)}
        onUpdate={(id, patch) => { updateWorkOrder(id, patch); setViewOrder((prev) => prev ? { ...prev, ...patch } : null) }}
        onUpdateStep={updateWorkStep}
        onAddHistory={addWorkHistory}
        isAdmin={isAdmin}
        currentUser={currentUser}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this work order?</AlertDialogTitle>
            <AlertDialogDescription>The work order will be permanently removed.</AlertDialogDescription>
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

// ===== Workflow Templates =====
function WorkflowTemplates({ workflows, users }: { workflows: Workflow[]; users: ReturnType<typeof useJewelleryStore.getState>['users'] }) {
  const { addWorkflow, updateWorkflow, deleteWorkflow } = useJewelleryStore()
  const [newOpen, setNewOpen] = React.useState(false)

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> New Template</Button>
      </div>
      {workflows.map((wf) => (
        <Card key={wf.id}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-sm">{wf.name}</p>
                  <Badge variant={wf.active ? 'default' : 'secondary'} className="text-[10px]">{wf.active ? 'Active' : 'Inactive'}</Badge>
                </div>
                {wf.description && <p className="text-xs text-muted-foreground mt-1">{wf.description}</p>}
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {wf.steps.map((s, i) => (
                    <React.Fragment key={s.id}>
                      <Badge variant="outline" className="text-[10px]">{i + 1}. {s.name}</Badge>
                      {i < wf.steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteWorkflow(wf.id); toast.success('Template deleted') }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <NewWorkflowDialog open={newOpen} onOpenChange={setNewOpen} users={users} onSave={(data) => { addWorkflow(data); toast.success('Workflow template created'); setNewOpen(false) }} />
    </div>
  )
}

function NewWorkflowDialog({ open, onOpenChange, users, onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  users: ReturnType<typeof useJewelleryStore.getState>['users']
  onSave: (data: Omit<Workflow, 'id' | 'createdAt'>) => void
}) {
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [steps, setSteps] = React.useState<{ name: string; defaultUserId?: string; estimatedHours?: number }[]>([{ name: 'Gold Issue' }, { name: 'Melting' }, { name: 'Shaping' }, { name: 'Quality Check' }])

  const addStep = () => setSteps((s) => [...s, { name: '' }])
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i))
  const updateStep = (i: number, patch: Partial<typeof steps[0]>) => setSteps((s) => s.map((st, idx) => idx === i ? { ...st, ...patch } : st))

  const valid = name.trim().length > 0 && steps.every((s) => s.name.trim().length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Workflow Template</DialogTitle>
          <DialogDescription>Define a reusable production workflow</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Workflow Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gold Ring Production" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Steps</Label>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addStep}><Plus className="h-3 w-3 mr-1" /> Add Step</Button>
            </div>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <Input value={s.name} onChange={(e) => updateStep(i, { name: e.target.value })} placeholder="Step name" className="flex-1 h-8" />
                  <Select value={s.defaultUserId ?? 'none'} onValueChange={(v) => updateStep(i, { defaultUserId: v === 'none' ? undefined : v })}>
                    <SelectTrigger className="w-40 h-8"><SelectValue placeholder="Default user" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No default</SelectItem>
                      {users.filter((u) => u.active).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="hrs" className="w-16 h-8" value={s.estimatedHours ?? ''} onChange={(e) => updateStep(i, { estimatedHours: e.target.value ? parseInt(e.target.value) : undefined })} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => removeStep(i)} disabled={steps.length <= 1}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => valid && onSave({ name, description, steps: steps.map((s, i) => ({ id: `ws-${Date.now()}-${i}`, name: s.name, defaultUserId: s.defaultUserId, estimatedHours: s.estimatedHours, order: i })), active: true })} disabled={!valid}>Create Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===== New Work Order Dialog =====
function NewWorkOrderDialog({ open, onOpenChange, workflows, users, settings, onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  workflows: Workflow[]
  users: ReturnType<typeof useJewelleryStore.getState>['users']
  settings: ReturnType<typeof useJewelleryStore.getState>['settings']
  onSave: (data: Omit<WorkOrder, 'id' | 'workId' | 'createdAt' | 'updatedAt' | 'history'>) => void
}) {
  const [productName, setProductName] = React.useState('')
  const [productCode, setProductCode] = React.useState('')
  const [customerName, setCustomerName] = React.useState('')
  const [workflowId, setWorkflowId] = React.useState(workflows[0]?.id ?? '')
  const [grossWeight, setGrossWeight] = React.useState(0)
  const [purity, setPurity] = React.useState('22K')
  const [metal, setMetal] = React.useState<MetalType>('GOLD')
  const [priority, setPriority] = React.useState<WorkPriority>('NORMAL')
  const [assignedTo, setAssignedTo] = React.useState('')
  const [expectedCompletion, setExpectedCompletion] = React.useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10))
  const [notes, setNotes] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setProductName(''); setProductCode(''); setCustomerName(''); setWorkflowId(workflows[0]?.id ?? '')
      setGrossWeight(0); setPurity('22K'); setMetal('GOLD'); setPriority('NORMAL'); setAssignedTo('')
      setExpectedCompletion(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)); setNotes('')
    }
  }, [open, workflows])

  const wf = workflows.find((w) => w.id === workflowId)
  const valid = productName.trim().length > 0 && grossWeight > 0 && !!wf

  const submit = () => {
    if (!wf || !valid) return
    const firstStep = wf.steps[0]
    const assignedUser = users.find((u) => u.id === assignedTo) ?? users.find((u) => u.id === firstStep.defaultUserId)
    onSave({
      productCode: productCode || undefined,
      productName,
      customerName: customerName || undefined,
      workflowId: wf.id,
      workflowName: wf.name,
      steps: wf.steps.map((s, i) => ({
        stepId: s.id,
        stepName: s.name,
        assignedTo: i === 0 ? assignedUser?.id : undefined,
        assignedToName: i === 0 ? assignedUser?.name : undefined,
        status: i === 0 && assignedUser ? 'ASSIGNED' : 'PENDING',
        dueDate: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
      })),
      currentStepIndex: 0,
      grossWeight,
      purity,
      metal,
      priority,
      status: assignedUser ? 'ASSIGNED' : 'PENDING',
      assignedTo: assignedUser?.id,
      assignedToName: assignedUser?.name,
      startDate: new Date().toISOString(),
      expectedCompletion: new Date(expectedCompletion).toISOString(),
      notes: notes || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Work Order</DialogTitle>
          <DialogDescription>Create a production work order</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Product Name *</Label>
            <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Gold Ring — 22K" />
          </div>
          <div className="space-y-1.5">
            <Label>Product Code</Label>
            <Input value={productCode} onChange={(e) => setProductCode(e.target.value)} placeholder="SJ-RING-001" />
          </div>
          <div className="space-y-1.5">
            <Label>Customer Name</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="(optional)" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Workflow *</Label>
            <Select value={workflowId} onValueChange={setWorkflowId}>
              <SelectTrigger><SelectValue placeholder="Select workflow" /></SelectTrigger>
              <SelectContent>
                {workflows.map((w) => <SelectItem key={w.id} value={w.id}>{w.name} ({w.steps.length} steps)</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Gross Weight (g) *</Label>
            <Input type="number" step="0.001" value={grossWeight} onChange={(e) => setGrossWeight(parseFloat(e.target.value) || 0)} />
          </div>
          <div className="space-y-1.5">
            <Label>Purity</Label>
            <Select value={purity} onValueChange={setPurity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['24K', '22K', '20K', '18K', '14K', '925', 'PT950'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Metal</Label>
            <Select value={metal} onValueChange={(v) => setMetal(v as MetalType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METAL_OPTIONS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as WorkPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Assign First Step To</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger><SelectValue placeholder="(optional)" /></SelectTrigger>
              <SelectContent>
                {users.filter((u) => u.active).map((u) => <SelectItem key={u.id} value={u.id}>{u.name} — {u.specialty}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Expected Completion</Label>
            <Input type="date" value={expectedCompletion} onChange={(e) => setExpectedCompletion(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions" rows={2} />
          </div>
        </div>
        {wf && (
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs font-semibold mb-2">Workflow Steps Preview</p>
            <div className="flex items-center gap-1 flex-wrap">
              {wf.steps.map((s, i) => (
                <React.Fragment key={s.id}>
                  <Badge variant="outline" className="text-[10px]">{i + 1}. {s.name}</Badge>
                  {i < wf.steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!valid}>Create Work Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===== Work Order Detail (Sheet) =====
function WorkOrderDetail({ order, onClose, onUpdate, onUpdateStep, onAddHistory, isAdmin, currentUser }: {
  order: WorkOrder | null
  onClose: () => void
  onUpdate: (id: string, patch: Partial<WorkOrder>) => void
  onUpdateStep: (workOrderId: string, stepIndex: number, patch: Partial<WorkOrder['steps'][0]>) => void
  onAddHistory: (workOrderId: string, entry: { userName: string; action: string; details?: string }) => void
  isAdmin: boolean
  currentUser: ReturnType<typeof useJewelleryStore.getState>['currentUser']
}) {
  const { users, addWastageRecord, addNotification } = useJewelleryStore()
  const [activeTab, setActiveTab] = React.useState<'steps' | 'history'>('steps')

  if (!order) return null

  const currentStep = order.steps[order.currentStepIndex]
  const isMyStep = currentStep?.assignedTo === currentUser?.id
  const canAct = isAdmin || isMyStep

  const advanceStep = (stepIdx: number, outputWeight?: number, remarks?: string) => {
    const step = order.steps[stepIdx]
    const inputWeight = step.inputWeight ?? order.grossWeight
    const out = outputWeight ?? inputWeight
    const wastage = inputWeight - out

    // Mark current step completed
    onUpdateStep(order.id, stepIdx, {
      status: 'COMPLETED',
      outputWeight: out,
      wastage: wastage > 0 ? wastage : 0,
      completedAt: new Date().toISOString(),
      remarks: remarks || step.remarks,
    })

    // Record wastage
    if (wastage > 0) {
      addWastageRecord({
        workOrderId: order.id, workId: order.workId, stepName: step.stepName,
        userId: step.assignedTo ?? currentUser?.id ?? '', userName: step.assignedToName ?? currentUser?.name ?? '',
        inputWeight, outputWeight: out, wastageWeight: wastage, wastagePercent: (wastage / inputWeight) * 100,
        date: new Date().toISOString(),
      })
    }

    onAddHistory(order.id, {
      userName: currentUser?.name ?? 'System',
      action: 'Completed step',
      details: `${step.stepName} completed${out ? ` (${out}g${wastage > 0 ? `, ${wastage.toFixed(3)}g wastage` : ''})` : ''}`,
    })

    // Move to next step
    const nextIdx = stepIdx + 1
    if (nextIdx < order.steps.length) {
      const nextStep = order.steps[nextIdx]
      const defaultUser = users.find((u) => u.id === nextStep.assignedTo)
      onUpdateStep(order.id, nextIdx, {
        status: 'ASSIGNED',
        inputWeight: out,
        assignedTo: nextStep.assignedTo,
        assignedToName: nextStep.assignedToName ?? defaultUser?.name,
      })
      onUpdate(order.id, {
        currentStepIndex: nextIdx,
        status: 'IN_PROGRESS',
        assignedTo: nextStep.assignedTo,
        assignedToName: nextStep.assignedToName ?? defaultUser?.name,
        netWeight: out,
      })
      onAddHistory(order.id, {
        userName: currentUser?.name ?? 'System',
        action: 'Assigned next step',
        details: `${nextStep.stepName} → ${nextStep.assignedToName ?? defaultUser?.name ?? 'Unassigned'}`,
      })
      if (nextStep.assignedTo && nextStep.assignedTo !== currentUser?.id) {
        addNotification({
          type: 'WORK_ASSIGNED',
          title: 'New Work Assigned',
          message: `${nextStep.stepName} step assigned to you (${order.workId})`,
          forUserId: nextStep.assignedTo,
        })
      }
      toast.success(`Step completed. Next: ${nextStep.stepName}`)
    } else {
      // All steps done
      onUpdate(order.id, { status: 'APPROVED', actualCompletion: new Date().toISOString(), netWeight: out })
      onAddHistory(order.id, { userName: currentUser?.name ?? 'System', action: 'Work order completed', details: 'All steps finished' })
      toast.success('Work order completed!')
    }
  }

  const startStep = (stepIdx: number) => {
    const step = order.steps[stepIdx]
    onUpdateStep(order.id, stepIdx, { status: 'IN_PROGRESS', startedAt: new Date().toISOString(), inputWeight: step.inputWeight ?? order.grossWeight })
    onUpdate(order.id, { status: 'IN_PROGRESS' })
    onAddHistory(order.id, { userName: currentUser?.name ?? 'System', action: 'Started work', details: `${step.stepName} started` })
    toast.success('Work started')
  }

  const reworkStep = (stepIdx: number, targetIdx: number, remarks: string) => {
    const step = order.steps[stepIdx]
    onUpdateStep(order.id, stepIdx, { status: 'REWORK_REQUIRED', remarks })
    onUpdateStep(order.id, targetIdx, { status: 'ASSIGNED', assignedTo: order.steps[targetIdx].assignedTo, assignedToName: order.steps[targetIdx].assignedToName })
    onUpdate(order.id, { status: 'REWORK_REQUIRED', currentStepIndex: targetIdx })
    onAddHistory(order.id, { userName: currentUser?.name ?? 'System', action: 'Rework required', details: `${step.stepName} → sent back to ${order.steps[targetIdx].stepName}: ${remarks}` })
    addNotification({ type: 'REWORK_REQUIRED', title: 'Rework Required', message: `${order.workId}: ${step.stepName} sent back for rework`, forUserId: order.steps[targetIdx].assignedTo })
    toast.success('Sent back for rework')
  }

  const priorityOpt = PRIORITY_OPTIONS.find((p) => p.value === order.priority)
  const completedSteps = order.steps.filter((s) => s.status === 'COMPLETED' || s.status === 'APPROVED' || s.status === 'SKIPPED').length
  const progress = Math.round((completedSteps / order.steps.length) * 100)
  const overdueFlag = isOverdue(order.expectedCompletion) && order.status !== 'APPROVED' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED'

  return (
    <Sheet open={!!order} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 overflow-y-auto">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border sticky top-0 bg-background z-10">
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            <span>{order.workId}</span>
            <StatusBadge status={order.status} />
            <Badge variant="outline" className={`text-[10px] ${priorityOpt?.color}`}>{priorityOpt?.label}</Badge>
            {overdueFlag && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
          </SheetTitle>
          <SheetDescription className="text-left">
            {order.productName} · {order.grossWeight}g {order.purity} · Due {formatDate(order.expectedCompletion)}
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 space-y-4">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress: {completedSteps}/{order.steps.length} steps</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-muted/40 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">Product Code</p>
              <p className="font-medium">{order.productCode ?? '-'}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">Customer</p>
              <p className="font-medium">{order.customerName ?? 'Walk-in'}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">Workflow</p>
              <p className="font-medium">{order.workflowName}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-2">
              <p className="text-[10px] text-muted-foreground">Current Assignee</p>
              <p className="font-medium">{order.assignedToName ?? 'Unassigned'}</p>
            </div>
          </div>

          {order.notes && (
            <div className="bg-amber-500/10 text-amber-900 dark:text-amber-200 rounded-lg p-2 text-xs">
              <p className="font-semibold">Notes</p>
              <p>{order.notes}</p>
            </div>
          )}

          {/* Tabs: Steps / History */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'steps' | 'history')}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="steps">Steps & Timeline</TabsTrigger>
              <TabsTrigger value="history">History ({order.history.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="steps" className="space-y-2 mt-3">
              {order.steps.map((step, idx) => {
                const isCurrent = idx === order.currentStepIndex && order.status !== 'APPROVED'
                const isCompleted = step.status === 'COMPLETED' || step.status === 'APPROVED' || step.status === 'SKIPPED'
                return (
                  <StepCard
                    key={idx}
                    step={step}
                    index={idx}
                    isCurrent={isCurrent}
                    isCompleted={isCompleted}
                    canAct={canAct && isCurrent}
                    grossWeight={order.grossWeight}
                    onStart={() => startStep(idx)}
                    onComplete={(out, remarks) => advanceStep(idx, out, remarks)}
                    onRework={(targetIdx, remarks) => reworkStep(idx, targetIdx, remarks)}
                    steps={order.steps}
                    isAdmin={isAdmin}
                  />
                )
              })}
            </TabsContent>

            <TabsContent value="history" className="mt-3">
              <div className="space-y-2">
                {[...order.history].reverse().map((h) => (
                  <div key={h.id} className="flex items-start gap-3 p-2 border-l-2 border-primary/30 bg-muted/30 rounded-r-lg">
                    <History className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{h.action}</p>
                      {h.details && <p className="text-xs text-muted-foreground">{h.details}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{h.userName} · {formatDateTime(h.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function StepCard({ step, index, isCurrent, isCompleted, canAct, grossWeight, onStart, onComplete, onRework, steps, isAdmin }: {
  step: WorkOrder['steps'][0]
  index: number
  isCurrent: boolean
  isCompleted: boolean
  canAct: boolean
  grossWeight: number
  onStart: () => void
  onComplete: (outputWeight?: number, remarks?: string) => void
  onRework: (targetIdx: number, remarks: string) => void
  steps: WorkOrder['steps']
  isAdmin: boolean
}) {
  const [showComplete, setShowComplete] = React.useState(false)
  const [outputWeight, setOutputWeight] = React.useState(step.inputWeight ?? grossWeight)
  const [remarks, setRemarks] = React.useState('')
  const [showRework, setShowRework] = React.useState(false)
  const [reworkTarget, setReworkTarget] = React.useState(0)
  const [reworkRemarks, setReworkRemarks] = React.useState('')

  const wastage = (step.inputWeight ?? grossWeight) - outputWeight

  return (
    <div className={`rounded-lg border p-3 ${isCurrent ? 'border-primary bg-primary/5' : isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'}`}>
      <div className="flex items-start gap-3">
        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm">{step.stepName}</p>
            <StatusBadge status={step.status} />
          </div>
          {step.assignedToName && <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1"><User className="h-2.5 w-2.5" />{step.assignedToName}</p>}
          {(step.inputWeight || step.outputWeight) && (
            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
              {step.inputWeight && <span className="flex items-center gap-1"><Weight className="h-2.5 w-2.5" />In: {step.inputWeight}g</span>}
              {step.outputWeight && <span>Out: {step.outputWeight}g</span>}
              {step.wastage ? <span className="text-rose-600 dark:text-rose-400">Waste: {step.wastage.toFixed(3)}g</span> : null}
            </div>
          )}
          {step.startedAt && <p className="text-[10px] text-muted-foreground mt-0.5">Started: {formatDateTime(step.startedAt)}</p>}
          {step.completedAt && <p className="text-[10px] text-muted-foreground">Completed: {formatDateTime(step.completedAt)}</p>}
          {step.remarks && <p className="text-[11px] text-muted-foreground mt-1 italic">&ldquo;{step.remarks}&rdquo;</p>}

          {/* Actions */}
          {canAct && step.status === 'ASSIGNED' && (
            <Button size="sm" className="mt-2 h-7 text-xs" onClick={onStart}>
              <Hammer className="h-3 w-3 mr-1" /> Start Work
            </Button>
          )}
          {canAct && step.status === 'IN_PROGRESS' && !showComplete && (
            <Button size="sm" className="mt-2 h-7 text-xs" onClick={() => setShowComplete(true)}>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Complete Step
            </Button>
          )}
          {canAct && step.status === 'IN_PROGRESS' && showComplete && (
            <div className="mt-2 p-2 rounded-lg bg-background border border-border space-y-2">
              <div>
                <Label className="text-xs">Input Weight: {step.inputWeight ?? grossWeight}g</Label>
                <Input type="number" step="0.001" value={outputWeight} onChange={(e) => setOutputWeight(parseFloat(e.target.value) || 0)} className="h-8 mt-1" />
                {wastage > 0 && <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">Wastage: {wastage.toFixed(3)}g ({((wastage / (step.inputWeight ?? grossWeight)) * 100).toFixed(2)}%)</p>}
              </div>
              <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks (optional)" className="h-8 text-xs" />
              <div className="flex gap-1">
                <Button size="sm" className="h-7 text-xs flex-1" onClick={() => onComplete(outputWeight, remarks)}>Confirm Complete</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowComplete(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Rework (admin only, on current step) */}
          {isAdmin && isCurrent && !showRework && step.status !== 'REWORK_REQUIRED' && (
            <Button size="sm" variant="outline" className="mt-2 h-7 text-xs ml-2 text-purple-600 dark:text-purple-400" onClick={() => setShowRework(true)}>
              <AlertTriangle className="h-3 w-3 mr-1" /> Rework
            </Button>
          )}
          {isAdmin && showRework && (
            <div className="mt-2 p-2 rounded-lg bg-background border border-purple-500/30 space-y-2">
              <Label className="text-xs">Send back to which step?</Label>
              <Select value={String(reworkTarget)} onValueChange={(v) => setReworkTarget(parseInt(v))}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {steps.slice(0, index).map((s, i) => <SelectItem key={i} value={String(i)}>{i + 1}. {s.stepName}</SelectItem>)}
                </SelectContent>
              </Select>
              <Textarea value={reworkRemarks} onChange={(e) => setReworkRemarks(e.target.value)} placeholder="Rework reason" rows={2} className="text-xs" />
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 text-xs text-purple-600 dark:text-purple-400" onClick={() => { if (reworkRemarks.trim()) { onRework(reworkTarget, reworkRemarks); setShowRework(false) } }}>
                  Send for Rework
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowRework(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
