import { SaleStatus, PaymentStatus, RecordStatus } from '@prisma/client'
import { db } from '@/lib/db'

export const LedgerService = {
  /**
   * Retrieves complete transaction history and statement for a customer.
   */
  async getCustomerStatement(customerId: string) {
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        sales: {
          where: { status: { not: SaleStatus.CANCELLED } },
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        },
        payments: {
          where: { status: PaymentStatus.COMPLETED },
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!customer) throw new Error('Customer not found')

    return {
      customer: {
        id: customer.id,
        customerId: customer.customerId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        gstin: customer.gstin,
        pan: customer.pan,
        totalPurchasePaise: customer.totalPurchasePaise,
        totalPaidPaise: customer.totalPaidPaise,
        totalDuePaise: customer.totalDuePaise,
        totalBills: customer.totalBills,
      },
      sales: customer.sales,
      payments: customer.payments,
    }
  },

  /**
   * Retrieves complete procurement invoice history and statement for a supplier.
   */
  async getSupplierStatement(supplierId: string) {
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      include: {
        purchases: {
          where: { status: RecordStatus.ACTIVE },
          orderBy: { purchaseDate: 'desc' },
          include: { items: true },
        },
      },
    })

    if (!supplier) throw new Error('Supplier not found')

    const pendingBalancePaise =
      supplier.openingBalancePaise + supplier.totalPurchasePaise - supplier.totalPaidPaise

    return {
      supplier: {
        id: supplier.id,
        supplierCode: supplier.supplierCode,
        name: supplier.name,
        companyName: supplier.companyName,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        gstin: supplier.gstin,
        totalPurchasePaise: supplier.totalPurchasePaise,
        totalPaidPaise: supplier.totalPaidPaise,
        pendingBalancePaise,
      },
      purchases: supplier.purchases,
    }
  },

  /**
   * Computes overall financial overview metrics within a date range.
   */
  async getFinancialOverview(startDate?: Date, endDate?: Date) {
    const dateFilter = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    }

    const [sales, purchases, payments, customers] = await Promise.all([
      db.sale.findMany({
        where: {
          status: { notIn: [SaleStatus.CANCELLED, SaleStatus.VOID] },
          ...(startDate || endDate ? { createdAt: dateFilter } : {}),
        },
      }),
      db.purchase.findMany({
        where: {
          status: RecordStatus.ACTIVE,
          ...(startDate || endDate ? { purchaseDate: dateFilter } : {}),
        },
      }),
      db.payment.findMany({
        where: {
          status: PaymentStatus.COMPLETED,
          ...(startDate || endDate ? { date: dateFilter } : {}),
        },
      }),
      db.customer.findMany({
        select: { totalDuePaise: true },
      }),
    ])

    const totalSalesRevenuePaise = sales.reduce((acc, s) => acc + s.grandTotalPaise, 0n)
    const totalGstCollectedPaise = sales.reduce((acc, s) => acc + s.totalGstPaise, 0n)
    const totalPurchasesCostPaise = purchases.reduce((acc, p) => acc + p.grandTotalPaise, 0n)
    const totalPaymentsReceivedPaise = payments.reduce((acc, p) => acc + p.amountPaise, 0n)
    const totalCustomerOutstandingDuePaise = customers.reduce((acc, c) => acc + c.totalDuePaise, 0n)

    return {
      totalSalesRevenuePaise,
      totalGstCollectedPaise,
      totalPurchasesCostPaise,
      totalPaymentsReceivedPaise,
      totalCustomerOutstandingDuePaise,
      totalInvoicesCount: sales.length,
      totalPurchasesCount: purchases.length,
    }
  },
}
