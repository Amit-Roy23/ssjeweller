import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { LedgerService } from '@/lib/services/ledger.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().min(10, 'Valid 10-digit phone number is required').optional(),
  email: z.string().optional().nullable().transform((v) => (v && v.trim() ? v.trim() : null)),
  address: z.string().optional().nullable().transform((v) => (v && v.trim() ? v.trim() : null)),
  city: z.string().optional().nullable().transform((v) => (v && v.trim() ? v.trim() : null)),
  pincode: z.string().optional().nullable().transform((v) => (v && v.trim() ? v.trim() : null)),
  gstin: z.string().optional().nullable().transform((v) => (v && v.trim() ? v.trim() : null)),
  pan: z.string().optional().nullable().transform((v) => (v && v.trim() ? v.trim() : null)),
  dateOfBirth: z.string().optional().nullable().transform((v) => (v && v.trim() ? new Date(v) : null)),
  anniversary: z.string().optional().nullable().transform((v) => (v && v.trim() ? new Date(v) : null)),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/customers/[id] - Get customer details with full statement & bills
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('customers:read')
    const { id } = await params

    const statement = await LedgerService.getCustomerStatement(id)
    return jsonResponse(statement)
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch customer statement', 500)
  }
}

// PATCH /api/customers/[id] - Update customer
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('customers:write')
    const { id } = await params
    const body = await request.json()
    const parsed = updateCustomerSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid customer data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const customer = await db.customer.update({
      where: { id },
      data: parsed.data,
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE_CUSTOMER',
        entity: 'Customer',
        entityId: customer.id,
        details: `Updated customer ${customer.name}`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, customer })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to update customer', 400)
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('customers:write')
    const { id } = await params
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const existing = await db.customer.findUnique({ where: { id } })
    if (!existing) return errorResponse('Customer not found', 404)

    await db.customer.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'DELETE_CUSTOMER',
        entity: 'Customer',
        entityId: id,
        details: `Deleted customer ${existing.name}`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, message: 'Customer deleted successfully' })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to delete customer', 400)
  }
}
