import { NextRequest } from 'next/server'
import { z } from 'zod'
import { MaterialType, PurchasePaymentStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { ProcurementService } from '@/lib/services/procurement.service'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const purchaseItemSchema = z.object({
  materialType: z.nativeEnum(MaterialType).default(MaterialType.GOLD_BAR),
  description: z.string().min(1, 'Description is required'),
  purity: z.string().min(1, 'Purity is required'),
  grossWeightMg: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  netWeightMg: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  ratePaisePerGram: z.union([z.number(), z.string(), z.bigint()]).transform((v) => BigInt(v)),
  makingChargesPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : 0n)),
  taxPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : 0n)),
})

const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  supplierName: z.string().min(1, 'Supplier name is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  purchaseDate: z.string().transform((v) => new Date(v)),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  paidAmountPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  notes: z.string().optional().nullable(),
})

// GET /api/procurement/purchases - List purchases
export async function GET(request: NextRequest) {
  try {
    await requirePermission('purchases:read')
    const { searchParams } = new URL(request.url)

    const supplierId = searchParams.get('supplierId')
    const paymentStatus = searchParams.get('paymentStatus') as PurchasePaymentStatus | null

    const where = {
      ...(supplierId ? { supplierId } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
    }

    const purchases = await db.purchase.findMany({
      where,
      include: {
        items: true,
        supplier: { select: { id: true, name: true, supplierCode: true } },
        performedBy: { select: { id: true, name: true, username: true } },
      },
      orderBy: { purchaseDate: 'desc' },
    })

    return jsonResponse({ purchases })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch purchases', 500)
  }
}

// POST /api/procurement/purchases - Create purchase invoice
export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('purchases:create')
    const body = await request.json()
    const parsed = createPurchaseSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid purchase data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const purchase = await ProcurementService.createPurchase({
      ...parsed.data,
      performedById: user.id,
      performedByName: user.name,
      ipAddress,
    })

    return jsonResponse({ success: true, purchase }, { status: 201 })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to create purchase', 400)
  }
}
