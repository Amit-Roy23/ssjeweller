import {
  MetalType,
  MaterialType,
  GoldStockStatus,
  StockItemType,
  AdjustmentType,
  AdjustmentReason,
  Prisma,
} from '@prisma/client'
import { db } from '@/lib/db'

export interface CreateGoldStockInput {
  stockId: string
  materialType?: MaterialType
  metal?: MetalType
  purity: string
  karat: string
  grossWeightMg: bigint
  fineGoldWeightMg: bigint
  supplierId?: string | null
  purchaseDate: Date
  purchaseRatePaisePerGram: bigint
  purchaseValuePaise: bigint
  currentLocation?: string
  status?: GoldStockStatus
  referenceNumber?: string | null
  performedById: string
  performedByName: string
  ipAddress?: string | null
}

export interface CreateStoneItemInput {
  stoneId: string
  type: string
  shape: string
  size: string
  quantity: number
  weightCarats: number | Prisma.Decimal
  unit?: string
  purchaseCostPaise: bigint
  supplierId?: string | null
  performedById: string
  performedByName: string
  ipAddress?: string | null
}

export interface CreateProductInput {
  productCode: string
  barcode: string
  name: string
  categoryId: string
  subCategory?: string | null
  designNumber?: string | null
  metal?: MetalType
  purity: string
  grossWeightMg: bigint
  netWeightMg: bigint
  stoneWeightMg?: bigint
  wastageMg?: bigint
  makingChargePaise?: bigint
  otherChargesPaise?: bigint
  gstRateBps?: number
  sellingPricePaise: bigint
  costPricePaise: bigint
  stock?: number
  hsnCode?: string
  imageColor?: string | null
  performedById: string
  performedByName: string
  ipAddress?: string | null
}

export interface AdjustStockInput {
  itemType: StockItemType
  itemId: string
  itemName: string
  adjustmentType: AdjustmentType
  weightMg?: bigint | null
  quantity?: number | null
  reason: AdjustmentReason
  remarks: string
  performedById: string
  performedByName: string
  ipAddress?: string | null
}

export const InventoryService = {
  /**
   * Adds new bullion or scrap gold to raw materials inventory.
   */
  async createGoldStock(input: CreateGoldStockInput) {
    return db.$transaction(async (tx) => {
      const stock = await tx.goldStock.create({
        data: {
          stockId: input.stockId,
          materialType: input.materialType ?? MaterialType.GOLD_BAR,
          metal: input.metal ?? MetalType.GOLD,
          purity: input.purity,
          karat: input.karat,
          grossWeightMg: input.grossWeightMg,
          fineGoldWeightMg: input.fineGoldWeightMg,
          supplierId: input.supplierId || null,
          purchaseDate: input.purchaseDate,
          purchaseRatePaisePerGram: input.purchaseRatePaisePerGram,
          purchaseValuePaise: input.purchaseValuePaise,
          currentLocation: input.currentLocation || 'Vault A',
          status: input.status ?? GoldStockStatus.AVAILABLE,
          referenceNumber: input.referenceNumber || null,
        },
      })

      await tx.stockMovement.create({
        data: {
          itemType: StockItemType.GOLD,
          itemId: stock.id,
          itemName: `${stock.karat} ${stock.materialType}`,
          fromLocation: 'Supplier / Purchase',
          toLocation: stock.currentLocation,
          weightMg: stock.grossWeightMg,
          reason: `Initial Inward: ${stock.stockId}`,
          reference: stock.referenceNumber,
          performedById: input.performedById,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: input.performedById,
          userName: input.performedByName,
          action: 'CREATE_GOLD_STOCK',
          entity: 'GoldStock',
          entityId: stock.id,
          details: `Added ${stock.stockId} (${Number(stock.grossWeightMg) / 1000}g ${stock.purity}) to ${stock.currentLocation}`,
          ipAddress: input.ipAddress || null,
        },
      })

      return stock
    })
  },

  /**
   * Issues raw gold to the workshop floor for a work order.
   */
  async issueGoldToWorkOrder(
    goldStockId: string,
    workId: string,
    performedById: string,
    performedByName: string,
    ipAddress?: string | null
  ) {
    return db.$transaction(async (tx) => {
      const goldStock = await tx.goldStock.findUnique({ where: { id: goldStockId } })
      if (!goldStock) throw new Error('Gold stock item not found')
      if (goldStock.status !== GoldStockStatus.AVAILABLE) {
        throw new Error(`Gold stock ${goldStock.stockId} is not available (Current: ${goldStock.status})`)
      }

      const updated = await tx.goldStock.update({
        where: { id: goldStockId },
        data: {
          status: GoldStockStatus.IN_PRODUCTION,
          currentLocation: 'Production Floor',
          referenceNumber: workId,
        },
      })

      await tx.stockMovement.create({
        data: {
          itemType: StockItemType.GOLD,
          itemId: goldStock.id,
          itemName: `${goldStock.karat} ${goldStock.materialType}`,
          fromLocation: goldStock.currentLocation,
          toLocation: 'Production Floor',
          weightMg: goldStock.grossWeightMg,
          reason: `Issued for Work Order ${workId}`,
          reference: workId,
          performedById,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: performedById,
          userName: performedByName,
          action: 'ISSUE_GOLD_WORK_ORDER',
          entity: 'GoldStock',
          entityId: goldStock.id,
          details: `Issued ${goldStock.stockId} to workshop for ${workId}`,
          ipAddress: ipAddress || null,
        },
      })

      return updated
    })
  },

  /**
   * Adds new diamond / gemstone lot to stone inventory.
   */
  async createStoneItem(input: CreateStoneItemInput) {
    return db.$transaction(async (tx) => {
      const remainingQuantity = input.quantity

      const stone = await tx.stoneItem.create({
        data: {
          stoneId: input.stoneId,
          type: input.type,
          shape: input.shape,
          size: input.size,
          quantity: input.quantity,
          weightCarats: input.weightCarats,
          unit: input.unit || 'carat',
          purchaseCostPaise: input.purchaseCostPaise,
          supplierId: input.supplierId || null,
          usedQuantity: 0,
          remainingQuantity,
        },
      })

      await tx.stockMovement.create({
        data: {
          itemType: StockItemType.STONE,
          itemId: stone.id,
          itemName: `${stone.type} (${stone.shape} ${stone.size})`,
          fromLocation: 'Supplier / Purchase',
          toLocation: 'Gems Safe',
          quantity: stone.quantity,
          reason: `Initial Inward: ${stone.stoneId}`,
          performedById: input.performedById,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: input.performedById,
          userName: input.performedByName,
          action: 'CREATE_STONE_ITEM',
          entity: 'StoneItem',
          entityId: stone.id,
          details: `Added ${stone.stoneId} (${stone.quantity} pcs ${stone.type})`,
          ipAddress: input.ipAddress || null,
        },
      })

      return stone
    })
  },

  /**
   * Issues gemstones to a work order.
   */
  async issueStonesToWorkOrder(
    stoneItemId: string,
    quantityToIssue: number,
    workId: string,
    performedById: string,
    performedByName: string,
    ipAddress?: string | null
  ) {
    return db.$transaction(async (tx) => {
      const stone = await tx.stoneItem.findUnique({ where: { id: stoneItemId } })
      if (!stone) throw new Error('Stone item not found')
      if (stone.remainingQuantity < quantityToIssue) {
        throw new Error(
          `Insufficient stones. Available: ${stone.remainingQuantity}, Requested: ${quantityToIssue}`
        )
      }

      const updated = await tx.stoneItem.update({
        where: { id: stoneItemId },
        data: {
          usedQuantity: { increment: quantityToIssue },
          remainingQuantity: { decrement: quantityToIssue },
        },
      })

      await tx.stockMovement.create({
        data: {
          itemType: StockItemType.STONE,
          itemId: stone.id,
          itemName: `${stone.type} (${stone.shape} ${stone.size})`,
          fromLocation: 'Gems Safe',
          toLocation: `Workshop (${workId})`,
          quantity: quantityToIssue,
          reason: `Issued for Work Order ${workId}`,
          reference: workId,
          performedById,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: performedById,
          userName: performedByName,
          action: 'ISSUE_STONES',
          entity: 'StoneItem',
          entityId: stone.id,
          details: `Issued ${quantityToIssue} pcs from ${stone.stoneId} to ${workId}`,
          ipAddress: ipAddress || null,
        },
      })

      return updated
    })
  },

  /**
   * Creates a new Finished Product in catalogue.
   */
  async createProduct(input: CreateProductInput) {
    return db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          productCode: input.productCode,
          barcode: input.barcode,
          name: input.name,
          categoryId: input.categoryId,
          subCategory: input.subCategory || null,
          designNumber: input.designNumber || null,
          metal: input.metal ?? MetalType.GOLD,
          purity: input.purity,
          grossWeightMg: input.grossWeightMg,
          netWeightMg: input.netWeightMg,
          stoneWeightMg: input.stoneWeightMg ?? 0n,
          wastageMg: input.wastageMg ?? 0n,
          makingChargePaise: input.makingChargePaise ?? 0n,
          otherChargesPaise: input.otherChargesPaise ?? 0n,
          gstRateBps: input.gstRateBps ?? 300,
          sellingPricePaise: input.sellingPricePaise,
          costPricePaise: input.costPricePaise,
          stock: input.stock ?? 1,
          hsnCode: input.hsnCode || '7113',
          imageColor: input.imageColor || 'from-amber-400 to-yellow-600',
        },
      })

      await tx.stockMovement.create({
        data: {
          itemType: StockItemType.PRODUCT,
          itemId: product.id,
          itemName: product.name,
          fromLocation: 'Workshop / Production',
          toLocation: 'Display Stock',
          quantity: product.stock,
          weightMg: product.grossWeightMg,
          reason: `Catalog Inward: ${product.productCode}`,
          reference: product.productCode,
          performedById: input.performedById,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: input.performedById,
          userName: input.performedByName,
          action: 'CREATE_PRODUCT',
          entity: 'Product',
          entityId: product.id,
          details: `Created product ${product.productCode} (${product.name})`,
          ipAddress: input.ipAddress || null,
        },
      })

      return product
    })
  },

  /**
   * Adjusts stock quantity or weight with append-only audit trail.
   */
  async adjustStock(input: AdjustStockInput) {
    return db.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.create({
        data: {
          itemType: input.itemType,
          itemId: input.itemId,
          itemName: input.itemName,
          adjustmentType: input.adjustmentType,
          weightMg: input.weightMg || null,
          quantity: input.quantity || null,
          reason: input.reason,
          remarks: input.remarks,
          performedById: input.performedById,
        },
      })

      // Apply adjustment to actual record
      if (input.itemType === StockItemType.PRODUCT && input.quantity) {
        const delta = input.adjustmentType === AdjustmentType.INCREASE ? input.quantity : -input.quantity
        await tx.product.update({
          where: { id: input.itemId },
          data: {
            stock: { increment: delta },
            version: { increment: 1 },
          },
        })
      } else if (input.itemType === StockItemType.GOLD && input.weightMg) {
        const delta = input.adjustmentType === AdjustmentType.INCREASE ? input.weightMg : -input.weightMg
        await tx.goldStock.update({
          where: { id: input.itemId },
          data: {
            grossWeightMg: { increment: delta },
          },
        })
      }

      await tx.auditLog.create({
        data: {
          userId: input.performedById,
          userName: input.performedByName,
          action: 'STOCK_ADJUSTMENT',
          entity: input.itemType,
          entityId: input.itemId,
          details: `${input.adjustmentType} adjustment on ${input.itemName}. Reason: ${input.reason} — ${input.remarks}`,
          ipAddress: input.ipAddress || null,
        },
      })

      return adjustment
    })
  },

  /**
   * Computes comprehensive live stock valuation and weight metrics.
   */
  async getInventorySummary() {
    const [goldStocks, stones, products] = await Promise.all([
      db.goldStock.findMany(),
      db.stoneItem.findMany(),
      db.product.findMany(),
    ])

    const totalAvailableGoldMg = goldStocks
      .filter((g) => g.status === GoldStockStatus.AVAILABLE && g.metal === MetalType.GOLD)
      .reduce((acc, g) => acc + g.grossWeightMg, 0n)

    const totalInProductionGoldMg = goldStocks
      .filter((g) => g.status === GoldStockStatus.IN_PRODUCTION && g.metal === MetalType.GOLD)
      .reduce((acc, g) => acc + g.grossWeightMg, 0n)

    const totalSilverMg = goldStocks
      .filter((g) => g.status === GoldStockStatus.AVAILABLE && g.metal === MetalType.SILVER)
      .reduce((acc, g) => acc + g.grossWeightMg, 0n)

    const totalProductsCount = products.reduce((acc, p) => acc + p.stock, 0)
    const totalFinishedStockValuationPaise = products.reduce(
      (acc, p) => acc + p.sellingPricePaise * BigInt(p.stock),
      0n
    )

    const totalRemainingStones = stones.reduce((acc, s) => acc + s.remainingQuantity, 0)

    return {
      totalAvailableGoldMg,
      totalInProductionGoldMg,
      totalSilverMg,
      totalProductsCount,
      totalFinishedStockValuationPaise,
      totalRemainingStones,
    }
  },
}
