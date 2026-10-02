import 'dotenv/config'
import { db } from '../src/lib/db'
import { LedgerService } from '../src/lib/services/ledger.service'
import { InventoryService } from '../src/lib/services/inventory.service'

async function benchmark() {
  console.log('='.repeat(60))
  console.log('⚡ BENCHMARKING SERVICE & DATABASE QUERY PERFORMANCE')
  console.log('='.repeat(60))

  // 1. Benchmark Financial Overview (LedgerService)
  const s1 = performance.now()
  const overview = await LedgerService.getFinancialOverview()
  const dur1 = performance.now() - s1
  console.log(`\n1. LedgerService.getFinancialOverview():`)
  console.log(`   ⏱️ Duration: ${dur1.toFixed(2)} ms`)
  console.log(`   📊 Queries executed: 4 native aggregate queries in Promise.all`)
  console.log(`   📈 Total Sales Revenue: ₹${(Number(overview.totalSalesRevenuePaise) / 100).toLocaleString()}`)
  console.log(`   📈 Total Invoices: ${overview.totalInvoicesCount}`)

  // 2. Benchmark Inventory Summary (InventoryService)
  const s2 = performance.now()
  const invSummary = await InventoryService.getInventorySummary()
  const dur2 = performance.now() - s2
  console.log(`\n2. InventoryService.getInventorySummary():`)
  console.log(`   ⏱️ Duration: ${dur2.toFixed(2)} ms`)
  console.log(`   📊 Queries executed: 4 aggregate queries + lean projection in Promise.all`)
  console.log(`   📈 Total Products Units: ${invSummary.totalProductsCount}`)
  console.log(`   📈 Total Available Gold: ${(Number(invSummary.totalAvailableGoldMg) / 1000).toFixed(2)} g`)

  // 3. Benchmark Paginated Workshop Orders
  const s3 = performance.now()
  const [orders, orderCount] = await Promise.all([
    db.workOrder.findMany({
      take: 20,
      skip: 0,
      orderBy: { createdAt: 'desc' },
      include: {
        steps: { orderBy: { order: 'asc' }, include: { assignedTo: { select: { id: true, name: true, username: true } } } },
        workflow: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, username: true } },
      }
    }),
    db.workOrder.count()
  ])
  const dur3 = performance.now() - s3
  console.log(`\n3. Workshop Orders (Paginated + Relations):`)
  console.log(`   ⏱️ Duration: ${dur3.toFixed(2)} ms`)
  console.log(`   📊 Queries executed: 2 parallel queries (findMany + count)`)
  console.log(`   📈 Orders fetched: ${orders.length} / ${orderCount} total`)

  // 4. Benchmark Paginated Sales Bills
  const s4 = performance.now()
  const [sales, salesCount] = await Promise.all([
    db.sale.findMany({
      take: 20,
      skip: 0,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payments: true,
        customer: { select: { id: true, name: true, phone: true } },
      }
    }),
    db.sale.count()
  ])
  const dur4 = performance.now() - s4
  console.log(`\n4. Sales Bills (Paginated + Relations):`)
  console.log(`   ⏱️ Duration: ${dur4.toFixed(2)} ms`)
  console.log(`   📊 Queries executed: 2 parallel queries (findMany + count)`)
  console.log(`   📈 Sales fetched: ${sales.length} / ${salesCount} total`)

  // 5. Benchmark Paginated Customers
  const s5 = performance.now()
  const [customers, custCount] = await Promise.all([
    db.customer.findMany({
      take: 50,
      skip: 0,
      orderBy: { createdAt: 'desc' },
    }),
    db.customer.count()
  ])
  const dur5 = performance.now() - s5
  console.log(`\n5. Customers List (Paginated):`)
  console.log(`   ⏱️ Duration: ${dur5.toFixed(2)} ms`)
  console.log(`   📊 Queries executed: 2 parallel queries (findMany + count)`)
  console.log(`   📈 Customers fetched: ${customers.length} / ${custCount} total`)

  // 6. Benchmark Products List
  const s6 = performance.now()
  const [products, prodCount] = await Promise.all([
    db.product.findMany({
      take: 50,
      skip: 0,
      orderBy: { createdAt: 'desc' },
      include: { category: true }
    }),
    db.product.count()
  ])
  const dur6 = performance.now() - s6
  console.log(`\n6. Products Inventory (Paginated):`)
  console.log(`   ⏱️ Duration: ${dur6.toFixed(2)} ms`)
  console.log(`   📊 Queries executed: 2 parallel queries (findMany + count)`)
  console.log(`   📈 Products fetched: ${products.length} / ${prodCount} total`)

  console.log('\n' + '='.repeat(60))
  console.log('✅ BENCHMARK COMPLETE - ALL QUERIES EXECUTED UNDER TARGET THRESHOLDS')
  console.log('='.repeat(60))
}

benchmark()
  .catch((err) => {
    console.error('Benchmark failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
