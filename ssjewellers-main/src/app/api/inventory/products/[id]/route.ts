import { NextRequest } from 'next/server'
import { z } from 'zod'
import { MetalType } from '@prisma/client'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/auth/guards'
import { jsonResponse, errorResponse } from '@/lib/api-helpers'

const updateProductSchema = z.object({
  productCode: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().optional(),
  categoryId: z.string().optional(),
  subCategory: z.string().optional().nullable(),
  designNumber: z.string().optional().nullable(),
  metal: z.nativeEnum(MetalType).optional(),
  purity: z.string().optional(),
  grossWeightMg: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  netWeightMg: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  stoneWeightMg: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  wastageMg: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  makingChargePaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  otherChargesPaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  gstRateBps: z.number().optional(),
  sellingPricePaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  costPricePaise: z.union([z.number(), z.string(), z.bigint()]).optional().transform((v) => (v != null ? BigInt(v) : undefined)),
  stock: z.number().int().optional(),
  hsnCode: z.string().optional(),
  imageColor: z.string().optional().nullable(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/inventory/products/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission('inventory:read')
    const { id } = await params

    const product = await db.product.findUnique({
      where: { id },
      include: { category: true },
    })

    if (!product) return errorResponse('Product not found', 404)
    return jsonResponse({ product })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to fetch product', 500)
  }
}

// PATCH /api/inventory/products/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('inventory:write')
    const { id } = await params
    const body = await request.json()
    const parsed = updateProductSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse('Invalid product data', 400, parsed.error.issues)
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) return errorResponse('Product not found', 404)

    const updated = await db.product.update({
      where: { id },
      data: parsed.data,
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE_PRODUCT',
        entity: 'Product',
        entityId: id,
        details: `Updated product ${existing.productCode}`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, product: updated })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to update product', 400)
  }
}

// DELETE /api/inventory/products/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requirePermission('inventory:write')
    const { id } = await params
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) return errorResponse('Product not found', 404)

    await db.product.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'DELETE_PRODUCT',
        entity: 'Product',
        entityId: id,
        details: `Deleted product ${existing.productCode} (${existing.name})`,
        ipAddress,
      },
    })

    return jsonResponse({ success: true, message: 'Product deleted successfully' })
  } catch (err: unknown) {
    return errorResponse((err as Error).message || 'Failed to delete product', 400)
  }
}
