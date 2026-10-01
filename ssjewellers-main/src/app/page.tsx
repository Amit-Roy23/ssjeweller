'use client'

import * as React from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import {
  LayoutDashboard, Workflow, Package, Factory, ShoppingCart, ReceiptIndianRupee,
  Users, Truck, BarChart3, UserCog, ScrollText, Settings, Gem, Menu, Search, Bell, LogOut, Coins,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { useJewelleryStore, relativeTime } from '@/lib/store'
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

export type ViewKey =
  | 'dashboard' | 'workflow' | 'gold' | 'stones' | 'products'
  | 'purchase' | 'sales' | 'customers' | 'suppliers'
  | 'reports' | 'users' | 'audit' | 'settings'

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

function AppShell() {
  const [loggedIn, setLoggedIn] = React.useState(false)
  const [active, setActive] = React.useState<ViewKey>('dashboard')
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const hydrateSeed = useJewelleryStore((s) => s.hydrateSeed)
  const currentUser = useJewelleryStore((s) => s.currentUser)
  const logout = useJewelleryStore((s) => s.logout)
  const settings = useJewelleryStore((s) => s.settings)
  const notifications = useJewelleryStore((s) => s.notifications)
  const markNotificationRead = useJewelleryStore((s) => s.markNotificationRead)
  const markAllNotificationsRead = useJewelleryStore((s) => s.markAllNotificationsRead)

  React.useEffect(() => { hydrateSeed() }, [hydrateSeed])

  // Restore session from store on mount
  React.useEffect(() => {
    if (currentUser) setLoggedIn(true)
  }, [currentUser])

  if (!loggedIn || !currentUser) {
    return <LoginPage onLoggedIn={() => setLoggedIn(true)} />
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

  const handleLogout = () => {
    logout()
    setLoggedIn(false)
    setActive('dashboard')
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* ===== Top header ===== */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
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
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllNotificationsRead(currentUser.id)}>
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
                        onClick={() => markNotificationRead(n.id)}
                        className={`w-full text-left p-3 border-b border-border last:border-0 hover:bg-accent/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">{relativeTime(n.timestamp)}</p>
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
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar/50">
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
          <div className="p-3 border-t border-border">
            <div className="rounded-lg bg-gold-gradient p-3 text-white">
              <p className="text-xs font-semibold flex items-center gap-1"><Coins className="h-3 w-3" /> Gold Rate (24K)</p>
              <p className="text-lg font-bold leading-tight">
                ₹{settings.defaultGoldRate24K.toLocaleString('en-IN')}
                <span className="text-[10px] font-normal opacity-80 ml-1">/g</span>
              </p>
              <p className="text-[10px] opacity-80 mt-1">{settings.city} · Today</p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-hidden pb-20 md:pb-6">
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
