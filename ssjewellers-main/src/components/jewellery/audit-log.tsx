'use client'

import * as React from 'react'
import { ScrollText, Search, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useJewelleryStore, formatDateTime } from '@/lib/store'

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  LOGOUT: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
  CREATE_SALE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
  CREATE_PURCHASE: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  CREATE_WORK_ORDER: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  CREATE_GOLD_STOCK: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  CREATE_PRODUCT: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  CREATE_USER: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  CREATE_PAYMENT: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
  QC_APPROVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  QC_REJECTED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  STOCK_ADJUSTMENT: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  REASSIGN_WORK: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
}

export function AuditLogView() {
  const { auditLogs } = useJewelleryStore()
  const [search, setSearch] = React.useState('')
  const [actionFilter, setActionFilter] = React.useState('ALL')

  const filtered = auditLogs.filter((l) => {
    const q = search.trim().toLowerCase()
    const matchQ = !q || l.userName.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || (l.entityId ?? '').toLowerCase().includes(q) || (l.details ?? '').toLowerCase().includes(q)
    const matchA = actionFilter === 'ALL' || l.action === actionFilter
    return matchQ && matchA
  })

  const actionTypes = Array.from(new Set(auditLogs.map((l) => l.action)))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><ScrollText className="h-5 w-5 text-primary" /> Audit Log</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{auditLogs.length} logged actions · Full activity trail</p>
      </div>

      <Card><CardContent className="p-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search by user, action, entity…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Action type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Actions</SelectItem>
              {actionTypes.map((a) => <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><ScrollText className="h-12 w-12 mx-auto text-muted-foreground/50" /><p className="text-sm text-muted-foreground mt-3">No audit entries found</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-y-auto scroll-slim">
              {filtered.slice(0, 100).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border-b border-border last:border-0 hover:bg-muted/30">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {log.userName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground'}`}>{log.action.replace(/_/g, ' ')}</Badge>
                      <span className="text-sm font-medium">{log.userName}</span>
                    </div>
                    {log.details && <p className="text-xs text-muted-foreground mt-1">{log.details}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {log.entity}{log.entityId ? ` · ${log.entityId}` : ''} · {formatDateTime(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
