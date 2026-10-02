'use client'

import * as React from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  LineChart, Line, PieChart, Pie,
} from 'recharts'
import { BarChart3, TrendingUp, Coins, Hammer, ReceiptIndianRupee, Download, Users as UsersIcon, ShoppingCart, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatCompact, formatDate, isOverdue } from '@/lib/store'
import {
  useSales,
  usePurchases,
  useGoldStock,
  useProducts,
  useWorkOrders,
  useUsers,
  useWastageRecords,
  useSettings,
  useFinancialOverview,
} from '@/lib/hooks/use-erp-queries'

export function ReportsView() {
  const { data: salesData, isLoading: loadingSales } = useSales({ limit: 100 })
  const { data: purchasesData } = usePurchases()
  const { data: goldData } = useGoldStock()
  const { data: productsData } = useProducts()
  const { data: workOrdersData } = useWorkOrders()
  const { data: usersData } = useUsers()
  const { data: wastagesData } = useWastageRecords()
  const { data: settingsData } = useSettings()
  const { data: overviewData } = useFinancialOverview()

  const currency = settingsData?.settings?.currency || '₹'

  const sales = (salesData?.sales || []).map((s: any) => ({
    id: s.id,
    invoiceNo: s.invoiceNo,
    customerName: s.customerName,
    customerPhone: s.customerPhone,
    subtotal: Number(s.subtotalPaise || 0) / 100,
    totalGst: Number(s.totalGstPaise || 0) / 100,
    grandTotal: Number(s.grandTotalPaise || 0) / 100,
    paidAmount: Number(s.paidAmountPaise || 0) / 100,
    dueAmount: Number(s.dueAmountPaise || 0) / 100,
    status: s.status,
    paymentMode: s.paymentMode,
    createdAt: s.createdAt,
  }))

  const purchases = (purchasesData?.purchases || []).map((p: any) => ({
    id: p.id,
    purchaseId: p.purchaseNumber || p.id,
    grandTotal: Number(p.grandTotalPaise || 0) / 100,
    purchaseDate: p.purchaseDate,
  }))

  const goldStock = (goldData?.goldStocks || []).map((g: any) => ({
    id: g.id,
    stockId: g.stockId,
    materialType: g.materialType,
    purity: g.purity,
    grossWeight: Number(g.grossWeightMg || 0) / 1000,
    fineGoldWeight: Number(g.fineGoldWeightMg || 0) / 1000,
    purchaseValue: Number(g.purchaseValuePaise || 0) / 100,
    supplierName: g.supplier?.name,
    purchaseDate: g.purchaseDate,
    status: g.status,
    currentLocation: g.currentLocation,
  }))

  const products = (productsData?.products || []).map((p: any) => ({
    id: p.id,
    costPrice: Number(p.costPricePaise || 0) / 100,
    stock: Number(p.stock || 0),
  }))

  const workOrders = (workOrdersData?.workOrders || []).map((w: any) => ({
    id: w.id,
    workId: w.workId || w.orderNumber || w.id,
    productName: w.productName,
    status: w.status,
    priority: w.priority,
    assignedTo: w.assignedToId,
    assignedToName: w.assignedTo?.name,
    startDate: w.startDate || w.createdAt,
    expectedCompletion: w.expectedCompletion || w.targetDate,
    grossWeight: Number(w.grossWeightMg || 0) / 1000,
    purity: w.purity,
    steps: (w.steps || []).map((s: any) => ({
      assignedTo: s.assignedToId,
      status: s.status,
    })),
  }))

  const users = (usersData?.users || []).map((u: any) => ({
    id: u.id,
    name: u.name,
    username: u.username,
    role: u.role,
    specialty: u.specialty,
    active: u.active,
  }))

  const wastageRecords = (wastagesData?.wastages || []).map((w: any) => ({
    id: w.id,
    stepName: w.stepName || 'Production',
    inputWeight: Number(w.inputWeightMg || 0) / 1000,
    outputWeight: Number(w.outputWeightMg || 0) / 1000,
    wastageWeight: Number(w.wastageMg || 0) / 1000,
    date: w.createdAt,
  }))

  // Monthly sales (6 months)
  const monthlySales = React.useMemo(() => {
    const months: { label: string; total: number; bills: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const ms = sales.filter((s) => { const sd = new Date(s.createdAt); return sd >= d && sd < end })
      months.push({ label: d.toLocaleDateString('en-IN', { month: 'short' }), total: ms.reduce((sum, s) => sum + s.grandTotal, 0), bills: ms.length })
    }
    return months
  }, [sales])

  // Monthly purchases
  const monthlyPurchases = React.useMemo(() => {
    const months: { label: string; total: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const total = purchases.filter((p) => { const pd = new Date(p.purchaseDate); return pd >= d && pd < end }).reduce((sum, p) => sum + p.grandTotal, 0)
      months.push({ label: d.toLocaleDateString('en-IN', { month: 'short' }), total })
    }
    return months
  }, [purchases])

  // Gold by purity
  const goldByPurity = React.useMemo(() => {
    const map = new Map<string, number>()
    goldStock.filter((g) => g.status === 'AVAILABLE').forEach((g) => map.set(g.purity, (map.get(g.purity) ?? 0) + g.grossWeight))
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
  }, [goldStock])

  // Employee performance
  const employeePerf = React.useMemo(() => {
    return users.filter((u) => u.role === 'STAFF').map((u) => {
      const assigned = workOrders.filter((w) => w.steps.some((s) => s.assignedTo === u.id))
      const completed = assigned.filter((w) => w.steps.some((s) => s.assignedTo === u.id && (s.status === 'COMPLETED' || s.status === 'APPROVED')))
      const pending = assigned.filter((w) => w.steps.some((s) => s.assignedTo === u.id && (s.status === 'PENDING' || s.status === 'ASSIGNED' || s.status === 'IN_PROGRESS')))
      const overdue = assigned.filter((w) => isOverdue(w.expectedCompletion) && w.steps.some((s) => s.assignedTo === u.id && s.status !== 'COMPLETED' && s.status !== 'APPROVED' && s.status !== 'CANCELLED'))
      return { user: u, assigned: assigned.length, completed: completed.length, pending: pending.length, overdue: overdue.length }
    })
  }, [users, workOrders])

  // Wastage summary
  const wastageSummary = React.useMemo(() => {
    const totalInput = wastageRecords.reduce((s, w) => s + w.inputWeight, 0)
    const totalWastage = wastageRecords.reduce((s, w) => s + w.wastageWeight, 0)
    return { totalInput, totalWastage, pct: totalInput > 0 ? (totalWastage / totalInput) * 100 : 0 }
  }, [wastageRecords])

  const handleExportSales = () => {
    const rows = [['Invoice', 'Date', 'Customer', 'Phone', 'Subtotal', 'GST', 'Grand Total', 'Paid', 'Due', 'Status', 'Payment Mode'],
      ...sales.map((s) => [s.invoiceNo, formatDate(s.createdAt), s.customerName, s.customerPhone, s.subtotal, s.totalGst, s.grandTotal, s.paidAmount, s.dueAmount, s.status, s.paymentMode])]
    downloadCSV(rows, 'sales-report')
  }

  const handleExportWorkOrders = () => {
    const rows = [['Work ID', 'Product', 'Status', 'Priority', 'Assigned To', 'Start Date', 'Expected Completion', 'Gross Weight', 'Purity'],
      ...workOrders.map((w) => [w.workId, w.productName, w.status, w.priority, w.assignedToName ?? '-', formatDate(w.startDate), formatDate(w.expectedCompletion), w.grossWeight, w.purity])]
    downloadCSV(rows, 'work-orders-report')
  }

  const handleExportGold = () => {
    const rows = [['Stock ID', 'Material', 'Purity', 'Gross Weight', 'Fine Gold', 'Supplier', 'Purchase Date', 'Value', 'Status', 'Location'],
      ...goldStock.map((g) => [g.stockId, g.materialType, g.purity, g.grossWeight, g.fineGoldWeight.toFixed(2), g.supplierName ?? '-', formatDate(g.purchaseDate), g.purchaseValue, g.status, g.currentLocation])]
    downloadCSV(rows, 'gold-stock-report')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Reports &amp; Analytics</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Sales, inventory, production &amp; employee performance</p>
        </div>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="gst">GST</TabsTrigger>
        </TabsList>

        {/* Sales */}
        <TabsContent value="sales" className="space-y-4 mt-3">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleExportSales}><Download className="h-4 w-4 mr-1.5" /> Export Sales CSV</Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Total Sales (6mo)</p><p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(monthlySales.reduce((s, m) => s + m.total, 0), currency)}</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Total Bills (6mo)</p><p className="text-base md:text-lg font-bold mt-0.5">{monthlySales.reduce((s, m) => s + m.bills, 0)}</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Avg Bill Value</p><p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(monthlySales.reduce((s, m) => s + m.total, 0) / Math.max(1, monthlySales.reduce((s, m) => s + m.bills, 0)), currency)}</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Outstanding</p><p className="text-base md:text-lg font-bold mt-0.5 text-rose-600 dark:text-rose-400">{formatCompact(sales.reduce((s, x) => s + x.dueAmount, 0), currency)}</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Monthly Sales vs Purchase</CardTitle><CardDescription className="text-xs">6-month comparison</CardDescription></CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySales.map((m, i) => ({ label: m.label, sales: m.total, purchase: monthlyPurchases[i]?.total || 0 }))} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => formatCompact(v, '')} />
                    <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--popover-foreground)' }} formatter={(v: number, n) => [formatCurrency(v, currency), n === 'sales' ? 'Sales' : 'Purchase']} />
                    <Bar dataKey="sales" name="sales" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="purchase" name="purchase" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory */}
        <TabsContent value="inventory" className="space-y-4 mt-3">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleExportGold}><Download className="h-4 w-4 mr-1.5" /> Export Gold CSV</Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Total Gold (Gross)</p><p className="text-base md:text-lg font-bold mt-0.5">{goldStock.filter((g) => g.status === 'AVAILABLE').reduce((s, g) => s + g.grossWeight, 0).toFixed(2)}g</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Fine Gold</p><p className="text-base md:text-lg font-bold mt-0.5 text-primary">{goldStock.filter((g) => g.status === 'AVAILABLE').reduce((s, g) => s + g.fineGoldWeight, 0).toFixed(2)}g</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Finished Stock Value</p><p className="text-base md:text-lg font-bold mt-0.5">{formatCompact(products.reduce((s, p) => s + p.costPrice * p.stock, 0), currency)}</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Low Stock Items</p><p className="text-base md:text-lg font-bold mt-0.5 text-amber-600 dark:text-amber-400">{products.filter((p) => p.stock <= 2).length}</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Coins className="h-4 w-4" /> Gold Stock by Purity</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goldByPurity} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={(v) => `${v}g`} />
                    <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--popover-foreground)' }} formatter={(v: number) => [`${v}g`, 'Gross Weight']} />
                    <Bar dataKey="value" name="Weight" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production */}
        <TabsContent value="production" className="space-y-4 mt-3">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleExportWorkOrders}><Download className="h-4 w-4 mr-1.5" /> Export Work Orders CSV</Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Total Work Orders</p><p className="text-base md:text-lg font-bold mt-0.5">{workOrders.length}</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Completed</p><p className="text-base md:text-lg font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">{workOrders.filter((w) => w.status === 'APPROVED' || w.status === 'COMPLETED').length}</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Overdue</p><p className="text-base md:text-lg font-bold mt-0.5 text-rose-600 dark:text-rose-400">{workOrders.filter((w) => isOverdue(w.expectedCompletion) && w.status !== 'APPROVED' && w.status !== 'COMPLETED' && w.status !== 'CANCELLED').length}</p></CardContent></Card>
            <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Total Wastage</p><p className="text-base md:text-lg font-bold mt-0.5 text-amber-600 dark:text-amber-400">{wastageSummary.totalWastage.toFixed(3)}g ({wastageSummary.pct.toFixed(2)}%)</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Wastage by Process</CardTitle><CardDescription className="text-xs">Total: {wastageSummary.totalWastage.toFixed(3)}g ({wastageSummary.pct.toFixed(2)}% of input)</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from(new Set(wastageRecords.map((w) => w.stepName))).map((step) => {
                  const records = wastageRecords.filter((w) => w.stepName === step)
                  const totalWaste = records.reduce((s, w) => s + w.wastageWeight, 0)
                  const totalInput = records.reduce((s, w) => s + w.inputWeight, 0)
                  const pct = totalInput > 0 ? (totalWaste / totalInput) * 100 : 0
                  return (
                    <div key={step} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                      <span className="font-medium">{step}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{records.length} records</span>
                        <span className="text-rose-600 dark:text-rose-400 font-medium tabular-nums">{totalWaste.toFixed(3)}g</span>
                        <Badge variant="outline" className="text-[10px]">{pct.toFixed(2)}%</Badge>
                      </div>
                    </div>
                  )
                })}
                {wastageRecords.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No wastage records</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employees */}
        <TabsContent value="employees" className="space-y-4 mt-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><UsersIcon className="h-4 w-4" /> Employee Performance</CardTitle><CardDescription className="text-xs">Work statistics per staff member</CardDescription></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">Employee</th>
                      <th className="text-left font-medium px-3 py-2">Specialty</th>
                      <th className="text-center font-medium px-3 py-2">Assigned</th>
                      <th className="text-center font-medium px-3 py-2">Completed</th>
                      <th className="text-center font-medium px-3 py-2">Pending</th>
                      <th className="text-center font-medium px-3 py-2">Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeePerf.map((e) => (
                      <tr key={e.user.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2"><p className="font-medium text-sm">{e.user.name}</p><p className="text-[10px] text-muted-foreground">@{e.user.username}</p></td>
                        <td className="px-3 py-2 text-xs">{e.user.specialty ?? '-'}</td>
                        <td className="px-3 py-2 text-center tabular-nums">{e.assigned}</td>
                        <td className="px-3 py-2 text-center"><Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">{e.completed}</Badge></td>
                        <td className="px-3 py-2 text-center"><Badge variant="secondary" className="text-[10px]">{e.pending}</Badge></td>
                        <td className="px-3 py-2 text-center"><Badge variant={e.overdue > 0 ? 'destructive' : 'secondary'} className="text-[10px]">{e.overdue}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GST */}
        <TabsContent value="gst" className="space-y-4 mt-3">
          {(() => {
            const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            const ms = sales.filter((s) => new Date(s.createdAt) >= monthStart && s.status !== 'CANCELLED')
            const taxable = ms.reduce((s, x) => s + x.subtotal, 0)
            const cgst = ms.reduce((s, x) => s + x.totalGst / 2, 0)
            const sgst = cgst
            const totalTax = ms.reduce((s, x) => s + x.totalGst, 0)
            const grandTotal = ms.reduce((s, x) => s + x.grandTotal, 0)
            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <GstRow label="Taxable Value" value={formatCurrency(taxable, currency)} />
                  <GstRow label="CGST" value={formatCurrency(cgst, currency)} />
                  <GstRow label="SGST" value={formatCurrency(sgst, currency)} />
                  <GstRow label="Total Tax" value={formatCurrency(totalTax, currency)} highlight />
                  <GstRow label="Grand Total" value={formatCurrency(grandTotal, currency)} />
                  <GstRow label="Bills Count" value={String(ms.length)} />
                </div>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Recent Bills (GST View)</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                          <tr><th className="text-left font-medium px-2 py-2">Invoice</th><th className="text-left font-medium px-2 py-2">Customer</th><th className="text-right font-medium px-2 py-2">Taxable</th><th className="text-right font-medium px-2 py-2">GST</th><th className="text-right font-medium px-2 py-2">Total</th></tr>
                        </thead>
                        <tbody>
                          {sales.slice(0, 10).map((s) => (
                            <tr key={s.id} className="border-b border-border last:border-0">
                              <td className="px-2 py-2 font-medium">{s.invoiceNo}</td>
                              <td className="px-2 py-2 truncate max-w-[150px]">{s.customerName}</td>
                              <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(s.subtotal, currency)}</td>
                              <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(s.totalGst, currency)}</td>
                              <td className="px-2 py-2 text-right tabular-nums font-semibold">{formatCurrency(s.grandTotal, currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )
          })()}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GstRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return <div className={`rounded-lg p-3 ${highlight ? 'bg-primary/10' : 'bg-muted/40'}`}><p className="text-[11px] text-muted-foreground">{label}</p><p className={`text-base font-bold mt-0.5 ${highlight ? 'text-primary' : ''}`}>{value}</p></div>
}

function downloadCSV(rows: (string | number)[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
