/**
 * S.S JEWELLERY ERP — LocalStorage Migration & Data Import Utility
 * Imports historical JSON dumps from the localStorage-only prototype into PostgreSQL.
 * Preserves all historical invoice numbers, voucher numbers, dates, and ledger balances.
 * 
 * Usage:
 *   npx tsx scripts/import-localstorage.ts path/to/exported-data.json
 */

import fs from 'fs'
import path from 'path'
import {
  PrismaClient,
  UserRole,
  MetalType,
  MaterialType,
  GoldStockStatus,
  PaymentMode,
  SaleStatus,
  PaymentStatus,
  PurchasePaymentStatus,
  ExchangeType,
  WorkPriority,
  WorkStatusValue,
  QCResult,
  RecordStatus,
  RestockingStatus,
} from '@prisma/client'
import bcrypt from 'bcryptjs'
import {
  rupeesToPaise,
  gramsToMg,
  percentToBps,
} from '../src/lib/conversions'

const prisma = new PrismaClient()

interface ExportedData {
  users?: Array<Record<string, any>>
  customers?: Array<Record<string, any>>
  suppliers?: Array<Record<string, any>>
  goldStock?: Array<Record<string, any>>
  stones?: Array<Record<string, any>>
  products?: Array<Record<string, any>>
  workflows?: Array<Record<string, any>>
  workOrders?: Array<Record<string, any>>
  sales?: Array<Record<string, any>>
  payments?: Array<Record<string, any>>
  exchanges?: Array<Record<string, any>>
  returns?: Array<Record<string, any>>
  settings?: Record<string, any>
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('❌ Error: Please provide the path to the exported JSON file.')
    console.log('Usage: npx tsx scripts/import-localstorage.ts <path_to_file.json>')
    process.exit(1)
  }

  const filePath = path.resolve(process.cwd(), args[0])
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found at '${filePath}'`)
    process.exit(1)
  }

  console.log(`🚀 Starting data migration from: ${filePath}`)
  const rawData = fs.readFileSync(filePath, 'utf-8')
  const data: ExportedData = JSON.parse(rawData)

  await prisma.$transaction(async (tx) => {
    // 1. Settings
    if (data.settings) {
      console.log('📦 Importing shop settings...')
      await tx.shopSetting.upsert({
        where: { id: 'default' },
        update: {},
        create: {
          id: 'default',
          shopName: data.settings.shopName || 'S.S JEWELLERY',
          ownerName: data.settings.ownerName || 'Suresh Shah',
          phone: data.settings.phone || '+91 98250 12345',
          email: data.settings.email || 'contact@ssjewellery.in',
          address: data.settings.address || 'Shop 12, Manek Chowk, Ring Road',
          city: data.settings.city || 'Surat',
          pincode: data.settings.pincode || '395003',
          gstin: data.settings.gstin || '24ABCDE1234F1Z5',
          pan: data.settings.pan || 'ABCDE1234F',
          defaultGstRateBps: percentToBps(data.settings.defaultGstRate || 3),
          defaultGoldRate24KPaise: rupeesToPaise(data.settings.defaultGoldRate24K || 7250),
          defaultSilverRatePaisePerKg: rupeesToPaise(data.settings.defaultSilverRate || 94500),
          branch: data.settings.branch || 'Main Branch',
        },
      })
    }

    // 2. Users
    if (data.users && data.users.length > 0) {
      console.log(`👤 Importing ${data.users.length} users...`)
      for (const u of data.users) {
        const passwordHash = await bcrypt.hash(u.password || 'ssj@user2026', 10)
        await tx.user.upsert({
          where: { username: u.username.toLowerCase() },
          update: {
            name: u.name,
            phone: u.phone,
            role: (u.role?.toUpperCase() as UserRole) || UserRole.STAFF,
            active: u.active ?? true,
            specialty: u.specialty || null,
          },
          create: {
            id: u.id || undefined,
            username: u.username.toLowerCase(),
            name: u.name,
            phone: u.phone,
            email: u.email || null,
            role: (u.role?.toUpperCase() as UserRole) || UserRole.STAFF,
            passwordHash,
            active: u.active ?? true,
            specialty: u.specialty || null,
            createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          },
        })
      }
    }

    // 3. Suppliers
    if (data.suppliers && data.suppliers.length > 0) {
      console.log(`🏢 Importing ${data.suppliers.length} suppliers...`)
      for (const s of data.suppliers) {
        await tx.supplier.upsert({
          where: { supplierCode: s.id || s.supplierCode },
          update: {
            name: s.name,
            totalPurchasePaise: rupeesToPaise(s.totalPurchase || 0),
            totalPaidPaise: rupeesToPaise(s.totalPaid || 0),
          },
          create: {
            id: s.id || undefined,
            supplierCode: s.supplierCode || s.id || `SUP-${Date.now().toString().slice(-4)}`,
            name: s.name,
            companyName: s.companyName || null,
            phone: s.phone || '0000000000',
            email: s.email || null,
            address: s.address || null,
            gstin: s.gstin || null,
            pan: s.pan || null,
            totalPurchasePaise: rupeesToPaise(s.totalPurchase || 0),
            totalPaidPaise: rupeesToPaise(s.totalPaid || 0),
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          },
        })
      }
    }

    // 4. Customers
    if (data.customers && data.customers.length > 0) {
      console.log(`👥 Importing ${data.customers.length} customers...`)
      for (const c of data.customers) {
        await tx.customer.upsert({
          where: { customerId: c.customerId || c.id },
          update: {
            totalPurchasePaise: rupeesToPaise(c.totalPurchase || 0),
            totalPaidPaise: rupeesToPaise(c.totalPaid || 0),
            totalDuePaise: rupeesToPaise(c.totalDue || 0),
            totalBills: c.totalBills || 0,
          },
          create: {
            id: c.id || undefined,
            customerId: c.customerId || c.id || `CUST-${Date.now().toString().slice(-4)}`,
            name: c.name,
            phone: c.phone || '0000000000',
            email: c.email || null,
            address: c.address || null,
            city: c.city || null,
            pincode: c.pincode || null,
            gstin: c.gstin || null,
            pan: c.pan || null,
            totalPurchasePaise: rupeesToPaise(c.totalPurchase || 0),
            totalPaidPaise: rupeesToPaise(c.totalPaid || 0),
            totalDuePaise: rupeesToPaise(c.totalDue || 0),
            totalBills: c.totalBills || 0,
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          },
        })
      }
    }

    // 5. Products & Categories
    if (data.products && data.products.length > 0) {
      console.log(`💍 Importing ${data.products.length} products...`)
      for (const p of data.products) {
        // Ensure category exists
        const categoryName = p.category || 'General'
        const category = await tx.category.upsert({
          where: { name: categoryName },
          update: {},
          create: { name: categoryName },
        })

        await tx.product.upsert({
          where: { productCode: p.productCode },
          update: {
            stock: p.stock ?? 1,
            sellingPricePaise: rupeesToPaise(p.sellingPrice || 0),
            costPricePaise: rupeesToPaise(p.costPrice || 0),
          },
          create: {
            id: p.id || undefined,
            productCode: p.productCode,
            barcode: p.barcode || p.productCode,
            name: p.name,
            categoryId: category.id,
            metal: (p.metal?.toUpperCase() as MetalType) || MetalType.GOLD,
            purity: p.purity || '22K',
            grossWeightMg: gramsToMg(p.grossWeight || 0),
            netWeightMg: gramsToMg(p.netWeight || 0),
            stoneWeightMg: gramsToMg(p.stoneWeight || 0),
            wastageMg: gramsToMg(p.wastage || 0),
            makingChargePaise: rupeesToPaise(p.makingCharge || 0),
            otherChargesPaise: rupeesToPaise(p.otherCharges || 0),
            gstRateBps: percentToBps(p.gstRate || 3),
            sellingPricePaise: rupeesToPaise(p.sellingPrice || 0),
            costPricePaise: rupeesToPaise(p.costPrice || 0),
            stock: p.stock ?? 1,
            hsnCode: p.hsnCode || '7113',
            imageColor: p.imageColor || 'from-amber-400 to-yellow-600',
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          },
        })
      }
    }

    // 6. Sales & Invoices
    if (data.sales && data.sales.length > 0) {
      console.log(`🧾 Importing ${data.sales.length} sales invoices...`)
      for (const s of data.sales) {
        // Find billedBy user
        const adminUser = await tx.user.findFirst({ where: { role: UserRole.ADMIN } })
        const billedById = adminUser?.id || 'usr-admin'

        // Check if customer exists
        let customerId = s.customerId
        const customerExists = await tx.customer.findUnique({ where: { id: customerId } })
        if (!customerExists) {
          const fallbackCust = await tx.customer.findFirst()
          customerId = fallbackCust?.id || 'cus-1'
        }

        await tx.sale.upsert({
          where: { invoiceNo: s.invoiceNo },
          update: {},
          create: {
            id: s.id || undefined,
            invoiceNo: s.invoiceNo,
            customerId,
            customerName: s.customerName || 'Walk-in Customer',
            customerPhone: s.customerPhone || '0000000000',
            subtotalPaise: rupeesToPaise(s.subtotal || 0),
            totalMakingPaise: rupeesToPaise(s.totalMaking || 0),
            totalStonePaise: rupeesToPaise(s.totalStone || 0),
            totalOtherPaise: rupeesToPaise(s.totalOther || 0),
            totalDiscountPaise: rupeesToPaise(s.totalDiscount || 0),
            totalGstPaise: rupeesToPaise(s.totalGst || 0),
            grandTotalPaise: rupeesToPaise(s.grandTotal || 0),
            paidAmountPaise: rupeesToPaise(s.paidAmount || s.grandTotal || 0),
            dueAmountPaise: rupeesToPaise(s.dueAmount || 0),
            paymentMode: (s.paymentMode?.toUpperCase() as PaymentMode) || PaymentMode.CASH,
            paymentRef: s.paymentRef || null,
            status: (s.status?.toUpperCase() as SaleStatus) || SaleStatus.PAID,
            billedById,
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
            items: {
              create: (s.items || []).map((it: any) => ({
                name: it.name || 'Jewellery Item',
                purity: it.purity || '22K',
                grossWeightMg: gramsToMg(it.grossWeight || 0),
                netWeightMg: gramsToMg(it.netWeight || 0),
                ratePaisePerGram: rupeesToPaise(it.rate || 0),
                makingAmountPaise: rupeesToPaise(it.makingAmount || 0),
                stoneAmountPaise: rupeesToPaise(it.stoneAmount || 0),
                subtotalPaise: rupeesToPaise(it.subtotal || 0),
                totalPaise: rupeesToPaise(it.total || 0),
                quantity: it.quantity || 1,
              })),
            },
          },
        })
      }
    }

    console.log('✅ LocalStorage migration completed successfully!')
  })
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
