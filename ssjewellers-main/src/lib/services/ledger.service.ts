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
   * Computes overall financial overview metrics within a date range with native DB aggregations.
   */
  async getFinancialOverview(startDate?: Date, endDate?: Date) {
    const dateFilter = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    }

    const [salesAgg, purchasesAgg, paymentsAgg, customersAgg] = await Promise.all([
      db.sale.aggregate({
        where: {
          status: { notIn: [SaleStatus.CANCELLED, SaleStatus.VOID] },
          ...(startDate || endDate ? { createdAt: dateFilter } : {}),
        },
        _sum: { grandTotalPaise: true, totalGstPaise: true },
        _count: { id: true },
      }),
      db.purchase.aggregate({
        where: {
          status: RecordStatus.ACTIVE,
          ...(startDate || endDate ? { purchaseDate: dateFilter } : {}),
        },
        _sum: { grandTotalPaise: true },
        _count: { id: true },
      }),
      db.payment.aggregate({
        where: {
          status: PaymentStatus.COMPLETED,
          ...(startDate || endDate ? { date: dateFilter } : {}),
        },
        _sum: { amountPaise: true },
      }),
      db.customer.aggregate({
        _sum: { totalDuePaise: true },
      }),
    ])

    return {
      totalSalesRevenuePaise: salesAgg._sum.grandTotalPaise ?? 0n,
      totalGstCollectedPaise: salesAgg._sum.totalGstPaise ?? 0n,
      totalPurchasesCostPaise: purchasesAgg._sum.grandTotalPaise ?? 0n,
      totalPaymentsReceivedPaise: paymentsAgg._sum.amountPaise ?? 0n,
      totalCustomerOutstandingDuePaise: customersAgg._sum.totalDuePaise ?? 0n,
      totalInvoicesCount: salesAgg._count.id,
      totalPurchasesCount: purchasesAgg._count.id,
    }
  },
}
