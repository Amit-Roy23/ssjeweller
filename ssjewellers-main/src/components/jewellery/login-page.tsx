'use client'

import * as React from 'react'
import { Gem, Lock, User, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useJewelleryStore } from '@/lib/store'
import { toast } from 'sonner'

interface LoginPageProps {
  onLoggedIn: () => void
}

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'Admin', desc: 'Full access — all modules' },
  { username: 'manager', password: 'manager123', role: 'Manager', desc: 'Dashboard, inventory, workflow, reports' },
  { username: 'rahul', password: 'rahul123', role: 'Staff', desc: 'Gold Issue & Melting specialist' },
  { username: 'amit', password: 'amit123', role: 'Staff', desc: 'Shaping specialist' },
]

export function LoginPage({ onLoggedIn }: LoginPageProps) {
  const login = useJewelleryStore((s) => s.login)
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPwd, setShowPwd] = React.useState(false)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Please enter username and password')
      return
    }
    setLoading(true)

    try {
      // Call server auth API endpoint
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      const data = await res.json()

      if (res.ok && data.success && data.user) {
        // Sync user into store
        login(username.trim(), password)
        toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`)
        onLoggedIn()
        return
      }

      if (res.status === 401 || res.status === 403 || res.status === 429) {
        setError(data.error || 'Invalid credentials or account deactivated')
        setLoading(false)
        return
      }

      // Fallback to client-side store if server DB is offline
      const clientUser = login(username.trim(), password)
      if (clientUser) {
        toast.success(`Welcome back, ${clientUser.name.split(' ')[0]}!`)
        onLoggedIn()
      } else {
        setError(data.error || 'Invalid credentials or account deactivated')
      }
    } catch {
      // Fallback to client store if offline
      const clientUser = login(username.trim(), password)
      if (clientUser) {
        toast.success(`Welcome back, ${clientUser.name.split(' ')[0]}!`)
        onLoggedIn()
      } else {
        setError('Invalid credentials or account deactivated')
      }
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (u: string, p: string) => {
    setUsername(u)
    setPassword(p)
    setError('')
    setTimeout(() => {
      const form = document.querySelector('form')
      if (form) {
        form.requestSubmit()
      }
    }, 50)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Left: Brand panel */}
        <div className="hidden lg:flex flex-col gap-6 p-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center">
              <Gem className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">S.S JEWELLERY</h1>
              <p className="text-sm text-muted-foreground">ERP Management System</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight">
              Complete Jewellery<br />Production &amp; Management
            </h2>
            <p className="text-muted-foreground">
              Inventory, Gold Tracking, Production Workflow, Billing, Customers, Payments &amp; Reports — all in one centralized system.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Inventory', 'Workflow', 'Billing', 'Gold Stock', 'QC', 'Reports', 'Audit Log'].map((f) => (
                <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Track every gram of gold from purchase to sale
          </div>
        </div>

        {/* Right: Login form */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="h-10 w-10 rounded-lg bg-gold-gradient flex items-center justify-center">
                <Gem className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">S.S JEWELLERY</CardTitle>
                <CardDescription className="text-xs">ERP Management System</CardDescription>
              </div>
            </div>
            <CardTitle className="text-2xl hidden lg:block">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : <>Sign In <ArrowRight className="h-4 w-4 ml-2" /></>}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2 text-center">Quick demo login — click to sign in</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.username}
                    onClick={() => quickLogin(acc.username, acc.password)}
                    className="flex flex-col items-start gap-0.5 p-2 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors text-left"
                  >
                    <span className="text-xs font-semibold">{acc.role}</span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">{acc.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
