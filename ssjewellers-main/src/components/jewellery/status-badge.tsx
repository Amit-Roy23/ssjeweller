'use client'

import { Badge } from '@/components/ui/badge'

export function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    PENDING: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    ASSIGNED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    ACCEPTED: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    ON_HOLD: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    COMPLETED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    REWORK_REQUIRED: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    REJECTED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    CANCELLED: 'bg-muted text-muted-foreground',
    QUALITY_CHECK: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    APPROVED: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
    SKIPPED: 'bg-muted text-muted-foreground',
    PAID: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    PARTIAL: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    DUE: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    AVAILABLE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    IN_PRODUCTION: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    USED: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
    SOLD: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  }
  return (
    <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${cls[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
