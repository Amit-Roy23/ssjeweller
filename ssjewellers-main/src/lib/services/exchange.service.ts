import {
  ExchangeType,
  RecordStatus,
  MaterialType,
  MetalType,
  GoldStockStatus,
  StockItemType,
} from '@prisma/client'
import { db } from '@/lib/db'
import { generateExchangeVoucherNo } from './sequence.service'

export interface CreateOldGoldExchangeInput {
  customerName: string
  customerPhone: string
  type: ExchangeType
  itemDescription: string
  grossWeightMg: bigint
  netWeightMg: bigint
  karat: string
  touchBps: number // e.g. 9160 = 91.60%
  ratePaisePerGram: bigint
  adjustedAgainstSaleId?: string | null
  adjustedAgainstInvoice?: string | null
  paidAmountPaise?: bigint
  date?: Date
  performedById: string
  performedByName: string
  ipAddress?: string | null
}

/**
 * Pure calculation of fine gold weight and total valuation.
 */
export function calculateValuation(
  netWeightMg: bigint,
  touchBps: number,
  ratePaisePerGram: bigint
): { fineWeightMg: bigint; totalValuePaise: bigint } {
  // Fine Weight = (netWeightMg * touchBps) / 10000 bps
  const fineWeightMg = (netWeightMg * BigInt(touchBps)) / 10000n
  // Value = (fineWeightMg * ratePaisePerGram) / 1000 mg
  const totalValuePaise = (fineWeightMg * ratePaisePerGram) / 1000n

  return {
    fineWeightMg,
    totalValuePaise,
  }
}

export const ExchangeService = {
  /**
   * Creates an Old Gold exchange/buyback voucher inside an ACID transaction.
   */
  async createExchange(input: CreateOldGoldExchangeInput) {
    return db.$transaction(async (tx) => {
      const voucherNo = await generateExchangeVoucherNo(tx)
      const { fineWeightMg, totalValuePaise } = calculateValuation(
        input.netWeightMg,
        input.touchBps,
        input.ratePaisePerGram
      )

      const paidAmountPaise = input.paidAmountPaise ?? (input.type === ExchangeType.BUY ? totalValuePaise : 0n)

      const exchange = await tx.oldGoldExchange.create({
        data: {
          voucherNo,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          type: input.type,
          itemDescription: input.itemDescription,
          grossWeightMg: input.grossWeightMg,
          netWeightMg: input.netWeightMg,
          karat: input.karat,
          touchBps: input.touchBps,
          ratePaisePerGram: input.ratePaisePerGram,
          totalValuePaise,
          adjustedAgainstSaleId: input.adjustedAgainstSaleId || null,
          adjustedAgainstInvoice: input.adjustedAgainstInvoice || null,
          paidAmountPaise,
          status: RecordStatus.ACTIVE,
          date: input.date ?? new Date(),
        },
      })

      // Inward gold scrap into inventory
      const stockId = `GS-${voucherNo.replace(/[^0-9]/g, '') || Date.now().toString().slice(-4)}`
      await tx.goldStock.create({
        data: {
          stockId,
          materialType: MaterialType.GOLD_SCRAP,
          metal: MetalType.GOLD,
          purity: input.karat,
          karat: input.karat,
          grossWeightMg: input.grossWeightMg,
          fineGoldWeightMg: fineWeightMg,
          purchaseDate: input.date ?? new Date(),
          purchaseRatePaisePerGram: input.ratePaisePerGram,
          purchaseValuePaise: totalValuePaise,
          currentLocation: 'Vault B',
          status: GoldStockStatus.AVAILABLE,
          referenceNumber: voucherNo,
        },
      })

      await tx.stockMovement.create({
        data: {
          itemType: StockItemType.GOLD,
          itemId: stockId,
          itemName: `Old Gold Scrap (${input.itemDescription})`,
          fromLocation: `Customer (${input.customerName})`,
          toLocation: 'Vault B',
          weightMg: input.grossWeightMg,
          reason: `Old Gold Voucher ${voucherNo}`,
          reference: voucherNo,
          performedById: input.performedById,
        },
      })

      // Log audit
      await tx.auditLog.create({
        data: {
          userId: input.performedById,
          userName: input.performedByName,
          action: 'CREATE_OLD_GOLD_EXCHANGE',
          entity: 'OldGoldExchange',
          entityId: exchange.id,
          details: `Created Old Gold Voucher ${voucherNo} (${input.type}) for ${input.customerName} (₹${(Number(totalValuePaise)/100).toFixed(2)})`,
          ipAddress: input.ipAddress || null,
        },
      })

      return exchange
    })
  },
}
