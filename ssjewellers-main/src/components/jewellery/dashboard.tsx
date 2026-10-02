'use client'

import * as React from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts'
import {
  Coins, Package, ReceiptIndianRupee, ShoppingCart, Clock, CheckCircle2, AlertTriangle,
  Users, TrendingUp, TrendingDown, Gem, ArrowRight, Hammer, Sparkles, UserCheck, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatCompact, formatDate, relativeTime, isOverdue, type ViewKey } from '@/lib/store'
import { StatusBadge } from './status-badge'
import {
  useSales,
  usePurchases,
  useGoldStock,
  useProducts,
  useCustomers,
  useWorkOrders,
  useSettings,
  useAuthMe,
} from '@/lib/hooks/use-erp-queries'

interface DashboardProps {
  onNavigate: (v: ViewKey) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { data: salesData, isLoading: loadingSales } = useSales({ limit: 50 })
  const { data: purchasesData } = usePurchases()
  const { data: goldData } = useGoldStock()
  const { data: productsData } = useProducts()
  const { data: customersData } = useCustomers()
  const { data: workOrdersData } = useWorkOrders()
  const { data: settingsData } = useSettings()
  const { data: authData } = useAuthMe()

  const currency = settingsData?.settings?.currency || '₹'
  const currentUser = authData?.user
  const goldRate24K = Number(settingsData?.settings?.defaultGoldRate24K || 7200)
  const shopName = settingsData?.settings?.shopName || 'S.S. Jewellery'

  const sales = (salesData?.sales || []).map((s: any) => ({
    id: s.id,
    invoiceNo: s.invoiceNo,
    customerName: s.customerName,
    grandTotal: Number(s.grandTotalPaise || 0) / 100,
    dueAmount: Number(s.dueAmountPaise || 0) / 100,
    status: s.status,
    items: s.items || [],
    createdAt: s.createdAt,
  }))

  const purchases = (purchasesData?.purchases || []).map((p: any) => ({
    id: p.id,
    grandTotal: Number(p.grandTotalPaise || 0) / 100,
    purchaseDate: p.purchaseDate,
  }))

  const goldStock = (goldData?.goldStocks || []).map((g: any) => ({
    id: g.id,
    stockId: g.stockId,
    grossWeight: Number(g.grossWeightMg || 0) / 1000,
    fineGoldWeight: Number(g.fineGoldWeightMg || 0) / 1000,
    purchaseValue: Number(g.purchaseValuePaise || 0) / 100,
    status: g.status,
  }))

  const products = (productsData?.products || []).map((p: any) => ({
    id: p.id,
    costPrice: Number(p.costPricePaise || 0) / 100,
    metal: p.metal || 'GOLD',
    stock: Number(p.stock || 0),
  }))

  const customers = customersData?.customers || []

  const workOrders = (workOrdersData?.workOrders || []).map((w: any) => ({
    id: w.id,
    workId: w.workId || w.orderNumber || w.id,
    productName: w.productName,
    status: w.status,
    assignedTo: w.assignedToId,
    assignedToName: w.assignedTo?.name,
    expectedCompletion: w.expectedCompletion || w.targetDate,
    grossWeight: Number(w.grossWeightMg || 0) / 1000,
    purity: w.purity || '22K',
    updatedAt: w.updatedAt || w.createdAt,
    steps: (w.steps || []).map((s: any) => ({
      stepName: s.stepName || s.name,
      status: s.status,
      assignedTo: s.assignedToId,
    })),
  }))

  const todayStart = React.useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const salesToday = sales.filter((s) => new Date(s.createdAt) >= todayStart)
  const purchasesToday = purchases.filter((p) => new Date(p.purchaseDate) >= todayStart)
  const totalToday = salesToday.reduce((s, x) => s + x.grandTotal, 0)
  const purchaseToday = purchasesToday.reduce((s, x) => s + x.grandTotal, 0)

  // Gold stats
  const availableGold = goldStock.filter((g) => g.status === 'AVAILABLE')
  const totalGoldGross = availableGold.reduce((s, g) => s + g.grossWeight, 0)
  const totalFineGold = availableGold.reduce((s, g) => s + g.fineGoldWeight, 0)
  const goldValue = availableGold.reduce((s, g) => s + g.purchaseValue, 0)

  // Product stats
  const finishedStockValue = products.reduce((s, p) => s + p.costPrice * p.stock, 0)
  const finishedUnits = products.reduce((s, p) => s + p.stock, 0)
  const lowStock = products.filter((p) => p.stock <= 2)

  // Work order stats
  const pendingWork = workOrders.filter((w) => w.status === 'PENDING' || w.status === 'ASSIGNED')
  const inProgressWork = workOrders.filter((w) => w.status === 'IN_PROGRESS')
  const completedWork = workOrders.filter((w) => w.status === 'APPROVED' || w.status === 'COMPLETED')
  const overdueWork = workOrders.filter((w) => isOverdue(w.expectedCompletion) && w.status !== 'APPROVED' && w.status !== 'COMPLETED' && w.status !== 'CANCELLED')
  const reworkWork = workOrders.filter((w) => w.status === 'REWORK_REQUIRED')

  // Outstanding payments
  const outstanding = sales.reduce((s, x) => s + x.dueAmount, 0)

  // === Sales chart (14 days) ===
  const chartData = React.useMemo(() => {
    const days: { label: string; total: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 86400000)
      const next = new Date(d.getTime() + 86400000)
      const total = sales.filter((s) => { const sd = new Date(s.createdAt); return sd >= d && sd < next }).reduce((sum, s) => sum + s.grandTotal, 0)
      days.push({ label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), total })
    }
    return days
  }, [sales, todayStart])

  // === Workflow summary by process ===
  const processSummary = React.useMemo(() => {
    const processes = ['Gold Issue', 'Melting', 'Shaping', 'Design & Cutting', 'Polishing', 'Stone Setting', 'Finishing', 'Quality Check']
    return processes.map((proc) => {
      const matching = workOrders.filter((w) => w.steps.some((s: any) => s.stepName === proc))
      const pending = matching.filter((w) => { const step = w.steps.find((s: any) => s.stepName === proc); return step && (step.status === 'PENDING' || step.status === 'ASSIGNED') }).length
      const inProg = matching.filter((w) => { const step = w.steps.find((s: any) => s.stepName === proc); return step && step.status === 'IN_PROGRESS' }).length
      const completed = matching.filter((w) => { const step = w.steps.find((s: any) => s.stepName === proc); return step && (step.status === 'COMPLETED' || step.status === 'APPROVED') }).length
      return { process: proc, total: matching.length, pending, inProgress: inProg, completed }
    }).filter((p) => p.total > 0)
  }, [workOrders])

  // === Metal mix ===
  const metalMix = React.useMemo(() => {
    const map = new Map<string, number>()
    products.forEach((p) => map.set(p.metal, (map.get(p.metal) ?? 0) + p.costPrice * p.stock))
    const colors: Record<string, string> = { GOLD: 'var(--chart-1)', SILVER: 'var(--chart-2)', DIAMOND: 'var(--chart-3)', PLATINUM: 'var(--chart-4)', OTHER: 'var(--chart-5)' }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value, color: colors[name] ?? 'var(--chart-5)' }))
  }, [products])

  const recentSales = sales.slice(0, 5)
  const recentWork = [...workOrders].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5)

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER'

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-xl bg-gold-gradient text-white p-4 md:p-6">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs opacity-90 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Welcome, {currentUser?.name?.split(' ')[0] || 'User'}
            </p>
            <h1 className="text-xl md:text-2xl font-bold mt-1">{shopName} Dashboard</h1>
            <p className="text-sm opacity-90 mt-1">
              {salesToday.length} sales · {purchasesToday.length} purchases today
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="bg-white/15 backdrop-blur rounded-lg px-3 py-2">
              <p className="text-[10px] opacity-80 uppercase tracking-wide">Today&apos;s Gold Rate · 24K</p>
              <p className="text-lg md:text-xl font-bold">
                ₹{goldRate24K.toLocaleString('en-IN')}
                <span className="text-xs opacity-80 font-normal ml-1">/g</span>
              </p>
            </div>
            {isAdmin && (
              <Button size="sm" variant="secondary" className="bg-white text-amber-900 hover:bg-white/90" onClick={() => onNavigate('sales')}>
                <ReceiptIndianRupee className="h-4 w-4 mr-1" /> New Bill
              </Button>
            )}
          </div>
        </div>
        <Gem className="absolute -right-6 -bottom-6 h-32 w-32 opacity-10" />
      </div>

      {/* KPI cards — Inventory */}
      {isAdmin && (
        <>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Inventory</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard title="Total Gold Stock" value={`${totalGoldGross.toFixed(1)}g`} subtitle={`Fine: ${totalFineGold.toFixed(1)}g · ${formatCompact(goldValue, currency)}`} icon={Coins} tone="primary" onClick={() => onNavigate('gold')} />
              <KpiCard title="Finished Jewellery" value={`${finishedUnits} units`} subtitle={formatCompact(finishedStockValue, currency)} icon={Package} tone="info" onClick={() => onNavigate('products')} />
              <KpiCard title="Total Customers" value={String(customers.length)} subtitle={`${sales.length} total bills`} icon={Users} tone="success" onClick={() => onNavigate('customers')} />
              <KpiCard title="Low Stock Items" value={String(lowStock.length)} subtitle={lowStock.length > 0 ? 'Needs attention' : 'All stocked'} icon={AlertTriangle} tone="warning" onClick={() => onNavigate('products')} />
            </div>
          </div>

          {/* KPI cards — Production */}
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Production</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard title="Pending Work" value={String(pendingWork.length)} subtitle="Awaiting start" icon={Clock} tone="info" onClick={() => onNavigate('workflow')} />
              <KpiCard title="In Progress" value={String(inProgressWork.length)} subtitle="Active production" icon={Hammer} tone="primary" onClick={() => onNavigate('workflow')} />
              <KpiCard title="Overdue" value={String(overdueWork.length)} subtitle="Past deadline" icon={AlertTriangle} tone="warning" onClick={() => onNavigate('workflow')} />
              <KpiCard title="Rework Required" value={String(reworkWork.length)} subtitle="QC rejected" icon={AlertTriangle} tone="warning" onClick={() => onNavigate('workflow')} />
            </div>
          </div>

          {/* KPI cards — Business */}
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Business</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard title="Today's Sales" value={formatCompact(totalToday, currency)} subtitle={`${salesToday.length} bills`} icon={ReceiptIndianRupee} tone="success" onClick={() => onNavigate('sales')} />
              <KpiCard title="Today's Purchase" value={formatCompact(purchaseToday, currency)} subtitle={`${purchasesToday.length} orders`} icon={ShoppingCart} tone="info" onClick={() => onNavigate('purchase')} />
              <KpiCard title="Outstanding" value={formatCompact(outstanding, currency)} subtitle="Due from customers" icon={TrendingDown} tone="warning" onClick={() => onNavigate('sales')} />
              <KpiCard title="Completed Work" value={String(completedWork.length)} subtitle="Finished jewellery" icon={CheckCircle2} tone="success" onClick={() => onNavigate('workflow')} />
            </div>
          </div>
        </>
      )}

      {/* Staff dashboard — only their assigned work */}
      {!isAdmin && (
        <StaffWorkSummary workOrders={workOrders} currentUser={currentUser} onNavigate={onNavigate} />
      )}

      {/* Charts row */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Sales — Last 14 Days</CardTitle>
                  <CardDescription className="text-xs">Daily revenue trend</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">{formatCompact(chartData.reduce((s, d) => s + d.total, 0), currency)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] md:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} interval={1} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => formatCompact(v, '')} />
                    <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--popover-foreground)' }} formatter={(v: number) => [formatCurrency(v, currency), 'Revenue']} />
                    <Area type="monotone" dataKey="total" stroke="var(--chart-1)" strokeWidth={2} fill="url(#salesGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Stock by Metal</CardTitle>
              <CardDescription className="text-xs">Value distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={metalMix} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={75} paddingAngle={2} stroke="var(--background)" strokeWidth={2}>
                      {metalMix.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--popover-foreground)' }} formatter={(v: number, n) => [formatCurrency(v, currency), n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-3">
                {metalMix.map((m) => (
                  <div key={m.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                      <span className="font-medium">{m.name}</span>
                    </div>
                    <span className="text-muted-foreground">{formatCompact(m.value, currency)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workflow summary table */}
      {isAdmin && processSummary.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Hammer className="h-4 w-4 text-primary" /> Workflow Summary</CardTitle>
            <CardDescription className="text-xs">Work orders by process stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Process</th>
                    <th className="text-center font-medium px-3 py-2">Total</th>
                    <th className="text-center font-medium px-3 py-2">Pending</th>
                    <th className="text-center font-medium px-3 py-2">In Progress</th>
                    <th className="text-center font-medium px-3 py-2">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {processSummary.map((p) => (
                    <tr key={p.process} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{p.process}</td>
                      <td className="px-3 py-2 text-center tabular-nums">{p.total}</td>
                      <td className="px-3 py-2 text-center"><Badge variant="secondary" className="text-[10px]">{p.pending}</Badge></td>
                      <td className="px-3 py-2 text-center"><Badge className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">{p.inProgress}</Badge></td>
                      <td className="px-3 py-2 text-center"><Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">{p.completed}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Bills</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate('sales')}>View all <ArrowRight className="h-3 w-3 ml-1" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentSales.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No sales yet</p> : (
                <div className="space-y-2.5">
                  {recentSales.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{s.customerName}</p>
                          <StatusBadge status={s.status} />
                        </div>
                        <p className="text-[11px] text-muted-foreground">{s.invoiceNo} · {relativeTime(s.createdAt)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">{formatCurrency(s.grandTotal, currency)}</p>
                        <p className="text-[11px] text-muted-foreground">{s.items.length} items</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Work Orders</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigate('workflow')}>View all <ArrowRight className="h-3 w-3 ml-1" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentWork.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No work orders</p> : (
                <div className="space-y-2.5">
                  {recentWork.map((w) => (
                    <div key={w.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{w.workId}</p>
                          <StatusBadge status={w.status} />
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{w.productName} · {w.assignedToName ?? 'Unassigned'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">{w.grossWeight}g</p>
                        <p className="text-[11px] text-muted-foreground">{relativeTime(w.updatedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function StaffWorkSummary({ workOrders, currentUser, onNavigate }: {
  workOrders: any[]
  currentUser: any
  onNavigate: (v: ViewKey) => void
}) {
  const myWork = workOrders.filter((w) => w.assignedTo === currentUser?.id)
  const pending = myWork.filter((w) => w.status === 'PENDING' || w.status === 'ASSIGNED')
  const inProgress = myWork.filter((w) => w.status === 'IN_PROGRESS')
  const completed = myWork.filter((w) => w.status === 'COMPLETED' || w.status === 'APPROVED')
  const overdue = myWork.filter((w) => isOverdue(w.expectedCompletion) && w.status !== 'APPROVED' && w.status !== 'COMPLETED' && w.status !== 'CANCELLED')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="My Pending Work" value={String(pending.length)} subtitle="Awaiting start" icon={Clock} tone="info" onClick={() => onNavigate('workflow')} />
        <KpiCard title="In Progress" value={String(inProgress.length)} subtitle="Currently working" icon={Hammer} tone="primary" onClick={() => onNavigate('workflow')} />
        <KpiCard title="Overdue" value={String(overdue.length)} subtitle="Past deadline" icon={AlertTriangle} tone="warning" onClick={() => onNavigate('workflow')} />
        <KpiCard title="Completed" value={String(completed.length)} subtitle="Finished work" icon={CheckCircle2} tone="success" onClick={() => onNavigate('workflow')} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">My Active Work</CardTitle>
          <CardDescription className="text-xs">Work assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          {myWork.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No work assigned to you yet</p> : (
            <div className="space-y-2">
              {myWork.slice(0, 5).map((w) => (
                <div key={w.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{w.workId}</p>
                      <StatusBadge status={w.status} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{w.productName} · {w.grossWeight}g {w.purity}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onNavigate('workflow')}>Update</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  title, value, subtitle, icon: Icon, tone, onClick,
}: {
  title: string
  value: string
  subtitle?: React.ReactNode
  icon: React.ElementType
  tone: 'primary' | 'success' | 'info' | 'warning'
  onClick?: () => void
}) {
  const toneClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    info: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }[tone]

  return (
    <Card className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={onClick}>
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">{title}</p>
            <p className="text-lg md:text-2xl font-bold mt-1 truncate">{value}</p>
            <div className="text-[11px] mt-1">{subtitle}</div>
          </div>
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${toneClasses}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
