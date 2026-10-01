import {
  MaterialType,
  PurchasePaymentStatus,
  RecordStatus,
} from '@prisma/client'
import { db } from '@/lib/db'
import { generatePurchaseId } from './sequence.service'

export interface CreatePurchaseItemInput {
  materialType?: MaterialType
  description: string
  purity: string
  grossWeightMg: bigint
  netWeightMg: bigint
  ratePaisePerGram: bigint
  makingChargesPaise?: bigint
  taxPaise?: bigint
}

export interface CreatePurchaseInput {
  supplierId: string
  supplierName: string
  invoiceNumber: string
  purchaseDate: Date
  items: CreatePurchaseItemInput[]
  paidAmountPaise?: bigint
  notes?: string | null
  performedById: string
  performedByName: string
  ipAddress?: string | null
}

export const ProcurementService = {
  /**
   * Records a supplier procurement purchase invoice inside an ACID transaction.
   */
  async createPurchase(input: CreatePurchaseInput) {
    return db.$transaction(async (tx) => {
      const purchaseId = await generatePurchaseId(tx)

      const calculatedItems = input.items.map((it) => {
        const makingChargesPaise = it.makingChargesPaise ?? 0n
        const taxPaise = it.taxPaise ?? 0n
        const metalValuePaise = (it.netWeightMg * it.ratePaisePerGram) / 1000n
        const totalPaise = metalValuePaise + makingChargesPaise + taxPaise

        return {
          ...it,
          materialType: it.materialType ?? MaterialType.GOLD_BAR,
          makingChargesPaise,
          taxPaise,
          totalPaise,
        }
      })

      const subtotalPaise = calculatedItems.reduce(
        (acc, it) => acc + ((it.netWeightMg * it.ratePaisePerGram) / 1000n) + it.makingChargesPaise,
        0n
      )
      const totalTaxPaise = calculatedItems.reduce((acc, it) => acc + it.taxPaise, 0n)
      const grandTotalPaise = subtotalPaise + totalTaxPaise
      const paidAmountPaise = input.paidAmountPaise ?? grandTotalPaise

      let paymentStatus: PurchasePaymentStatus = PurchasePaymentStatus.PAID
      if (paidAmountPaise < grandTotalPaise && paidAmountPaise > 0n) {
        paymentStatus = PurchasePaymentStatus.PARTIAL
      } else if (paidAmountPaise === 0n) {
        paymentStatus = PurchasePaymentStatus.DUE
      }

      // Create purchase record
      const purchase = await tx.purchase.create({
        data: {
          purchaseId,
          supplierId: input.supplierId,
          supplierName: input.supplierName,
          invoiceNumber: input.invoiceNumber,
          purchaseDate: input.purchaseDate,
          subtotalPaise,
          totalTaxPaise,
          grandTotalPaise,
          paidAmountPaise,
          paymentStatus,
          status: RecordStatus.ACTIVE,
          notes: input.notes || null,
          performedById: input.performedById,
          items: {
            create: calculatedItems.map((it) => ({
              materialType: it.materialType,
              description: it.description,
              purity: it.purity,
              grossWeightMg: it.grossWeightMg,
              netWeightMg: it.netWeightMg,
              ratePaisePerGram: it.ratePaisePerGram,
              makingChargesPaise: it.makingChargesPaise,
              taxPaise: it.taxPaise,
              totalPaise: it.totalPaise,
            })),
          },
        },
        include: { items: true },
      })

      // Update supplier ledger
      await tx.supplier.update({
        where: { id: input.supplierId },
        data: {
          totalPurchasePaise: { increment: grandTotalPaise },
          totalPaidPaise: { increment: paidAmountPaise },
        },
      })

      // Log audit
      await tx.auditLog.create({
        data: {
          userId: input.performedById,
          userName: input.performedByName,
          action: 'CREATE_PURCHASE',
          entity: 'Purchase',
          entityId: purchase.id,
          details: `Created Purchase ${purchaseId} from ${input.supplierName} (₹${(Number(grandTotalPaise)/100).toFixed(2)})`,
          ipAddress: input.ipAddress || null,
        },
      })

      return purchase
    })
  },

  /**
   * Cancels a purchase invoice and updates the supplier ledger balance.
   */
  async cancelPurchase(
    purchaseId: string,
    cancelReason: string,
    cancelledById: string,
    cancelledByName: string,
    ipAddress?: string | null
  ) {
    return db.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({
        where: { id: purchaseId },
        include: { items: true },
      })

      if (!purchase) throw new Error('Purchase not found')
      if (purchase.status === RecordStatus.CANCELLED) throw new Error('Purchase is already cancelled')

      // Reverse supplier ledger
      await tx.supplier.update({
        where: { id: purchase.supplierId },
        data: {
          totalPurchasePaise: { decrement: purchase.grandTotalPaise },
          totalPaidPaise: { decrement: purchase.paidAmountPaise },
        },
      })

      const updated = await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          status: RecordStatus.CANCELLED,
          cancelReason,
          paymentStatus: PurchasePaymentStatus.CANCELLED,
          version: { increment: 1 },
        },
      })

      await tx.auditLog.create({
        data: {
          userId: cancelledById,
          userName: cancelledByName,
          action: 'CANCEL_PURCHASE',
          entity: 'Purchase',
          entityId: purchase.id,
          details: `Cancelled purchase ${purchase.purchaseId}. Reason: ${cancelReason}`,
          ipAddress: ipAddress || null,
        },
      })

      return updated
    })
  },
}
