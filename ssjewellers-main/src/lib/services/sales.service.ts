import {
  Prisma,
  SaleStatus,
  PaymentStatus,
  PaymentMode,
  MetalType,
  StockItemType,
  RestockingStatus,
  RecordStatus,
} from '@prisma/client'
import { db } from '@/lib/db'
import {
  generateInvoiceNumber,
  generatePaymentId,
  generateReturnId,
} from './sequence.service'

export interface CreateSaleItemInput {
  productId?: string | null
  productCode?: string | null
  name: string
  hsn?: string
  metal?: MetalType
  purity: string
  grossWeightMg: bigint
  netWeightMg: bigint
  stoneWeightMg?: bigint
  ratePaisePerGram: bigint
  makingAmountPaise?: bigint
  stoneAmountPaise?: bigint
  otherChargesPaise?: bigint
  discountPaise?: bigint
  gstRateBps?: number // 300 = 3%
  quantity?: number
}

export interface CreateSaleInput {
  customerId: string
  customerName: string
  customerPhone: string
  customerAddress?: string | null
  customerGstin?: string | null
  items: CreateSaleItemInput[]
  paymentMode?: PaymentMode
  paidAmountPaise?: bigint
  oldGoldAdjustmentPaise?: bigint
  paymentRef?: string | null
  branch?: string
  billedById: string
  billedByName: string
  idempotencyKey?: string | null
  ipAddress?: string | null
}

export interface CancelSaleInput {
  saleId: string
  cancelledById: string
  cancelledByName: string
  cancelReason: string
  ipAddress?: string | null
}

export interface RecordSalePaymentInput {
  saleId?: string | null
  invoiceNo?: string | null
  customerId: string
  customerName: string
  amountPaise: bigint
  paymentMode: PaymentMode
  transactionId?: string | null
  remarks?: string | null
  receivedById: string
  receivedByName: string
  ipAddress?: string | null
}

export interface ProcessSalesReturnInput {
  saleId: string
  originalInvoiceNo: string
  customerName: string
  productName: string
  productId?: string | null
  returnQuantity?: number
  returnWeightMg: bigint
  reason: string
  refundAmountPaise?: bigint
  exchangeAmountPaise?: bigint
  restockProduct?: boolean
  performedById: string
  performedByName: string
  ipAddress?: string | null
}

/**
 * Calculates line item totals with strict integer precision (Paise).
 */
export function calculateLineItem(item: CreateSaleItemInput) {
  const makingAmountPaise = item.makingAmountPaise ?? 0n
  const stoneAmountPaise = item.stoneAmountPaise ?? 0n
  const otherChargesPaise = item.otherChargesPaise ?? 0n
  const discountPaise = item.discountPaise ?? 0n
  const gstRateBps = item.gstRateBps ?? 300 // 3.00%
  const quantity = item.quantity ?? 1
  const stoneWeightMg = item.stoneWeightMg ?? 0n

  // Metal Value in Paise = (netWeightMg * ratePaisePerGram) / 1000 mg
  const metalValuePaise = (item.netWeightMg * item.ratePaisePerGram) / 1000n

  // Subtotal = (Metal + Making + Stone + Other) * Quantity
  const singleSubtotalPaise = metalValuePaise + makingAmountPaise + stoneAmountPaise + otherChargesPaise
  const subtotalPaise = singleSubtotalPaise * BigInt(quantity)

  // Taxable after discount
  const taxableAmountPaise = subtotalPaise > discountPaise ? subtotalPaise - discountPaise : 0n

  // GST in Paise = (taxableAmountPaise * gstRateBps) / 10000 bps
  const gstAmountPaise = (taxableAmountPaise * BigInt(gstRateBps)) / 10000n

  // Final Total for Line Item
  const totalPaise = taxableAmountPaise + gstAmountPaise

  return {
    ...item,
    stoneWeightMg,
    makingAmountPaise,
    stoneAmountPaise,
    otherChargesPaise,
    discountPaise,
    gstRateBps,
    quantity,
    subtotalPaise,
    gstAmountPaise,
    totalPaise,
  }
}

/**
 * Server Service: Sales & Billing
 */
export const SalesService = {
  /**
   * Creates a new Sale invoice inside an ACID transaction with stock deduction and customer ledger update.
   */
  async createSale(input: CreateSaleInput) {
    return db.$transaction(async (tx) => {
      // 1. Check idempotency key if provided
      if (input.idempotencyKey) {
        const existing = await tx.sale.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: { items: true, payments: true },
        })
        if (existing) return existing
      }

      // 2. Calculate item totals
      const calculatedItems = input.items.map(calculateLineItem)

      const subtotalPaise = calculatedItems.reduce((acc, it) => acc + it.subtotalPaise, 0n)
      const totalMakingPaise = calculatedItems.reduce((acc, it) => acc + it.makingAmountPaise, 0n)
      const totalStonePaise = calculatedItems.reduce((acc, it) => acc + it.stoneAmountPaise, 0n)
      const totalOtherPaise = calculatedItems.reduce((acc, it) => acc + it.otherChargesPaise, 0n)
      const totalDiscountPaise = calculatedItems.reduce((acc, it) => acc + it.discountPaise, 0n)
      const totalGstPaise = calculatedItems.reduce((acc, it) => acc + it.gstAmountPaise, 0n)

      const oldGoldAdjustmentPaise = input.oldGoldAdjustmentPaise ?? 0n
      const grossTotalPaise = subtotalPaise - totalDiscountPaise + totalGstPaise
      const grandTotalPaise = grossTotalPaise > oldGoldAdjustmentPaise ? grossTotalPaise - oldGoldAdjustmentPaise : 0n

      const paidAmountPaise = input.paidAmountPaise ?? grandTotalPaise
      const dueAmountPaise = grandTotalPaise > paidAmountPaise ? grandTotalPaise - paidAmountPaise : 0n

      let status: SaleStatus = SaleStatus.PAID
      if (dueAmountPaise > 0n && paidAmountPaise > 0n) {
        status = SaleStatus.PARTIAL
      } else if (dueAmountPaise > 0n && paidAmountPaise === 0n) {
        status = SaleStatus.DUE
      }

      // 3. Generate atomic gap-free invoice number
      const invoiceNo = await generateInvoiceNumber(tx)

      // 4. Validate and update product stock
      for (const item of calculatedItems) {
        if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          })

          if (!product) {
            throw new Error(`Product ${item.productCode || item.name} not found`)
          }

          if (product.stock < item.quantity) {
            throw new Error(
              `Insufficient stock for '${product.name}'. Available: ${product.stock}, Requested: ${item.quantity}`
            )
          }

          // Deduct stock with optimistic concurrency version check
          await tx.product.update({
            where: { id: product.id, version: product.version },
            data: {
              stock: { decrement: item.quantity },
              version: { increment: 1 },
            },
          })

          // Record stock movement ledger entry
          await tx.stockMovement.create({
            data: {
              itemType: StockItemType.PRODUCT,
              itemId: product.id,
              itemName: product.name,
              fromLocation: 'Display Stock',
              toLocation: `Customer (${input.customerName})`,
              quantity: item.quantity,
              weightMg: item.grossWeightMg,
              reason: `Sale Invoice ${invoiceNo}`,
              reference: invoiceNo,
              performedById: input.billedById,
            },
          })
        }
      }

      // 5. Create the Sale record
      const sale = await tx.sale.create({
        data: {
          invoiceNo,
          customerId: input.customerId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerAddress: input.customerAddress || null,
          customerGstin: input.customerGstin || null,
          subtotalPaise,
          totalMakingPaise,
          totalStonePaise,
          totalOtherPaise,
          totalDiscountPaise,
          totalGstPaise,
          grandTotalPaise,
          paidAmountPaise,
          dueAmountPaise,
          paymentMode: input.paymentMode ?? PaymentMode.CASH,
          paymentRef: input.paymentRef || null,
          status,
          oldGoldAdjustmentPaise,
          branch: input.branch || 'Main Branch',
          billedById: input.billedById,
          idempotencyKey: input.idempotencyKey || null,
          items: {
            create: calculatedItems.map((it) => ({
              productId: it.productId || null,
              productCode: it.productCode || null,
              name: it.name,
              hsn: it.hsn || '7113',
              metal: it.metal || MetalType.GOLD,
              purity: it.purity,
              grossWeightMg: it.grossWeightMg,
              netWeightMg: it.netWeightMg,
              stoneWeightMg: it.stoneWeightMg,
              ratePaisePerGram: it.ratePaisePerGram,
              makingAmountPaise: it.makingAmountPaise,
              stoneAmountPaise: it.stoneAmountPaise,
              otherChargesPaise: it.otherChargesPaise,
              subtotalPaise: it.subtotalPaise,
              discountPaise: it.discountPaise,
              gstRateBps: it.gstRateBps,
              gstAmountPaise: it.gstAmountPaise,
              totalPaise: it.totalPaise,
              quantity: it.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      })

      // 6. Record Payment if paidAmount > 0
      if (paidAmountPaise > 0n) {
        const paymentId = await generatePaymentId(tx)
        await tx.payment.create({
          data: {
            paymentId,
            saleId: sale.id,
            invoiceNo: sale.invoiceNo,
            customerId: input.customerId,
            customerName: input.customerName,
            amountPaise: paidAmountPaise,
            paymentMode: input.paymentMode ?? PaymentMode.CASH,
            transactionId: input.paymentRef || null,
            status: PaymentStatus.COMPLETED,
            receivedById: input.billedById,
            remarks: `Payment for invoice ${invoiceNo}`,
          },
        })
      }

      // 7. Update Customer aggregates
      await tx.customer.update({
        where: { id: input.customerId },
        data: {
          totalPurchasePaise: { increment: grandTotalPaise },
          totalPaidPaise: { increment: paidAmountPaise },
          totalDuePaise: { increment: dueAmountPaise },
          totalBills: { increment: 1 },
        },
      })

      // 8. Log Audit Record
      await tx.auditLog.create({
        data: {
          userId: input.billedById,
          userName: input.billedByName,
          action: 'CREATE_SALE',
          entity: 'Sale',
          entityId: sale.id,
          details: `Created Invoice ${invoiceNo} for ${input.customerName} (₹${(Number(grandTotalPaise) / 100).toFixed(2)})`,
          ipAddress: input.ipAddress || null,
        },
      })

      return sale
    })
  },

  /**
   * Cancels/Voids a Sale invoice, restoring finished stock and reversing customer ledger balances.
   */
  async cancelSale(input: CancelSaleInput) {
    return db.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: input.saleId },
        include: { items: true, payments: true },
      })

      if (!sale) throw new Error('Sale not found')
      if (sale.status === SaleStatus.CANCELLED || sale.status === SaleStatus.VOID) {
        throw new Error('Sale is already cancelled or voided')
      }

      // 1. Restore product stock
      for (const item of sale.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              version: { increment: 1 },
            },
          })

          await tx.stockMovement.create({
            data: {
              itemType: StockItemType.PRODUCT,
              itemId: item.productId,
              itemName: item.name,
              fromLocation: `Customer Return (${sale.customerName})`,
              toLocation: 'Display Stock',
              quantity: item.quantity,
              weightMg: item.grossWeightMg,
              reason: `Sale Cancellation: ${sale.invoiceNo} — ${input.cancelReason}`,
              reference: sale.invoiceNo,
              performedById: input.cancelledById,
            },
          })
        }
      }

      // 2. Reverse customer balance
      await tx.customer.update({
        where: { id: sale.customerId },
        data: {
          totalPurchasePaise: { decrement: sale.grandTotalPaise },
          totalPaidPaise: { decrement: sale.paidAmountPaise },
          totalDuePaise: { decrement: sale.dueAmountPaise },
          totalBills: { decrement: 1 },
        },
      })

      // 3. Mark payments as reversed/cancelled
      await tx.payment.updateMany({
        where: { saleId: sale.id },
        data: {
          status: PaymentStatus.CANCELLED,
          cancelReason: input.cancelReason,
        },
      })

      // 4. Update sale status
      const updatedSale = await tx.sale.update({
        where: { id: sale.id },
        data: {
          status: SaleStatus.CANCELLED,
          cancelReason: input.cancelReason,
          cancelledAt: new Date(),
          cancelledById: input.cancelledById,
          version: { increment: 1 },
        },
        include: { items: true },
      })

      // 5. Log audit
      await tx.auditLog.create({
        data: {
          userId: input.cancelledById,
          userName: input.cancelledByName,
          action: 'CANCEL_SALE',
          entity: 'Sale',
          entityId: sale.id,
          details: `Cancelled invoice ${sale.invoiceNo}. Reason: ${input.cancelReason}`,
          ipAddress: input.ipAddress || null,
        },
      })

      return updatedSale
    })
  },

  /**
   * Records payment received against an existing invoice or customer account.
   */
  async recordPayment(input: RecordSalePaymentInput) {
    return db.$transaction(async (tx) => {
      const paymentId = await generatePaymentId(tx)

      const payment = await tx.payment.create({
        data: {
          paymentId,
          saleId: input.saleId || null,
          invoiceNo: input.invoiceNo || null,
          customerId: input.customerId,
          customerName: input.customerName,
          amountPaise: input.amountPaise,
          paymentMode: input.paymentMode,
          transactionId: input.transactionId || null,
          status: PaymentStatus.COMPLETED,
          receivedById: input.receivedById,
          remarks: input.remarks || null,
        },
      })

      // If tied to a specific sale, update the sale due/paid amounts
      if (input.saleId) {
        const sale = await tx.sale.findUnique({ where: { id: input.saleId } })
        if (sale) {
          const newPaid = sale.paidAmountPaise + input.amountPaise
          const newDue = sale.grandTotalPaise > newPaid ? sale.grandTotalPaise - newPaid : 0n
          const newStatus = newDue === 0n ? SaleStatus.PAID : SaleStatus.PARTIAL

          await tx.sale.update({
            where: { id: sale.id },
            data: {
              paidAmountPaise: newPaid,
              dueAmountPaise: newDue,
              status: newStatus,
            },
          })
        }
      }

      // Update customer ledger
      await tx.customer.update({
        where: { id: input.customerId },
        data: {
          totalPaidPaise: { increment: input.amountPaise },
          totalDuePaise: { decrement: input.amountPaise },
        },
      })

      // Log audit
      await tx.auditLog.create({
        data: {
          userId: input.receivedById,
          userName: input.receivedByName,
          action: 'RECORD_PAYMENT',
          entity: 'Payment',
          entityId: payment.id,
          details: `Received ₹${(Number(input.amountPaise) / 100).toFixed(2)} from ${input.customerName} (${input.paymentMode})`,
          ipAddress: input.ipAddress || null,
        },
      })

      return payment
    })
  },

  /**
   * Processes a sales return with optional restocking and refund adjustment.
   */
  async processSalesReturn(input: ProcessSalesReturnInput) {
    return db.$transaction(async (tx) => {
      const returnId = await generateReturnId(tx)
      const refundAmountPaise = input.refundAmountPaise ?? 0n
      const exchangeAmountPaise = input.exchangeAmountPaise ?? 0n
      const returnQuantity = input.returnQuantity ?? 1

      const salesReturn = await tx.salesReturn.create({
        data: {
          returnId,
          originalInvoiceNo: input.originalInvoiceNo,
          saleId: input.saleId,
          customerName: input.customerName,
          productName: input.productName,
          returnQuantity,
          returnWeightMg: input.returnWeightMg,
          reason: input.reason,
          refundAmountPaise,
          exchangeAmountPaise,
          restockingStatus: input.restockProduct ? RestockingStatus.DONE : RestockingStatus.PENDING,
          status: RecordStatus.ACTIVE,
        },
      })

      // Restock if product specified and requested
      if (input.productId && input.restockProduct) {
        await tx.product.update({
          where: { id: input.productId },
          data: {
            stock: { increment: returnQuantity },
            version: { increment: 1 },
          },
        })

        await tx.stockMovement.create({
          data: {
            itemType: StockItemType.PRODUCT,
            itemId: input.productId,
            itemName: input.productName,
            fromLocation: `Customer Return (${input.customerName})`,
            toLocation: 'Display Stock',
            quantity: returnQuantity,
            weightMg: input.returnWeightMg,
            reason: `Return ${returnId} for Invoice ${input.originalInvoiceNo}`,
            reference: returnId,
            performedById: input.performedById,
          },
        })
      }

      // Log audit
      await tx.auditLog.create({
        data: {
          userId: input.performedById,
          userName: input.performedByName,
          action: 'SALES_RETURN',
          entity: 'SalesReturn',
          entityId: salesReturn.id,
          details: `Processed return ${returnId} (${input.productName}) for invoice ${input.originalInvoiceNo}`,
          ipAddress: input.ipAddress || null,
        },
      })

      return salesReturn
    })
  },
}
