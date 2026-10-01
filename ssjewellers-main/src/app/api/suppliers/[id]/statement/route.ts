import { NextRequest } from 'next/server'
import { requirePermission } from '@/lib/auth/guards'
import { LedgerService } from '@/lib/services/ledger.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/suppliers/[id]/statement - Get supplier statement
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('suppliers:read')
    const { id } = await params

    const statement = await LedgerService.getSupplierStatement(id)
    return jsonResponse({ statement })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch supplier statement', 500)
  }
}
