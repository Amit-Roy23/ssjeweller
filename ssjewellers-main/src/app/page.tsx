'use client'

import * as React from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import {
  LayoutDashboard, Workflow, Package, ShoppingCart, ReceiptIndianRupee,
  Users, Truck, BarChart3, UserCog, ScrollText, Settings, Gem, Menu, Search, Bell, LogOut, Coins, KeyRound, Lock, Eye, EyeOff, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { useJewelleryStore, relativeTime, ViewKey } from '@/lib/store'
import { useAuthMe, useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useSettings, queryKeys } from '@/lib/hooks/use-erp-queries'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { LoginPage } from '@/components/jewellery/login-page'
import { Dashboard } from '@/components/jewellery/dashboard'
import { WorkflowView } from '@/components/jewellery/workflow-view'
import { GoldInventoryView } from '@/components/jewellery/gold-inventory'
import { StoneInventoryView } from '@/components/jewellery/stone-inventory'
import { ProductsView } from '@/components/jewellery/products'
import { PurchaseView } from '@/components/jewellery/purchase'
import { SalesView } from '@/components/jewellery/sales'
import { CustomersView } from '@/components/jewellery/customers'
import { SuppliersView } from '@/components/jewellery/suppliers'
import { ReportsView } from '@/components/jewellery/reports'
import { UsersView } from '@/components/jewellery/users'
import { AuditLogView } from '@/components/jewellery/audit-log'
import { SettingsView } from '@/components/jewellery/settings'

interface NavItem {
  key: ViewKey
  label: string
  icon: React.ElementType
  description: string
  roles: ('ADMIN' | 'MANAGER' | 'STAFF')[]
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & KPIs', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { key: 'workflow', label: 'Workflow', icon: Workflow, description: 'Production & work orders', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { key: 'gold', label: 'Gold Stock', icon: Coins, description: 'Raw material inventory', roles: ['ADMIN', 'MANAGER'] },
  { key: 'stones', label: 'Stones', icon: Gem, description: 'Stone & diamond inventory', roles: ['ADMIN', 'MANAGER'] },
  { key: 'products', label: 'Products', icon: Package, description: 'Finished jewellery', roles: ['ADMIN', 'MANAGER'] },
  { key: 'purchase', label: 'Purchase', icon: ShoppingCart, description: 'Purchases & suppliers', roles: ['ADMIN', 'MANAGER'] },
  { key: 'sales', label: 'Sales', icon: ReceiptIndianRupee, description: 'Bills & invoicing', roles: ['ADMIN', 'MANAGER'] },
  { key: 'customers', label: 'Customers', icon: Users, description: 'Customer master', roles: ['ADMIN', 'MANAGER'] },
  { key: 'suppliers', label: 'Suppliers', icon: Truck, description: 'Supplier master', roles: ['ADMIN', 'MANAGER'] },
  { key: 'reports', label: 'Reports', icon: BarChart3, description: 'Analytics & exports', roles: ['ADMIN', 'MANAGER'] },
  { key: 'users', label: 'Users', icon: UserCog, description: 'User management', roles: ['ADMIN'] },
  { key: 'audit', label: 'Audit Log', icon: ScrollText, description: 'Activity trail', roles: ['ADMIN'] },
  { key: 'settings', label: 'Settings', icon: Settings, description: 'Configuration', roles: ['ADMIN', 'MANAGER'] },
]

// Mobile bottom nav — 5 most-used destinations per PRD
const MOBILE_PRIMARY: ViewKey[] = ['dashboard', 'workflow', 'gold', 'sales', 'reports']

export default function Home() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="ss-jewellery-theme"
    >
      <AppShell />
    </ThemeProvider>
  )
}

function MustChangePasswordScreen({ onPasswordChanged }: { onPasswordChanged: () => void }) {
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [showCurrent, setShowCurrent] = React.useState(false)
  const [showNew, setShowNew] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const logout = useJewelleryStore((s) => s.logout)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!currentPassword) {
      setError('Please enter your current password.')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()
      if (!res.ok) {
        const errorMsg = data.error || 'Failed to update password'
        setError(errorMsg)
        toast.error(errorMsg)
        return
      }

      toast.success('Password changed successfully! Welcome to S.S Jewellery.')
      onPasswordChanged()
    } catch {
      const msg = 'Network error while updating password.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    logout()
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-2xl border-border">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center shadow-md">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Password Change Required</CardTitle>
          <CardDescription className="text-sm">
            For security purposes, you must change your temporary or initial password before accessing the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-pwd">Current Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="current-pwd"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-pwd">New Password (min 8 chars)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-pwd"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-pwd">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-pwd"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating Password…' : <>Change Password &amp; Continue <ArrowRight className="h-4 w-4 ml-2" /></>}
            </Button>

            <Button type="button" variant="outline" className="w-full text-muted-foreground" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Log Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function AppShell() {
  const queryClient = useQueryClient()
  const { data: authData, isLoading: isAuthLoading, refetch: refetchAuth } = useAuthMe()
  const { data: settingsData } = useSettings()
  const { data: notificationsData } = useNotifications()
  const markNotificationRead = useMarkNotificationRead()
  const markAllNotificationsRead = useMarkAllNotificationsRead()

  const storeUser = useJewelleryStore((s) => s.currentUser)
  const setCurrentUser = useJewelleryStore((s) => s.setCurrentUser)
  const active = useJewelleryStore((s) => s.activeView)
  const setActive = useJewelleryStore((s) => s.setActiveView)
  const logout = useJewelleryStore((s) => s.logout)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const currentUser = authData?.user ?? storeUser

  // Sync auth data from server query into Zustand UI store
  React.useEffect(() => {
    if (authData?.user) {
      setCurrentUser(authData.user)
    }
  }, [authData, setCurrentUser])

  // Fallback defaults for settings
  const settings = settingsData?.settings || {
    shopName: 'S.S Jewellery',
    city: 'Kolkata',
    defaultGoldRate24K: 7250,
  }

  const notifications = notificationsData?.notifications || []

  // Check login state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading S.S Jewellery ERP…</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLoggedIn={() => {
          refetchAuth()
        }}
      />
    )
  }

  // If user is required to change password, render strictly the password change screen
  if (currentUser.mustChangePassword) {
    return (
      <MustChangePasswordScreen
        onPasswordChanged={async () => {
          await refetchAuth()
        }}
      />
    )
  }

  const allowedItems = NAV_ITEMS.filter((n) => n.roles.includes(currentUser.role))
  const activeItem = allowedItems.find((n) => n.key === active) ?? allowedItems[0]

  // If current view not allowed for role, redirect to dashboard
  if (!allowedItems.some((n) => n.key === active)) {
    setActive('dashboard')
  }

  const myNotifications = notifications.filter(
    (n) => !n.forUserId || n.forUserId === currentUser.id || (currentUser.role === 'ADMIN' && !n.forUserId),
  )
  const unreadCount = myNotifications.filter((n) => !n.read).length

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore network error on logout
    }
    logout()
    queryClient.clear()
    setActive('dashboard')
  }

  const handleMarkAllRead = () => {
    markAllNotificationsRead.mutate(undefined, {
      onSuccess: () => toast.success('All notifications marked as read'),
      onError: (err) => toast.error((err as Error).message || 'Failed to mark notifications read'),
    })
  }

  const handleMarkOneRead = (id: string) => {
    markNotificationRead.mutate(id, {
      onError: (err) => toast.error((err as Error).message || 'Failed to update notification'),
    })
  }

  const renderView = () => {
    switch (active) {
      case 'dashboard': return <Dashboard onNavigate={setActive} />
      case 'workflow': return <WorkflowView />
      case 'gold': return <GoldInventoryView />
      case 'stones': return <StoneInventoryView />
      case 'products': return <ProductsView />
      case 'purchase': return <PurchaseView />
      case 'sales': return <SalesView />
      case 'customers': return <CustomersView />
      case 'suppliers': return <SuppliersView />
      case 'reports': return <ReportsView />
      case 'users': return <UsersView />
      case 'audit': return <AuditLogView />
      case 'settings': return <SettingsView />
      default: return null
    }
  }

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-background text-foreground overflow-hidden">
      {/* ===== Top header ===== */}
      <header className="shrink-0 border-b border-border bg-background/80 backdrop-blur-md z-40">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 overflow-y-auto">
              <SheetHeader className="px-4 pt-4 pb-2">
                <SheetTitle className="text-left flex items-center gap-2">
                  <Gem className="h-5 w-5 text-primary" />
                  S.S JEWELLERY
                </SheetTitle>
              </SheetHeader>
              <nav className="px-2 py-2 space-y-1">
                {allowedItems.map((item) => {
                  const Icon = item.icon
                  const isActive = active === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => { setActive(item.key); setMobileOpen(false) }}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                    </button>
                  )
                })}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors mt-4 border-t border-border pt-4"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Brand */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-gradient">
              <Gem className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight">{settings.shopName}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Jewellery ERP</p>
            </div>
          </div>

          {/* Search (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search work orders, products, customers…"
                className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="flex-1 md:hidden" />

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 relative" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <p className="text-sm font-semibold">Notifications</p>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleMarkAllRead} disabled={markAllNotificationsRead.isPending}>
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto scroll-slim">
                  {myNotifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">No notifications</p>
                  ) : (
                    myNotifications.slice(0, 20).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleMarkOneRead(n.id)}
                        className={`w-full text-left p-3 border-b border-border last:border-0 hover:bg-accent/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{relativeTime(n.timestamp || n.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <ThemeToggle />

            {/* User menu */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-2 gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {currentUser.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-medium leading-tight">{currentUser.name.split(' ')[0]}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{currentUser.role}</p>
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="end">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-semibold">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">@{currentUser.username} · {currentUser.role}</p>
                  {currentUser.specialty && <Badge variant="secondary" className="text-[10px] mt-1">{currentUser.specialty}</Badge>}
                </div>
                <div className="p-1">
                  {currentUser.role === 'ADMIN' && (
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm" onClick={() => { setActive('settings'); }}>
                      <Settings className="h-4 w-4 mr-2" /> Settings
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm text-destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Mobile page title row */}
        <div className="md:hidden px-3 pb-2 -mt-1">
          <h1 className="text-base font-semibold">{activeItem?.label}</h1>
          <p className="text-[11px] text-muted-foreground">{activeItem?.description}</p>
        </div>
      </header>

      {/* ===== Body ===== */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar/50 h-full overflow-hidden">
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scroll-slim">
            {allowedItems.map((item) => {
              const Icon = item.icon
              const isActive = active === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setActive(item.key)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>
          <div className="p-3 border-t border-border shrink-0">
            <div className="rounded-lg bg-gold-gradient p-3 text-white">
              <p className="text-xs font-semibold flex items-center gap-1"><Coins className="h-3 w-3" /> Gold Rate (24K)</p>
              <p className="text-lg font-bold leading-tight">
                ₹{Number(settings.defaultGoldRate24K).toLocaleString('en-IN')}
                <span className="text-[10px] font-normal opacity-80 ml-1">/g</span>
              </p>
              <p className="text-[10px] opacity-80 mt-1">{settings.city} · Today</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden scroll-slim pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
            {renderView()}
          </div>
        </main>
      </div>

      {/* ===== Mobile bottom navigation ===== */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md">
        <div className="grid grid-cols-5">
          {MOBILE_PRIMARY.map((key) => {
            const item = NAV_ITEMS.find((n) => n.key === key)!
            const Icon = item.icon
            const isActive = active === key
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
