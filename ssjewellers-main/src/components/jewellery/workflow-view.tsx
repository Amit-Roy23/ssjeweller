'use client'

import * as React from 'react'
import {
  Plus, Search, Workflow as WorkflowIcon, Eye, Trash2, Hammer, Clock, CheckCircle2,
  AlertTriangle, ChevronRight, ArrowRight, History, Filter, GitBranch, User, Weight, Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
import { formatDate, formatDateTime, relativeTime, isOverdue, formatCurrency } from '@/lib/store'
import { PRIORITY_OPTIONS, METAL_OPTIONS, type WorkOrder, type WorkStatusValue, type WorkPriority, type MetalType, type Workflow } from '@/lib/types'
import { StatusBadge } from './status-badge'
import {
  useWorkOrders,
  useWorkflows,
  useCreateWorkOrder,
  useUpdateWorkOrder,
  useDeleteWorkOrder,
  useUpdateWorkStep,
  useRecordQC,
  useRecordWastage,
  useCreateWorkflow,
  useDeleteWorkflow,
  useUsers,
  useAuthMe,
  useSettings,
} from '@/lib/hooks/use-erp-queries'
import { toast } from 'sonner'

const PAGE_SIZE = 8

export function WorkflowView() {
  const { data: ordersData, isLoading: loadingOrders } = useWorkOrders()
  const { data: workflowsData } = useWorkflows()
  const { data: usersData } = useUsers()
  const { data: authData } = useAuthMe()
  const { data: settingsData } = useSettings()

  const createOrderMutation = useCreateWorkOrder()
  const updateOrderMutation = useUpdateWorkOrder()
  const deleteOrderMutation = useDeleteWorkOrder()
  const updateStepMutation = useUpdateWorkStep()
  const recordWastageMutation = useRecordWastage()
  const createWorkflowMutation = useCreateWorkflow()
  const deleteWorkflowMutation = useDeleteWorkflow()

  const currentUser = authData?.user
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER'
  const isStaff = currentUser?.role === 'STAFF'

  const [tab, setTab] = React.useState<'orders' | 'templates'>('orders')
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = React.useState<string>('ALL')
  const [userFilter, setUserFilter] = React.useState<string>('ALL')
  const [page, setPage] = React.useState(1)
  const [newOpen, setNewOpen] = React.useState(false)
  const [viewOrder, setViewOrder] = React.useState<WorkOrder | null>(null)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const rawUsers = (usersData?.users || []) as any[]
  const rawWorkflows = (workflowsData?.workflows || []) as any[]

  const workflows: Workflow[] = rawWorkflows.map((w: any) => ({
    id: w.id,
    name: w.name,
    description: w.description || undefined,
    steps: (w.steps || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      defaultUserId: s.defaultUserId || undefined,
      estimatedHours: s.estimatedHours || undefined,
      order: s.order || 0,
    })),
    active: w.active ?? true,
    createdAt: w.createdAt,
  }))

  const workOrders: WorkOrder[] = (ordersData?.workOrders || []).map((w: any) => ({
    id: w.id,
    workId: w.workId || w.orderNumber || w.id,
    productCode: w.productCode || undefined,
    productName: w.productName,
    customerName: w.customerName || undefined,
    workflowId: w.workflowId,
    workflowName: w.workflow?.name || 'Production Flow',
    steps: (w.steps || []).map((s: any) => ({
      stepId: s.id,
      stepName: s.stepName || s.name,
      assignedTo: s.assignedToId || s.assignedTo?.id || undefined,
      assignedToName: s.assignedTo?.name || s.assignedToName || undefined,
      status: s.status,
      startedAt: s.startedAt ? String(s.startedAt) : undefined,
      completedAt: s.completedAt ? String(s.completedAt) : undefined,
      dueDate: s.dueDate ? String(s.dueDate) : undefined,
      inputWeight: s.inputWeightMg ? Number(s.inputWeightMg) / 1000 : undefined,
      outputWeight: s.outputWeightMg ? Number(s.outputWeightMg) / 1000 : undefined,
      wastage: s.wastageMg ? Number(s.wastageMg) / 1000 : undefined,
      remarks: s.remarks || undefined,
    })),
    currentStepIndex: w.currentStepIndex || 0,
    grossWeight: Number(w.grossWeightMg || 0) / 1000,
    netWeight: w.netWeightMg ? Number(w.netWeightMg) / 1000 : undefined,
    purity: w.purity || '22K',
    metal: w.metal || 'GOLD',
    priority: w.priority || 'NORMAL',
    status: w.status,
    assignedTo: w.assignedToId || w.assignedTo?.id || undefined,
    assignedToName: w.assignedTo?.name || w.assignedToName || undefined,
    startDate: String(w.startDate || w.createdAt),
    expectedCompletion: String(w.expectedCompletion || w.targetDate || w.createdAt),
    actualCompletion: w.actualCompletion ? String(w.actualCompletion) : undefined,
    notes: w.notes || undefined,
    history: (w.history || []).map((h: any) => ({
      id: h.id,
      timestamp: String(h.timestamp || h.createdAt),
      userName: h.userName || h.performedByName || 'System',
      action: h.action,
      details: h.details || undefined,
    })),
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }))

  const filtered = React.useMemo(() => {
    let list = workOrders
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

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteOrderMutation.mutateAsync(deleteId)
      toast.success('Work order deleted successfully')
      setDeleteId(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete work order')
    }
  }

  const handleCreateOrder = async (data: any) => {
    try {
      const payload = {
        productName: data.productName,
        productCode: data.productCode || null,
        customerName: data.customerName || null,
        workflowId: data.workflowId,
        grossWeightMg: Math.round((data.grossWeight || 0) * 1000),
        purity: data.purity || '22K',
        metal: data.metal || 'GOLD',
        priority: data.priority || 'NORMAL',
        expectedCompletion: data.expectedCompletion,
        notes: data.notes || null,
        assignedToId: data.assignedTo || null,
      }
      const res = await createOrderMutation.mutateAsync(payload)
      toast.success(`Work order ${res.workOrder?.workId || 'created'} successfully`)
      setNewOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create work order')
    }
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Pending / Assigned</p><p className="text-base md:text-lg font-bold mt-0.5">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">In Progress</p><p className="text-base md:text-lg font-bold mt-0.5 text-primary">{stats.inProgress}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Completed</p><p className="text-base md:text-lg font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">{stats.completed}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Overdue</p><p className="text-base md:text-lg font-bold mt-0.5 text-rose-600 dark:text-rose-400">{stats.overdue}</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'orders' | 'templates')}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="orders">Work Orders</TabsTrigger>
          <TabsTrigger value="templates">Workflow Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-3 mt-3">
          <Card><CardContent className="p-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search work ID, product, customer…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="APPROVED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1) }}>
                <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priority</SelectItem>
                  {PRIORITY_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent></Card>

          {loadingOrders ? (
            <Card><CardContent className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /><p className="text-sm text-muted-foreground mt-2">Loading work orders...</p></CardContent></Card>
          ) : pageItems.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><WorkflowIcon className="h-12 w-12 mx-auto text-muted-foreground/50" /><p className="text-sm text-muted-foreground mt-3">No work orders found</p></CardContent></Card>
          ) : (
            <div className="space-y-2">
              {pageItems.map((w) => {
                const priorityOpt = PRIORITY_OPTIONS.find((p) => p.value === w.priority)
                const currentStep = w.steps[w.currentStepIndex]
                const completedSteps = w.steps.filter((s) => s.status === 'COMPLETED' || s.status === 'APPROVED' || s.status === 'SKIPPED').length
                const progress = Math.round((completedSteps / Math.max(1, w.steps.length)) * 100)
                const overdueFlag = isOverdue(w.expectedCompletion) && w.status !== 'APPROVED' && w.status !== 'COMPLETED' && w.status !== 'CANCELLED'

                return (
                  <Card key={w.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{w.workId}</p>
                            <StatusBadge status={w.status} />
                            <Badge variant="outline" className={`text-[10px] ${priorityOpt?.color}`}>{priorityOpt?.label}</Badge>
                            {overdueFlag && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                          </div>
                          <p className="text-sm font-medium mt-1">{w.productName}</p>
                          <p className="text-[11px] text-muted-foreground">{w.grossWeight}g {w.purity} · {w.workflowName} · Due {formatDate(w.expectedCompletion)}</p>
                          {currentStep && (
                            <div className="mt-2 text-xs flex items-center gap-1.5">
                              <span className="text-muted-foreground">Step {w.currentStepIndex + 1}/{w.steps.length}:</span>
                              <Badge variant="secondary" className="text-[11px]">{currentStep.stepName}</Badge>
                              {currentStep.assignedToName && <span className="text-muted-foreground">({currentStep.assignedToName})</span>}
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-2 max-w-xs">
                            <Progress value={progress} className="h-1.5 flex-1" />
                            <span className="text-[10px] text-muted-foreground tabular-nums">{progress}%</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setViewOrder(w)}><Eye className="h-3.5 w-3.5 mr-1" /> Details</Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(w.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

        <TabsContent value="templates" className="mt-3">
          <WorkflowTemplates
            workflows={workflows}
            users={rawUsers}
            onCreate={async (data) => {
              try {
                await createWorkflowMutation.mutateAsync(data)
                toast.success('Workflow template created successfully')
              } catch (err: any) {
                toast.error(err.message || 'Failed to create template')
              }
            }}
            onDelete={async (id) => {
              try {
                await deleteWorkflowMutation.mutateAsync(id)
                toast.success('Workflow template deleted')
              } catch (err: any) {
                toast.error(err.message || 'Failed to delete template')
              }
            }}
          />
        </TabsContent>
      </Tabs>

      <NewWorkOrderDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        workflows={workflows}
        users={rawUsers}
        isSaving={createOrderMutation.isPending}
        onSave={handleCreateOrder}
      />

      <WorkOrderDetail
        order={viewOrder}
        onClose={() => setViewOrder(null)}
        isAdmin={isAdmin}
        currentUser={currentUser}
        onStepUpdate={async (orderId, stepData) => {
          try {
            await updateStepMutation.mutateAsync({ orderId, data: stepData })
            toast.success('Step updated successfully')
          } catch (err: any) {
            toast.error(err.message || 'Failed to update step')
          }
        }}
        onRecordWastage={async (data) => {
          try {
            await recordWastageMutation.mutateAsync(data)
          } catch {
            // Handled
          }
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this work order?</AlertDialogTitle>
            <AlertDialogDescription>The work order will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteOrderMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteOrderMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOrderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function WorkflowTemplates({ workflows, users, onCreate, onDelete }: {
  workflows: Workflow[]
  users: any[]
  onCreate: (data: any) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
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
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(wf.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <NewWorkflowDialog open={newOpen} onOpenChange={setNewOpen} users={users} onSave={async (data) => {
        await onCreate(data)
        setNewOpen(false)
      }} />
    </div>
  )
}

function NewWorkflowDialog({ open, onOpenChange, users, onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  users: any[]
  onSave: (data: any) => Promise<void>
}) {
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [steps, setSteps] = React.useState<{ name: string; defaultUserId?: string; estimatedHours?: number }[]>([
    { name: 'Gold Issue' }, { name: 'Melting' }, { name: 'Shaping' }, { name: 'Quality Check' },
  ])
  const [inFlight, setInFlight] = React.useState(false)

  const addStep = () => setSteps((s) => [...s, { name: '' }])
  const removeStep = (i: number) => setSteps((s) => s.filter((_, idx) => idx !== i))
  const updateStep = (i: number, patch: Partial<typeof steps[0]>) => setSteps((s) => s.map((st, idx) => idx === i ? { ...st, ...patch } : st))

  const valid = name.trim().length > 0 && steps.every((s) => s.name.trim().length > 0)

  const handleCreate = async () => {
    if (!valid || inFlight) return
    setInFlight(true)
    try {
      await onSave({
        name,
        description,
        steps: steps.map((s, i) => ({
          name: s.name,
          defaultUserId: s.defaultUserId,
          estimatedHours: s.estimatedHours,
          order: i,
        })),
        active: true,
      })
    } finally {
      setInFlight(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !inFlight && onOpenChange(o)}>
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
                      {users.filter((u) => u.active !== false).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={inFlight}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!valid || inFlight}>
            {inFlight ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Create Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NewWorkOrderDialog({ open, onOpenChange, workflows, users, isSaving, onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  workflows: Workflow[]
  users: any[]
  isSaving: boolean
  onSave: (data: any) => void
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
    onSave({
      productCode: productCode || undefined,
      productName,
      customerName: customerName || undefined,
      workflowId: wf.id,
      grossWeight,
      purity,
      metal,
      priority,
      assignedTo: assignedTo || undefined,
      expectedCompletion: new Date(expectedCompletion).toISOString(),
      notes: notes || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
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
                {users.filter((u) => u.active !== false).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={submit} disabled={!valid || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Create Work Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function WorkOrderDetail({ order, onClose, isAdmin, currentUser, onStepUpdate, onRecordWastage }: {
  order: WorkOrder | null
  onClose: () => void
  isAdmin: boolean
  currentUser: any
  onStepUpdate: (orderId: string, data: any) => Promise<void>
  onRecordWastage: (data: any) => Promise<void>
}) {
  const [activeTab, setActiveTab] = React.useState<'steps' | 'history'>('steps')

  if (!order) return null

  const currentStep = order.steps[order.currentStepIndex]
  const isMyStep = currentStep?.assignedTo === currentUser?.id
  const canAct = isAdmin || isMyStep

  const advanceStep = async (stepIdx: number, outputWeight?: number, remarks?: string) => {
    const step = order.steps[stepIdx]
    const inputWeight = step.inputWeight ?? order.grossWeight
    const out = outputWeight ?? inputWeight
    const wastage = inputWeight - out

    await onStepUpdate(order.id, {
      stepIndex: stepIdx,
      status: 'COMPLETED',
      outputWeightMg: Math.round(out * 1000),
      wastageMg: Math.round(Math.max(0, wastage) * 1000),
      remarks: remarks || step.remarks,
    })

    if (wastage > 0) {
      await onRecordWastage({
        workOrderId: order.id,
        stepName: step.stepName,
        inputWeightMg: Math.round(inputWeight * 1000),
        outputWeightMg: Math.round(out * 1000),
      })
    }
  }

  const startStep = async (stepIdx: number) => {
    const step = order.steps[stepIdx]
    await onStepUpdate(order.id, {
      stepIndex: stepIdx,
      status: 'IN_PROGRESS',
      inputWeightMg: Math.round((step.inputWeight ?? order.grossWeight) * 1000),
    })
  }

  const priorityOpt = PRIORITY_OPTIONS.find((p) => p.value === order.priority)
  const completedSteps = order.steps.filter((s) => s.status === 'COMPLETED' || s.status === 'APPROVED' || s.status === 'SKIPPED').length
  const progress = Math.round((completedSteps / Math.max(1, order.steps.length)) * 100)
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
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress: {completedSteps}/{order.steps.length} steps</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

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

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'steps' | 'history')}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="steps">Steps &amp; Timeline</TabsTrigger>
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

function StepCard({ step, index, isCurrent, isCompleted, canAct, grossWeight, onStart, onComplete }: {
  step: WorkOrder['steps'][0]
  index: number
  isCurrent: boolean
  isCompleted: boolean
  canAct: boolean
  grossWeight: number
  onStart: () => void
  onComplete: (outputWeight?: number, remarks?: string) => void
}) {
  const [showComplete, setShowComplete] = React.useState(false)
  const [outputWeight, setOutputWeight] = React.useState(step.inputWeight ?? grossWeight)
  const [remarks, setRemarks] = React.useState('')

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
                {wastage > 0 && <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">Wastage: {wastage.toFixed(3)}g</p>}
              </div>
              <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks (optional)" className="h-8 text-xs" />
              <div className="flex gap-1">
                <Button size="sm" className="h-7 text-xs flex-1" onClick={() => onComplete(outputWeight, remarks)}>Confirm Complete</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowComplete(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
