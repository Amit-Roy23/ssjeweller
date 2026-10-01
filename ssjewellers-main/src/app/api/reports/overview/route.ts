import { NextRequest } from 'next/server'
import { requirePermission } from '@/lib/auth/guards'
import { LedgerService } from '@/lib/services/ledger.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

// GET /api/reports/overview - Overall business financial overview
export async function GET(request: NextRequest) {
  try {
    await requirePermission('reports:financial')
    const { searchParams } = new URL(request.url)

    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    const overview = await LedgerService.getFinancialOverview(startDate, endDate)
    return jsonResponse({ overview })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch financial overview', 500)
  }
}
