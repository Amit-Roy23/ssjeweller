import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const updateSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').optional(),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().min(10, 'Valid phone number is required').optional(),
  email: z.string().email('Invalid email').optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  active: z.boolean().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/suppliers/[id] - Get supplier detail
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('suppliers:read')
    const { id } = await params

    const supplier = await db.supplier.findUnique({
      where: { id },
      include: {
        purchases: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })

    if (!supplier) return errorResponse('Supplier not found', 404)
    return jsonResponse({ supplier })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch supplier', 500)
  }
}

// PATCH /api/suppliers/[id] - Update supplier
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('suppliers:write')
    const { id } = await params
    const body = await request.json()
    const parsed = updateSupplierSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid supplier data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const existing = await db.supplier.findUnique({ where: { id } })
    if (!existing) return errorResponse('Supplier not found', 404)

    const updated = await db.supplier.update({
      where: { id },
      data: parsed.data,
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE_SUPPLIER',
        entity: 'Supplier',
        entityId: id,
        details: `Updated supplier ${updated.name}`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, supplier: updated })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to update supplier', 400)
  }
}

// DELETE /api/suppliers/[id] - Delete supplier
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('suppliers:write')
    const { id } = await params
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const existing = await db.supplier.findUnique({ where: { id } })
    if (!existing) return errorResponse('Supplier not found', 404)

    await db.supplier.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'DELETE_SUPPLIER',
        entity: 'Supplier',
        entityId: id,
        details: `Deleted supplier ${existing.name}`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, message: 'Supplier deleted successfully' })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to delete supplier', 400)
  }
}
