'use client'

import * as React from 'react'
import {
  Settings as SettingsIcon, Store, ReceiptIndianRupee, Gem, Sun, Moon, Monitor, Save,
  Plus, Trash2, Coins, Layers, CheckSquare, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTheme } from 'next-themes'
import {
  useSettings,
  useUpdateSettings,
  usePurities,
  useCreatePurity,
  useUpdatePurity,
  useDeletePurity,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useWorkStatuses,
  useCreateWorkStatus,
  useUpdateWorkStatus,
  useDeleteWorkStatus,
} from '@/lib/hooks/use-erp-queries'
import { toast } from 'sonner'

export function SettingsView() {
  const { theme, setTheme } = useTheme()

  const { data: settingsData, isLoading: loadingSettings } = useSettings()
  const { data: puritiesData } = usePurities()
  const { data: categoriesData } = useCategories()
  const { data: statusesData } = useWorkStatuses()

  const updateSettingsMutation = useUpdateSettings()
  const createPurityMutation = useCreatePurity()
  const updatePurityMutation = useUpdatePurity()
  const deletePurityMutation = useDeletePurity()

  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()

  const createStatusMutation = useCreateWorkStatus()
  const updateStatusMutation = useUpdateWorkStatus()
  const deleteStatusMutation = useDeleteWorkStatus()

  const purities = (puritiesData?.purities || []) as any[]
  const categories = (categoriesData?.categories || []) as any[]
  const workStatuses = (statusesData?.statuses || []) as any[]

  const [form, setForm] = React.useState<any>({
    shopName: 'S.S. Jewellery',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    pincode: '',
    gstin: '',
    pan: '',
    defaultGstRate: 3,
    currency: '₹',
    defaultGoldRate24K: 7250,
    defaultSilverRate: 94500,
    invoicePrefix: 'INV-2026',
    workOrderPrefix: 'WF',
    invoiceFooter: 'Thank you for your business! Visit again.',
    termsConditions: '1. Goods once sold will not be taken back.\n2. All disputes subject to Surat jurisdiction.\n3. Gold rate applicable as on date of bill.',
  })

  React.useEffect(() => {
    if (settingsData?.settings) {
      const s = settingsData.settings
      setForm((prev: any) => ({
        ...prev,
        ...s,
        shopName: s.shopName ?? 'S.S. Jewellery',
        ownerName: s.ownerName ?? '',
        phone: s.phone ?? '',
        email: s.email ?? '',
        address: s.address ?? '',
        city: s.city ?? '',
        pincode: s.pincode ?? '',
        gstin: s.gstin ?? '',
        pan: s.pan ?? '',
        currency: s.currency ?? '₹',
        defaultGoldRate24K: s.defaultGoldRate24K ?? (s.defaultGoldRate24KPaise ? Number(s.defaultGoldRate24KPaise) / 100 : 7250),
        defaultSilverRate: s.defaultSilverRate ?? (s.defaultSilverRatePaisePerKg ? Number(s.defaultSilverRatePaisePerKg) / 100 : 94500),
        defaultGstRate: s.defaultGstRate ?? (s.defaultGstRateBps ? Number(s.defaultGstRateBps) / 100 : 3),
        invoicePrefix: s.invoicePrefix ?? 'INV-2026',
        workOrderPrefix: s.workOrderPrefix ?? 'WF',
        invoiceFooter: s.invoiceFooter ?? '',
        termsConditions: s.termsConditions ?? '',
      }))
    }
  }, [settingsData])

  const update = (patch: Partial<typeof form>) => setForm((f: any) => ({ ...f, ...patch }))

  const save = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        ...form,
        defaultGoldRate24K: Number(form.defaultGoldRate24K) || 0,
        defaultSilverRate: Number(form.defaultSilverRate) || 0,
        defaultGstRate: Number(form.defaultGstRate) || 0,
      })
      toast.success('Settings and rates saved successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings')
    }
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, desc: 'Bright cream theme' },
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Deep charcoal theme' },
    { value: 'system', label: 'System', icon: Monitor, desc: 'Match device' },
  ] as const

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><SettingsIcon className="h-5 w-5 text-primary" /> Settings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Configure shop, theme, rates, masters &amp; cloud database settings</p>
        </div>
        <Button onClick={save} disabled={updateSettingsMutation.isPending} className="self-start sm:self-auto">
          {updateSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="purity">Purity</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="statuses">Statuses</TabsTrigger>
        </TabsList>

        {/* Company */}
        <TabsContent value="company" className="space-y-4 mt-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Store className="h-4 w-4" /> Shop Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Shop Name</Label><Input value={form.shopName ?? ''} onChange={(e) => update({ shopName: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  Owner / Admin Name
                  <Badge variant="secondary" className="text-[10px] font-normal py-0">Syncs with Admin</Badge>
                </Label>
                <Input value={form.ownerName ?? ''} onChange={(e) => update({ ownerName: e.target.value })} placeholder="Full name of shop owner / admin" />
              </div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone ?? ''} onChange={(e) => update({ phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email ?? ''} onChange={(e) => update({ email: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Input value={form.address ?? ''} onChange={(e) => update({ address: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>City</Label><Input value={form.city ?? ''} onChange={(e) => update({ city: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Pincode</Label><Input value={form.pincode ?? ''} onChange={(e) => update({ pincode: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>GSTIN</Label><Input value={form.gstin ?? ''} onChange={(e) => update({ gstin: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>PAN</Label><Input value={form.pan ?? ''} onChange={(e) => update({ pan: e.target.value })} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ReceiptIndianRupee className="h-4 w-4" /> Billing &amp; Rates</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>GST Rate (%)</Label><Input type="number" step="0.1" value={form.defaultGstRate ?? 3} onChange={(e) => update({ defaultGstRate: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1.5"><Label>Currency Symbol</Label><Input value={form.currency ?? '₹'} onChange={(e) => update({ currency: e.target.value })} maxLength={2} /></div>
              <div className="space-y-1.5"><Label className="flex items-center gap-1"><Gem className="h-3 w-3" /> Gold Rate 24K (₹/g)</Label><Input type="number" value={form.defaultGoldRate24K ?? 7250} onChange={(e) => update({ defaultGoldRate24K: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1.5"><Label>Silver Rate (₹/kg)</Label><Input type="number" value={form.defaultSilverRate ?? 94500} onChange={(e) => update({ defaultSilverRate: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1.5"><Label>Invoice Prefix</Label><Input value={form.invoicePrefix ?? 'INV-2026'} onChange={(e) => update({ invoicePrefix: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Work Order Prefix</Label><Input value={form.workOrderPrefix ?? 'WF'} onChange={(e) => update({ workOrderPrefix: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Invoice Footer</Label><Input value={form.invoiceFooter ?? ''} onChange={(e) => update({ invoiceFooter: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Terms &amp; Conditions</Label><Input value={form.termsConditions ?? ''} onChange={(e) => update({ termsConditions: e.target.value })} /></div>
            </CardContent>
            <CardFooter className="justify-end pt-3 border-t">
              <Button onClick={save} disabled={updateSettingsMutation.isPending}>
                {updateSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Theme */}
        <TabsContent value="theme" className="mt-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Sun className="h-4 w-4" /> Appearance</CardTitle><CardDescription className="text-xs">Light &amp; dark mode — works on mobile &amp; desktop</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map((opt) => {
                  const Icon = opt.icon
                  const isActive = theme === opt.value
                  return (
                    <button key={opt.value} onClick={() => setTheme(opt.value)} className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 p-4 transition-all ${isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                      <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground text-center">{opt.desc}</span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purity */}
        <TabsContent value="purity" className="mt-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Coins className="h-4 w-4" /> Purity Master</CardTitle><CardDescription className="text-xs">Manage gold/silver purity options</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {purities.map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                  <Input value={p.label} onChange={(e) => updatePurityMutation.mutate({ id: p.id, data: { label: e.target.value } })} className="w-24 h-8" />
                  <Input type="number" step="0.1" value={p.percentage} onChange={(e) => updatePurityMutation.mutate({ id: p.id, data: { percentage: parseFloat(e.target.value) || 0 } })} className="w-24 h-8" />
                  <Badge variant="outline" className="text-[10px]">{p.metal}</Badge>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => updatePurityMutation.mutate({ id: p.id, data: { active: !p.active } })}>{p.active ? 'Active' : 'Inactive'}</Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePurityMutation.mutate(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={() => createPurityMutation.mutate({ label: 'NEW', percentage: 75.0, metal: 'GOLD', active: true })}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Purity</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="mt-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4" /> Product Categories</CardTitle><CardDescription className="text-xs">Manage jewellery product categories</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center gap-1 p-2 rounded-lg border border-border">
                    <Input value={c.name} onChange={(e) => updateCategoryMutation.mutate({ id: c.id, data: { name: e.target.value } })} className="h-8 flex-1 text-sm" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => deleteCategoryMutation.mutate(c.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => createCategoryMutation.mutate({ name: 'New Category', active: true })}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Category</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statuses */}
        <TabsContent value="statuses" className="mt-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Work Statuses</CardTitle><CardDescription className="text-xs">Manage workflow statuses.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {workStatuses.map((s) => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                  <Badge variant="outline" className={`text-[10px] ${s.color}`}>{s.label}</Badge>
                  <span className="text-xs text-muted-foreground flex-1">{s.value}</span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateStatusMutation.mutate({ id: s.id, data: { active: !s.active } })}>{s.active ? 'Active' : 'Inactive'}</Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteStatusMutation.mutate(s.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={() => createStatusMutation.mutate({ value: `STATUS_${Date.now().toString().slice(-4)}`, label: 'New Status', color: 'bg-muted text-muted-foreground', active: true })}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Status</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-[11px] text-muted-foreground text-center pb-4">
        S.S JEWELLERY ERP Management System · PostgreSQL &amp; React Query Powered
      </p>
    </div>
  )
}
