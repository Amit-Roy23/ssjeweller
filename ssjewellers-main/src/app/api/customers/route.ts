import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { generateCustomerId } from '@/lib/services/sequence.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  email: z.string().optional().nullable().transform((v) => (v && v.trim() ? v.trim() : null)),
  address: z.string().optional().nullable().transform((v) => (v && v.trim() ? v.trim() : null)),
  city: z.string().optional().nullable().transform((v) => (v && v.trim() ? v.trim() : null)),
  pincode: z.string().optional().nullable().transform((v) => (v && v.trim() ? v.trim() : null)),
  gstin: z.string().optional().nullable().transform((v) => (v && v.trim() ? v.trim() : null)),
  pan: z.string().optional().nullable().transform((v) => (v && v.trim() ? v.trim() : null)),
  dateOfBirth: z.string().optional().nullable().transform((v) => (v && v.trim() ? new Date(v) : null)),
  anniversary: z.string().optional().nullable().transform((v) => (v && v.trim() ? new Date(v) : null)),
})

// GET /api/customers - List customers
export async function GET(request: NextRequest) {
  try {
    await requirePermission('customers:read')
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const withDuesOnly = searchParams.get('withDues') === 'true'

    const where = {
      ...(withDuesOnly ? { totalDuePaise: { gt: 0n } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search } },
              { customerId: { contains: search, mode: 'insensitive' as const } },
              { city: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return jsonResponse({ customers })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch customers', 500)
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('customers:write')
    const body = await request.json()
    const parsed = createCustomerSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid customer data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const customer = await db.$transaction(async (tx) => {
      const customerId = await generateCustomerId(tx)

      const newCustomer = await tx.customer.create({
        data: {
          ...parsed.data,
          customerId,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'CREATE_CUSTOMER',
          entity: 'Customer',
          entityId: newCustomer.id,
          details: `Created customer ${newCustomer.name} (${newCustomer.customerId})`,
          ipAddress,
        },
      })

      return newCustomer
    })

    return jsonResponse({ success: true, customer }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to create customer', 400)
  }
}
