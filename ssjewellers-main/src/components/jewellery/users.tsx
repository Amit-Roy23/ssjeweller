'use client'

import * as React from 'react'
import { Plus, UserCog, Edit3, Trash2, Shield, User, Power, Phone, Briefcase } from 'lucide-react'
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
import { useJewelleryStore, formatDate, relativeTime } from '@/lib/store'
import type { User as UserType, UserRole } from '@/lib/types'
import { toast } from 'sonner'

const ROLE_INFO: Record<UserRole, { label: string; color: string; icon: React.ElementType }> = {
  ADMIN: { label: 'Admin', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30', icon: Shield },
  MANAGER: { label: 'Manager', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', icon: Briefcase },
  STAFF: { label: 'Staff', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30', icon: User },
}

export function UsersView() {
  const { users, workOrders, currentUser, addUser, updateUser, deleteUser } = useJewelleryStore()
  const [editing, setEditing] = React.useState<UserType | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  const stats = {
    total: users.length,
    active: users.filter((u) => u.active).length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    staff: users.filter((u) => u.role === 'STAFF').length,
  }

  const toggleActive = (u: UserType) => {
    updateUser(u.id, { active: !u.active })
    toast.success(`${u.name} ${u.active ? 'deactivated' : 'activated'}`)
  }

  const handleDelete = () => {
    if (deleteId) {
      if (deleteId === currentUser?.id) { toast.error('Cannot delete your own account'); setDeleteId(null); return }
      deleteUser(deleteId)
      toast.success('User deleted')
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><UserCog className="h-5 w-5 text-primary" /> User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{stats.active} active users · {stats.admins} admins · {stats.staff} staff</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus className="h-4 w-4 mr-1.5" /> Add User</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Total Users</p><p className="text-base md:text-lg font-bold mt-0.5">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Active</p><p className="text-base md:text-lg font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">{stats.active}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Admins</p><p className="text-base md:text-lg font-bold mt-0.5 text-rose-600 dark:text-rose-400">{stats.admins}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[11px] text-muted-foreground">Staff</p><p className="text-base md:text-lg font-bold mt-0.5 text-blue-600 dark:text-blue-400">{stats.staff}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {users.map((u) => {
          const roleInfo = ROLE_INFO[u.role]
          const RoleIcon = roleInfo.icon
          const assignedWork = workOrders.filter((w) => w.assignedTo === u.id && w.status !== 'APPROVED' && w.status !== 'COMPLETED' && w.status !== 'CANCELLED').length
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
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(u); setDialogOpen(true) }}><Edit3 className="h-3.5 w-3.5" /></Button>
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

      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSave={(data) => {
        if (editing) { updateUser(editing.id, data); toast.success('User updated') }
        else { addUser(data as Omit<UserType, 'id' | 'createdAt'>); toast.success('User added') }
        setDialogOpen(false)
      }} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this user?</AlertDialogTitle><AlertDialogDescription>The user account will be permanently removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function UserDialog({ open, onOpenChange, editing, onSave }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  editing: UserType | null
  onSave: (data: Partial<UserType>) => void
}) {
  const [form, setForm] = React.useState<Partial<UserType>>({})

  React.useEffect(() => {
    if (open) setForm(editing ?? { username: '', name: '', phone: '', email: '', role: 'STAFF', password: '', active: true, specialty: '' })
  }, [open, editing])

  const update = (patch: Partial<UserType>) => setForm((f) => ({ ...f, ...patch }))
  const valid = (form.name?.trim()?.length ?? 0) > 0 && (form.username?.trim()?.length ?? 0) > 0 && (form.password?.length ?? 0) >= 4

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle><DialogDescription>{editing ? `Editing ${editing.name}` : 'Create a new user account'}</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5"><Label>Username *</Label><Input value={form.username ?? ''} onChange={(e) => update({ username: e.target.value })} placeholder="lowercase, no spaces" /></div>
          <div className="space-y-1.5"><Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => update({ role: v as UserRole })}>
              <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ADMIN">Admin</SelectItem><SelectItem value="MANAGER">Manager</SelectItem><SelectItem value="STAFF">Staff</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 col-span-2"><Label>Full Name *</Label><Input value={form.name ?? ''} onChange={(e) => update({ name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone ?? ''} onChange={(e) => update({ phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email ?? ''} onChange={(e) => update({ email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Password *</Label><Input type="text" value={form.password ?? ''} onChange={(e) => update({ password: e.target.value })} placeholder="Min 4 characters" /></div>
          <div className="space-y-1.5"><Label>Specialty</Label><Input value={form.specialty ?? ''} onChange={(e) => update({ specialty: e.target.value })} placeholder="e.g. Melting, Polishing" /></div>
          <div className="space-y-1.5 col-span-2 flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.active ?? true} onChange={(e) => update({ active: e.target.checked })} className="rounded" />
            <Label htmlFor="active" className="cursor-pointer">Account active</Label>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => valid && onSave(form)} disabled={!valid}>{editing ? 'Save Changes' : 'Add User'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
