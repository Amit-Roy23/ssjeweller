import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

// GET /api/audit-logs - List audit logs
export async function GET(request: NextRequest) {
  try {
    await requirePermission('audit:read')
    const { searchParams } = new URL(request.url)

    const entity = searchParams.get('entity')
    const action = searchParams.get('action')
    const search = searchParams.get('search') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const skip = (page - 1) * limit

    const where = {
      ...(entity ? { entity } : {}),
      ...(action ? { action } : {}),
      ...(search
        ? {
            OR: [
              { details: { contains: search, mode: 'insensitive' as const } },
              { userName: { contains: search, mode: 'insensitive' as const } },
              { entityId: { contains: search } },
            ],
          }
        : {}),
    }

    const [auditLogs, totalCount] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip,
      }),
      db.auditLog.count({ where }),
    ])

    return jsonResponse({
      auditLogs,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch audit logs', 500)
  }
}
