import { Prisma, PrismaClient } from '@prisma/client'

export type SequenceEntityType =
  | 'INVOICE'
  | 'PURCHASE'
  | 'CUSTOMER'
  | 'WORK_ORDER'
  | 'PAYMENT'
  | 'EXCHANGE'
  | 'RETURN'

/**
 * Returns current Financial Year string (e.g. "2026" or "2026-27").
 */
export function getCurrentFinancialYear(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-indexed: 0=Jan, 3=Apr
  // If month is Jan-Mar (0,1,2), financial year started previous calendar year
  const startYear = month < 3 ? year - 1 : year
  return `${startYear}`
}

/**
 * Generates the next sequential number atomically within a Prisma transaction.
 * Row-level locking guarantee eliminates race conditions and sequence gaps.
 */
export async function getNextSequence(
  tx: Prisma.TransactionClient | PrismaClient,
  entityType: SequenceEntityType,
  prefix: string,
  financialYear: string = getCurrentFinancialYear(),
  padding: number = 5
): Promise<{ nextNumber: number; formattedCode: string }> {
  // Atomic upsert with increment guarantees unique sequential counters
  const counter = await tx.sequenceCounter.upsert({
    where: {
      entityType_financialYear_prefix: {
        entityType,
        financialYear,
        prefix,
      },
    },
    update: {
      currentValue: { increment: 1 },
    },
    create: {
      entityType,
      financialYear,
      prefix,
      currentValue: 1,
    },
  })

  const nextNumber = counter.currentValue
  const padded = String(nextNumber).padStart(padding, '0')

  // Example formats:
  // prefix = "INV-2026" -> "INV-2026-00126"
  // prefix = "WF"       -> "WF-10029" (if padding 5, e.g. WF-00001 or WF-10029)
  // prefix = "CUST"     -> "CUST-006"
  const formattedCode = `${prefix}-${padded}`

  return {
    nextNumber,
    formattedCode,
  }
}

/**
 * Helper to generate next Gap-Free Invoice Number (e.g. "INV-2026-00126")
 */
export async function generateInvoiceNumber(
  tx: Prisma.TransactionClient,
  prefix = 'INV-2026'
): Promise<string> {
  const { formattedCode } = await getNextSequence(tx, 'INVOICE', prefix, getCurrentFinancialYear(), 5)
  return formattedCode
}

/**
 * Helper to generate next Gap-Free Work Order ID (e.g. "WF-10029")
 */
export async function generateWorkOrderId(
  tx: Prisma.TransactionClient,
  prefix = 'WF'
): Promise<string> {
  const { nextNumber } = await getNextSequence(tx, 'WORK_ORDER', prefix, getCurrentFinancialYear(), 5)
  return `${prefix}-${nextNumber}`
}

/**
 * Helper to generate next Gap-Free Purchase ID (e.g. "PUR-2026-00006")
 */
export async function generatePurchaseId(
  tx: Prisma.TransactionClient,
  prefix = 'PUR-2026'
): Promise<string> {
  const { formattedCode } = await getNextSequence(tx, 'PURCHASE', prefix, getCurrentFinancialYear(), 4)
  return formattedCode
}

/**
 * Helper to generate next Gap-Free Customer ID (e.g. "CUST-006")
 */
export async function generateCustomerId(
  tx: Prisma.TransactionClient,
  prefix = 'CUST'
): Promise<string> {
  const { formattedCode } = await getNextSequence(tx, 'CUSTOMER', prefix, getCurrentFinancialYear(), 3)
  return formattedCode
}

/**
 * Helper to generate next Gap-Free Payment ID (e.g. "PAY-2026-00006")
 */
export async function generatePaymentId(
  tx: Prisma.TransactionClient,
  prefix = 'PAY-2026'
): Promise<string> {
  const { formattedCode } = await getNextSequence(tx, 'PAYMENT', prefix, getCurrentFinancialYear(), 4)
  return formattedCode
}

/**
 * Helper to generate next Gap-Free Exchange Voucher No (e.g. "EX-2026-0010")
 */
export async function generateExchangeVoucherNo(
  tx: Prisma.TransactionClient,
  prefix = 'EX-2026'
): Promise<string> {
  const { formattedCode } = await getNextSequence(tx, 'EXCHANGE', prefix, getCurrentFinancialYear(), 4)
  return formattedCode
}

/**
 * Helper to generate next Gap-Free Return ID (e.g. "RET-2026-0002")
 */
export async function generateReturnId(
  tx: Prisma.TransactionClient,
  prefix = 'RET-2026'
): Promise<string> {
  const { formattedCode } = await getNextSequence(tx, 'RETURN', prefix, getCurrentFinancialYear(), 4)
  return formattedCode
}
