'use client'

import * as React from 'react'
import { Plus, UserCog, Edit3, Trash2, Shield, User, Power, Phone, Briefcase, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { formatDate, relativeTime } from '@/lib/store'
import type { User as UserType, UserRole } from '@/lib/types'
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
  useWorkOrders,
  useAuthMe,
} from '@/lib/hooks/use-erp-queries'
import { toast } from 'sonner'

const ROLE_INFO: Record<UserRole, { label: string; color: string; icon: React.ElementType }> = {
  ADMIN: { label: 'Admin', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30', icon: Shield },
  MANAGER: { label: 'Manager', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', icon: Briefcase },
  STAFF: { label: 'Staff', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30', icon: User },
}

export function UsersView() {
  const { data: usersData, isLoading: loading } = useUsers()
  const { data: workOrdersData } = useWorkOrders()
  const { data: authData } = useAuthMe()

  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const deactivateUserMutation = useDeactivateUser()

  const currentUser = authData?.user
  const users: UserType[] = (usersData?.users || []).map((u: any) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    phone: u.phone,
    email: u.email || undefined,
    role: u.role,
    active: u.active ?? true,
    specialty: u.specialty || undefined,
    mustChangePassword: u.mustChangePassword,
    lastLogin: u.lastLogin ? String(u.lastLogin) : undefined,
    createdAt: u.createdAt,
  }))

  const workOrders = (workOrdersData?.workOrders || []) as any[]

  const [editingUserId, setEditingUserId] = React.useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const editing = editingUserId ? users.find((u) => u.id === editingUserId) || null : null

  const isSaving = createUserMutation.isPending || updateUserMutation.isPending
  const isDeleting = deactivateUserMutation.isPending

  const stats = {
    total: users.length,
    active: users.filter((u) => u.active).length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    staff: users.filter((u) => u.role === 'STAFF').length,
  }

  const toggleActive = async (u: UserType) => {
    try {
      await updateUserMutation.mutateAsync({ id: u.id, data: { active: !u.active } })
      toast.success(`${u.name} ${u.active ? 'deactivated' : 'activated'} successfully`)
    } catch (err: any) {
      toast.error(err.message || 'Error updating user status')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    if (deleteId === currentUser?.id) {
      toast.error('Cannot delete your own account')
      setDeleteId(null)
      return
    }
    try {
      await deactivateUserMutation.mutateAsync(deleteId)
      toast.success('User deactivated successfully')
      setDeleteId(null)
    } catch (err: any) {
      toast.error(err.message || 'Error deactivating user')
    }
  }

  const handleSave = async (data: any) => {
    try {
      if (editingUserId) {
        await updateUserMutation.mutateAsync({
          id: editingUserId,
          data: {
            name: data.name,
            phone: data.phone,
            email: data.email || null,
            role: data.role,
            specialty: data.specialty || null,
            active: data.active,
          },
        })
        toast.success('User updated successfully')
      } else {
        await createUserMutation.mutateAsync({
          username: data.username,
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          role: data.role,
          password: data.password,
          specialty: data.specialty || null,
        })
        toast.success(`User @${data.username} created successfully`)
      }
      setDialogOpen(false)
      setEditingUserId(null)
    } catch (err: any) {
      toast.error(err.message || 'Error saving user')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><UserCog className="h-5 w-5 text-primary" /> User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{stats.active} active users · {stats.admins} admins · {stats.staff} staff</p>
        </div>
        <Button onClick={() => { setEditingUserId(null); setDialogOpen(true) }}><Plus className="h-4 w-4 mr-1.5" /> Add User</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Total Users</p><p className="text-base md:text-lg font-bold mt-0.5">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Active</p><p className="text-base md:text-lg font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">{stats.active}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Admins</p><p className="text-base md:text-lg font-bold mt-0.5 text-rose-600 dark:text-rose-400">{stats.admins}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Staff</p><p className="text-base md:text-lg font-bold mt-0.5 text-blue-600 dark:text-blue-400">{stats.staff}</p></CardContent></Card>
      </div>

      {loading ? (
        <Card><CardContent className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /><p className="text-sm text-muted-foreground mt-2">Loading users...</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {users.map((u) => {
            const roleInfo = ROLE_INFO[u.role] || ROLE_INFO.STAFF
            const RoleIcon = roleInfo.icon
            const assignedWork = workOrders.filter((w) => w.assignedToId === u.id && w.status !== 'APPROVED' && w.status !== 'COMPLETED' && w.status !== 'CANCELLED').length
            return (
              <Card key={u.id} className={u.active ? '' : 'opacity-60'}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                      {u.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{u.name}</p>
                          <p className="text-[11px] text-muted-foreground">@{u.username}</p>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingUserId(u.id); setDialogOpen(true) }}><Edit3 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(u)} title={u.active ? 'Deactivate' : 'Activate'}>
                            <Power className={`h-3.5 w-3.5 ${u.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(u.id)} disabled={u.id === currentUser?.id}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${roleInfo.color}`}><RoleIcon className="h-2.5 w-2.5 mr-1" />{roleInfo.label}</Badge>
                        {u.specialty && <Badge variant="secondary" className="text-[10px]">{u.specialty}</Badge>}
                        <Badge variant={u.active ? 'default' : 'secondary'} className="text-[10px]">{u.active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{u.phone}</span>
                        {assignedWork > 0 && <span className="text-amber-600 dark:text-amber-400">{assignedWork} active work</span>}
                      </div>
                      {u.lastLogin && <p className="text-[10px] text-muted-foreground mt-1">Last login: {relativeTime(u.lastLogin)}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        isSaving={isSaving}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this user?</AlertDialogTitle>
            <AlertDialogDescription>The user account will be deactivated and unable to log in.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function UserDialog({ open, onOpenChange, editing, isSaving, onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: UserType | null
  isSaving: boolean
  onSave: (data: any) => void
}) {
  const [form, setForm] = React.useState<any>({})

  React.useEffect(() => {
    if (open) setForm(editing ?? { username: '', name: '', phone: '', email: '', role: 'STAFF', password: '', active: true, specialty: '' })
  }, [open, editing])

  const update = (patch: any) => setForm((f: any) => ({ ...f, ...patch }))
  const valid = (form.name?.trim()?.length ?? 0) > 0 &&
    (form.username?.trim()?.length ?? 0) >= 3 &&
    (form.phone?.trim()?.length ?? 0) >= 10 &&
    (editing || (form.password?.length ?? 0) >= 8)

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
          <DialogDescription>{editing ? `Editing ${editing.name}` : 'Create a new user account'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5">
            <Label>Username *</Label>
            <Input value={form.username ?? ''} onChange={(e) => update({ username: e.target.value.toLowerCase().trim() })} placeholder="lowercase, no spaces" disabled={!!editing} />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => update({ role: v as UserRole })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label>Full Name *</Label>
            <Input value={form.name ?? ''} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone *</Label>
            <Input value={form.phone ?? ''} onChange={(e) => update({ phone: e.target.value })} placeholder="10-digit number" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email ?? ''} onChange={(e) => update({ email: e.target.value })} />
          </div>
          {!editing && (
            <div className="space-y-1.5 col-span-2">
              <Label>Temporary Password *</Label>
              <Input type="text" value={form.password ?? ''} onChange={(e) => update({ password: e.target.value })} placeholder="Min 8 characters (user must change on first login)" />
            </div>
          )}
          <div className="space-y-1.5 col-span-2">
            <Label>Specialty</Label>
            <Input value={form.specialty ?? ''} onChange={(e) => update({ specialty: e.target.value })} placeholder="e.g. Melting, Polishing, Sales" />
          </div>
          <div className="space-y-1.5 col-span-2 flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.active ?? true} onChange={(e) => update({ active: e.target.checked })} className="rounded" />
            <Label htmlFor="active" className="cursor-pointer">Account active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={() => valid && onSave(form)} disabled={!valid || isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {editing ? 'Save Changes' : 'Add User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
