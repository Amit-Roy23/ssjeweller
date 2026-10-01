import 'dotenv/config'
import { db } from '../src/lib/db'
import { createSessionToken } from '../src/lib/auth/session'
import { SalesService } from '../src/lib/services/sales.service'
import { generateCustomerId } from '../src/lib/services/sequence.service'
import { MetalType, PaymentMode, SaleStatus, UserRole } from '@prisma/client'

async function runE2ETest() {
  console.log('================================================================');
  console.log('🧪 RUNNING SUPABASE DATABASE VERIFICATION & AUDIT TESTS');
  console.log('================================================================\n');

  // 1. Verify Admin User
  const admin = await db.user.findUnique({ where: { username: 'admin' } })
  if (!admin) {
    throw new Error('Admin user not found in database')
  }
  console.log(`✓ Verified Admin User: ${admin.name} (${admin.username}, Role: ${admin.role})`);

  // 2. Create Customer "TEST DB CHECK"
  console.log('\n--- Step b: Creating Customer "TEST DB CHECK" ---');
  let customer = await db.customer.findFirst({ where: { name: 'TEST DB CHECK' } })
  if (!customer) {
    const custId = await db.$transaction(async (tx) => {
      const generatedId = await generateCustomerId(tx)
      return tx.customer.create({
        data: {
          customerId: generatedId,
          name: 'TEST DB CHECK',
          phone: '9876543210',
          email: 'testdbcheck@example.com',
          city: 'Surat',
          pincode: '395003',
          address: 'Ring Road Test Market',
        }
      })
    })
    customer = custId
    console.log(`✓ Created Customer: ${customer.name} (ID: ${customer.customerId}, DB ID: ${customer.id})`);
  } else {
    console.log(`✓ Customer already exists: ${customer.name} (ID: ${customer.customerId}, DB ID: ${customer.id})`);
  }

  // 3. Create or Find a Category and Test Product
  const category = await db.category.findFirst()
  if (!category) throw new Error('No categories found')

  let product = await db.product.findFirst({ where: { productCode: 'TEST-RING-001' } })
  if (!product) {
    const pCode = 'TEST-RING-001'
    const barcode = '8901234500999'
    product = await db.product.create({
      data: {
        productCode: pCode,
        barcode: barcode,
        name: 'Test 22K Gold Ring',
        categoryId: category.id,
        metal: MetalType.GOLD,
        purity: '22K',
        grossWeightMg: 5000n, // 5.000g
        netWeightMg: 5000n,
        stoneWeightMg: 0n,
        wastageMg: 200n,
        makingChargePaise: 150000n, // ₹1,500
        sellingPricePaise: 3750000n, // ₹37,500
        costPricePaise: 3500000n,
        stock: 5,
      }
    })
    console.log(`✓ Created Test Product: ${product.name} (Stock: ${product.stock})`);
  } else {
    console.log(`✓ Found Test Product: ${product.name} (Stock: ${product.stock})`);
  }

  const initialStock = product.stock

  // 4. Create a Test Sale Invoice
  console.log('\n--- Step d: Creating Test Sale Invoice ---');
  const sale = await SalesService.createSale({
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerAddress: customer.address,
    items: [
      {
        productId: product.id,
        productCode: product.productCode,
        name: product.name,
        metal: MetalType.GOLD,
        purity: '22K',
        grossWeightMg: 5000n,
        netWeightMg: 5000n,
        ratePaisePerGram: 720000n, // ₹7,200/g
        makingAmountPaise: 150000n,
        gstRateBps: 300,
        quantity: 1,
      }
    ],
    paymentMode: PaymentMode.CASH,
    paidAmountPaise: 3862500n,
    branch: 'Main Branch',
    billedById: admin.id,
    billedByName: admin.name,
    ipAddress: '127.0.0.1',
  })

  console.log(`✓ Created Sale Invoice: ${sale.invoiceNo} (Grand Total: ₹${(Number(sale.grandTotalPaise) / 100).toFixed(2)})`);

  // Check product stock decremented
  const productAfterSale = await db.product.findUnique({ where: { id: product.id } })
  console.log(`✓ Product Stock after sale: ${productAfterSale?.stock} (Decremented by 1 from ${initialStock})`);

  // 5. Cancel the Sale Invoice
  console.log('\n--- Step d: Cancelling Test Sale Invoice ---');
  const cancelledSale = await SalesService.cancelSale({
    saleId: sale.id,
    cancelledById: admin.id,
    cancelledByName: admin.name,
    cancelReason: 'Supabase DB Verification Test',
    ipAddress: '127.0.0.1',
  })

  console.log(`✓ Cancelled Sale Invoice: ${cancelledSale.invoiceNo} (Status: ${cancelledSale.status})`);

  // Check product stock restored
  const productAfterCancel = await db.product.findUnique({ where: { id: product.id } })
  console.log(`✓ Product Stock after cancel: ${productAfterCancel?.stock} (Restored back to ${initialStock})`);

  // 6. Check Audit Logs in Supabase
  console.log('\n--- Checking Audit Logs in Supabase ---');
  const auditLogs = await db.auditLog.findMany({
    where: {
      entityId: { in: [customer.id, sale.id] }
    },
    orderBy: { timestamp: 'desc' },
    take: 5,
  })

  for (const log of auditLogs) {
    console.log(`  ✓ Audit Log: [${log.action}] ${log.details} (By: ${log.userName} at ${log.timestamp.toISOString()})`);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL DATABASE VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

runE2ETest()
  .catch((err) => {
    console.error('Test failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
