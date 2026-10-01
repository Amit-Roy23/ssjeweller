import { PrismaClient, MetalType, WorkStatusValue } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
})

async function main() {
  console.log('🌱 Starting production bootstrap seeding...')

  // 1. Master Shop Settings
  await prisma.shopSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      shopName: 'S.S JEWELLERY',
      ownerName: 'Suresh Shah',
      phone: '+91 98250 12345',
      email: 'contact@ssjewellery.in',
      address: 'Shop 12, Manek Chowk, Ring Road',
      city: 'Surat',
      pincode: '395003',
      gstin: '24ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      defaultGstRateBps: 300,
      makingGstRateBps: 500,
      defaultGoldRate24KPaise: 725000n, // ₹7,250.00/g
      defaultSilverRatePaisePerKg: 9450000n, // ₹94,500.00/kg
      branch: 'Main Branch',
      currency: '₹',
      invoicePrefix: 'INV-2026',
      purchasePrefix: 'PUR-2026',
      workOrderPrefix: 'WF',
      customerPrefix: 'CUST',
      invoiceFooter: 'Thank you for your business! Visit again.',
      termsConditions:
        '1. Goods once sold will not be taken back.\n2. All disputes subject to Surat jurisdiction.\n3. Gold rate applicable as on date of bill.',
    },
  })
  console.log('  ✓ Shop settings seeded')

  // 2. Default Purities
  const defaultPurities = [
    { label: '24K', percentage: 99.9, metal: MetalType.GOLD, order: 1 },
    { label: '22K', percentage: 91.6, metal: MetalType.GOLD, order: 2 },
    { label: '18K', percentage: 75.0, metal: MetalType.GOLD, order: 3 },
    { label: '14K', percentage: 58.5, metal: MetalType.GOLD, order: 4 },
    { label: '925', percentage: 92.5, metal: MetalType.SILVER, order: 5 },
  ]

  for (const purity of defaultPurities) {
    await prisma.purity.upsert({
      where: { label: purity.label },
      update: { percentage: purity.percentage, metal: purity.metal, order: purity.order },
      create: purity,
    })
  }
  console.log(`  ✓ ${defaultPurities.length} Purities seeded`)

  // 3. Default Categories
  const defaultCategories = [
    { name: 'Rings', order: 1 },
    { name: 'Necklaces', order: 2 },
    { name: 'Earrings', order: 3 },
    { name: 'Bangles', order: 4 },
    { name: 'Chains', order: 5 },
    { name: 'Pendants', order: 6 },
    { name: 'Anklets', order: 7 },
    { name: 'Coins & Bars', order: 8 },
    { name: 'Bracelets', order: 9 },
    { name: 'Mangalsutra', order: 10 },
    { name: 'Nosepins', order: 11 },
  ]

  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { order: cat.order },
      create: cat,
    })
  }
  console.log(`  ✓ ${defaultCategories.length} Categories seeded`)

  // 4. Default Work Statuses
  const defaultStatuses: Array<{ value: WorkStatusValue; label: string; color: string; order: number }> = [
    { value: WorkStatusValue.PENDING, label: 'Pending', color: 'bg-slate-100 text-slate-700', order: 1 },
    { value: WorkStatusValue.ASSIGNED, label: 'Assigned', color: 'bg-blue-100 text-blue-700', order: 2 },
    { value: WorkStatusValue.ACCEPTED, label: 'Accepted', color: 'bg-indigo-100 text-indigo-700', order: 3 },
    { value: WorkStatusValue.IN_PROGRESS, label: 'In Progress', color: 'bg-amber-100 text-amber-700', order: 4 },
    { value: WorkStatusValue.ON_HOLD, label: 'On Hold', color: 'bg-orange-100 text-orange-700', order: 5 },
    { value: WorkStatusValue.QUALITY_CHECK, label: 'Quality Check', color: 'bg-purple-100 text-purple-700', order: 6 },
    { value: WorkStatusValue.REWORK_REQUIRED, label: 'Rework Required', color: 'bg-rose-100 text-rose-700', order: 7 },
    { value: WorkStatusValue.APPROVED, label: 'Approved', color: 'bg-emerald-100 text-emerald-700', order: 8 },
    { value: WorkStatusValue.COMPLETED, label: 'Completed', color: 'bg-green-100 text-green-700', order: 9 },
    { value: WorkStatusValue.REJECTED, label: 'Rejected', color: 'bg-red-100 text-red-700', order: 10 },
    { value: WorkStatusValue.CANCELLED, label: 'Cancelled', color: 'bg-zinc-100 text-zinc-700', order: 11 },
    { value: WorkStatusValue.SKIPPED, label: 'Skipped', color: 'bg-gray-100 text-gray-700', order: 12 },
  ]

  for (const status of defaultStatuses) {
    await prisma.workStatus.upsert({
      where: { value: status.value },
      update: { label: status.label, color: status.color, order: status.order },
      create: status,
    })
  }
  console.log(`  ✓ ${defaultStatuses.length} Work statuses seeded`)

  // 5. Default Sequence Counters
  const currentFY = '2026'
  const defaultCounters = [
    { entityType: 'INVOICE', prefix: 'INV-2026', financialYear: currentFY, currentValue: 100 },
    { entityType: 'PURCHASE', prefix: 'PUR-2026', financialYear: currentFY, currentValue: 10 },
    { entityType: 'CUSTOMER', prefix: 'CUST', financialYear: currentFY, currentValue: 10 },
    { entityType: 'WORK_ORDER', prefix: 'WF', financialYear: currentFY, currentValue: 10020 },
    { entityType: 'PAYMENT', prefix: 'PAY-2026', financialYear: currentFY, currentValue: 10 },
    { entityType: 'EXCHANGE', prefix: 'EX-2026', financialYear: currentFY, currentValue: 5 },
    { entityType: 'RETURN', prefix: 'RET-2026', financialYear: currentFY, currentValue: 0 },
  ]

  for (const counter of defaultCounters) {
    await prisma.sequenceCounter.upsert({
      where: {
        entityType_financialYear_prefix: {
          entityType: counter.entityType,
          financialYear: counter.financialYear,
          prefix: counter.prefix,
        },
      },
      update: {},
      create: counter,
    })
  }
  console.log(`  ✓ ${defaultCounters.length} Sequence counters seeded`)

  // 6. Super Admin User
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@SSJ2026!'
  const passwordHash = await bcrypt.hash(adminPassword, 12)
  const isDefaultPassword = !process.env.ADMIN_INITIAL_PASSWORD

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: 'usr-admin',
      username: 'admin',
      name: 'Suresh Shah (Admin)',
      phone: '+91 98250 12345',
      email: 'admin@ssjewellery.in',
      role: 'ADMIN',
      passwordHash,
      active: true,
      mustChangePassword: isDefaultPassword,
    },
  })
  console.log(`  ✓ Super admin user created (${adminUser.username})`)

  console.log('🎉 Production bootstrap seed complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
