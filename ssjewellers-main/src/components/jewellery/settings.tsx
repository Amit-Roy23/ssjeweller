'use client'

import * as React from 'react'
import {
  Settings as SettingsIcon, Store, ReceiptIndianRupee, Gem, Sun, Moon, Monitor, RotateCcw, Save,
  Plus, Trash2, Coins, Layers, CheckSquare,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTheme } from 'next-themes'
import { useJewelleryStore } from '@/lib/store'
import { toast } from 'sonner'

export function SettingsView() {
  const { settings, updateSettings, resetAll, purities, categories, workStatuses, addPurity, updatePurity, deletePurity, addCategory, updateCategory, deleteCategory, updateWorkStatus, addWorkStatus, deleteWorkStatus } = useJewelleryStore()
  const { theme, setTheme } = useTheme()
  const [form, setForm] = React.useState(settings)
  const [resetOpen, setResetOpen] = React.useState(false)

  React.useEffect(() => setForm(settings), [settings])
  const update = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }))
  const save = () => { updateSettings(form); toast.success('Settings saved') }
  const handleReset = () => { resetAll(); toast.success('Demo data restored'); setResetOpen(false) }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, desc: 'Bright cream theme' },
    { value: 'dark', label: 'Dark', icon: Moon, desc: 'Deep charcoal theme' },
    { value: 'system', label: 'System', icon: Monitor, desc: 'Match device' },
  ] as const

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><SettingsIcon className="h-5 w-5 text-primary" /> Settings</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Configure shop, theme, masters &amp; data</p>
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
              <div className="space-y-1.5"><Label>Shop Name</Label><Input value={form.shopName} onChange={(e) => update({ shopName: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Owner Name</Label><Input value={form.ownerName} onChange={(e) => update({ ownerName: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => update({ phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => update({ address: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={(e) => update({ city: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Pincode</Label><Input value={form.pincode} onChange={(e) => update({ pincode: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>GSTIN</Label><Input value={form.gstin} onChange={(e) => update({ gstin: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>PAN</Label><Input value={form.pan} onChange={(e) => update({ pan: e.target.value })} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ReceiptIndianRupee className="h-4 w-4" /> Billing &amp; Rates</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>GST Rate (%)</Label><Input type="number" step="0.1" value={form.defaultGstRate} onChange={(e) => update({ defaultGstRate: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1.5"><Label>Currency Symbol</Label><Input value={form.currency} onChange={(e) => update({ currency: e.target.value })} maxLength={2} /></div>
              <div className="space-y-1.5"><Label className="flex items-center gap-1"><Gem className="h-3 w-3" /> Gold Rate 24K (₹/g)</Label><Input type="number" value={form.defaultGoldRate24K} onChange={(e) => update({ defaultGoldRate24K: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1.5"><Label>Silver Rate (₹/kg)</Label><Input type="number" value={form.defaultSilverRate} onChange={(e) => update({ defaultSilverRate: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1.5"><Label>Invoice Prefix</Label><Input value={form.invoicePrefix} onChange={(e) => update({ invoicePrefix: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Work Order Prefix</Label><Input value={form.workOrderPrefix} onChange={(e) => update({ workOrderPrefix: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Invoice Footer</Label><Input value={form.invoiceFooter} onChange={(e) => update({ invoiceFooter: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Terms &amp; Conditions</Label><Input value={form.termsConditions} onChange={(e) => update({ termsConditions: e.target.value })} /></div>
            </CardContent>
            <CardFooter className="justify-end pt-3"><Button onClick={save}><Save className="h-4 w-4 mr-1.5" /> Save Changes</Button></CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Data Management</CardTitle><CardDescription className="text-xs">All data stored locally in browser (localStorage)</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                <div><p className="text-sm font-medium">Reset to Demo Data</p><p className="text-[11px] text-muted-foreground">Restore all seed data (users, inventory, work orders, sales, etc.)</p></div>
                <Button variant="outline" onClick={() => setResetOpen(true)}><RotateCcw className="h-4 w-4 mr-1.5" /> Reset</Button>
              </div>
            </CardContent>
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
                  <Input value={p.label} onChange={(e) => updatePurity(p.id, { label: e.target.value })} className="w-24 h-8" />
                  <Input type="number" step="0.1" value={p.percentage} onChange={(e) => updatePurity(p.id, { percentage: parseFloat(e.target.value) || 0 })} className="w-24 h-8" />
                  <Badge variant="outline" className="text-[10px]">{p.metal}</Badge>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => updatePurity(p.id, { active: !p.active })}>{p.active ? 'Active' : 'Inactive'}</Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePurity(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={() => addPurity({ label: 'NEW', percentage: 0, metal: 'GOLD', active: true })}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Purity</Button>
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
                    <Input value={c.name} onChange={(e) => updateCategory(c.id, { name: e.target.value })} className="h-8 flex-1 text-sm" />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => deleteCategory(c.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => addCategory({ name: 'New Category', active: true })}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Category</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statuses */}
        <TabsContent value="statuses" className="mt-3">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Work Statuses</CardTitle><CardDescription className="text-xs">Manage workflow statuses. Used ones should be deactivated, not deleted.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {workStatuses.map((s) => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                  <Badge variant="outline" className={`text-[10px] ${s.color}`}>{s.label}</Badge>
                  <span className="text-xs text-muted-foreground flex-1">{s.value}</span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateWorkStatus(s.id, { active: !s.active })}>{s.active ? 'Active' : 'Inactive'}</Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteWorkStatus(s.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={() => addWorkStatus({ value: 'NEW_STATUS' as any, label: 'New Status', color: 'bg-muted text-muted-foreground', active: true })}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Status</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-[11px] text-muted-foreground text-center pb-4">
        S.S JEWELLERY Management System · Built with Next.js 16 + shadcn/ui · Light &amp; Dark Mode · Mobile Friendly
      </p>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Reset all data?</AlertDialogTitle><AlertDialogDescription>This will erase all current data and restore the demo seed. You will be logged out. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
