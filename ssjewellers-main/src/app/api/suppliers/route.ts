import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const createSupplierSchema = z.object({
  supplierCode: z.string().min(1, 'Supplier code is required'),
  name: z.string().min(1, 'Supplier name is required'),
  companyName: z.string().optional().nullable(),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Invalid email').optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  openingBalancePaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : 0n)),
})

// GET /api/suppliers - List suppliers
export async function GET() {
  try {
    await requirePermission('suppliers:read')

    const suppliers = await db.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return jsonResponse({ suppliers })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch suppliers', 500)
  }
}

// POST /api/suppliers - Create supplier
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('suppliers:write')
    const body = await request.json()
    const parsed = createSupplierSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid supplier data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const supplier = await db.supplier.create({
      data: parsed.data,
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'CREATE_SUPPLIER',
        entity: 'Supplier',
        entityId: supplier.id,
        details: `Created supplier ${supplier.name} (${supplier.supplierCode})`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, supplier }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to create supplier', 400)
  }
}
