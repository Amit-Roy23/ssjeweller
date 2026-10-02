import 'dotenv/config'
import {
  PrismaClient,
  UserRole,
  MetalType,
  MaterialType,
  GoldStockStatus,
  StockItemType,
  PaymentMode,
  SaleStatus,
  PaymentStatus,
  PurchasePaymentStatus,
  ExchangeType,
  WorkPriority,
  WorkStatusValue,
  QCResult,
  NotificationType,
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

const now = new Date()
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000)
const daysAhead = (n: number) => new Date(now.getTime() + n * 86400000)
const hoursAgo = (n: number) => new Date(now.getTime() - n * 3600000)

async function main() {
  console.log('🌱 Starting comprehensive DEMO data seeding...')

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
  const purities = [
    { label: '24K', percentage: 99.9, metal: MetalType.GOLD, order: 1 },
    { label: '22K', percentage: 91.6, metal: MetalType.GOLD, order: 2 },
    { label: '18K', percentage: 75.0, metal: MetalType.GOLD, order: 3 },
    { label: '14K', percentage: 58.5, metal: MetalType.GOLD, order: 4 },
    { label: '925', percentage: 92.5, metal: MetalType.SILVER, order: 5 },
  ]
  for (const purity of purities) {
    await prisma.purity.upsert({
      where: { label: purity.label },
      update: { percentage: purity.percentage, metal: purity.metal, order: purity.order },
      create: purity,
    })
  }

  // 3. Default Categories
  const categories = [
    { name: 'Ring', order: 1 },
    { name: 'Necklace', order: 2 },
    { name: 'Bangle', order: 3 },
    { name: 'Chain', order: 4 },
    { name: 'Earrings', order: 5 },
    { name: 'Anklet', order: 6 },
    { name: 'Pendant', order: 7 },
    { name: 'Coins & Bars', order: 8 },
  ]
  const catMap: Record<string, string> = {}
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { name: cat.name },
      update: { order: cat.order },
      create: cat,
    })
    catMap[cat.name] = c.id
  }

  // 4. Default Work Statuses
  const workStatuses: Array<{ value: WorkStatusValue; label: string; color: string; order: number }> = [
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
  for (const st of workStatuses) {
    await prisma.workStatus.upsert({
      where: { value: st.value },
      update: { label: st.label, color: st.color, order: st.order },
      create: st,
    })
  }

  // 5. Sequence Counters
  const currentFY = '2026'
  const counters = [
    { entityType: 'INVOICE', prefix: 'INV-2026', financialYear: currentFY, currentValue: 125 },
    { entityType: 'PURCHASE', prefix: 'PUR-2026', financialYear: currentFY, currentValue: 18 },
    { entityType: 'CUSTOMER', prefix: 'CUST', financialYear: currentFY, currentValue: 5 },
    { entityType: 'WORK_ORDER', prefix: 'WF', financialYear: currentFY, currentValue: 10028 },
    { entityType: 'PAYMENT', prefix: 'PAY-2026', financialYear: currentFY, currentValue: 5 },
    { entityType: 'EXCHANGE', prefix: 'EX-2026', financialYear: currentFY, currentValue: 9 },
    { entityType: 'RETURN', prefix: 'RET-2026', financialYear: currentFY, currentValue: 1 },
  ]
  for (const counter of counters) {
    await prisma.sequenceCounter.upsert({
      where: {
        entityType_financialYear_prefix: {
          entityType: counter.entityType,
          financialYear: counter.financialYear,
          prefix: counter.prefix,
        },
      },
      update: { currentValue: counter.currentValue },
      create: counter,
    })
  }

  // 6. Users
  const defaultPassword = process.env.DEMO_USER_PASSWORD || process.env.PW_ADMIN || 'SecureInitialAuth@2026'
  const defaultHash = await bcrypt.hash(defaultPassword, 10)
  const users = [
    { id: 'usr-admin', username: 'admin', name: 'Suresh Shah (Admin)', phone: '+91 98250 12345', email: 'admin@ssjewellery.in', role: UserRole.ADMIN, passwordHash: defaultHash, active: true, createdAt: daysAgo(365), lastLogin: hoursAgo(2) },
    { id: 'usr-manager', username: 'manager', name: 'Priya Mehta (Manager)', phone: '+91 98250 77882', email: 'priya@ssjewellery.in', role: UserRole.MANAGER, passwordHash: defaultHash, active: true, createdAt: daysAgo(200), lastLogin: hoursAgo(1) },
    { id: 'usr-rahul', username: 'rahul', name: 'Rahul Kumar', phone: '+91 98240 11223', role: UserRole.STAFF, passwordHash: defaultHash, active: true, specialty: 'Gold Issue & Melting', createdAt: daysAgo(180), lastLogin: hoursAgo(5) },
    { id: 'usr-amit', username: 'amit', name: 'Amit Patel', phone: '+91 99240 22118', role: UserRole.STAFF, passwordHash: defaultHash, active: true, specialty: 'Shaping', createdAt: daysAgo(160), lastLogin: hoursAgo(3) },
    { id: 'usr-sumit', username: 'sumit', name: 'Sumit Verma', phone: '+91 98795 33456', role: UserRole.STAFF, passwordHash: defaultHash, active: true, specialty: 'Design & Cutting', createdAt: daysAgo(150), lastLogin: hoursAgo(8) },
    { id: 'usr-rakesh', username: 'rakesh', name: 'Rakesh Singh', phone: '+91 99750 88910', role: UserRole.STAFF, passwordHash: defaultHash, active: true, specialty: 'Polishing', createdAt: daysAgo(140), lastLogin: hoursAgo(24) },
    { id: 'usr-ankit', username: 'ankit', name: 'Ankit Jain', phone: '+91 98250 66554', role: UserRole.STAFF, passwordHash: defaultHash, active: true, specialty: 'Stone Setting', createdAt: daysAgo(120), lastLogin: hoursAgo(48) },
    { id: 'usr-inactive', username: 'vijay', name: 'Vijay Sharma', phone: '+91 99250 00099', role: UserRole.STAFF, passwordHash: defaultHash, active: false, specialty: 'Finishing', createdAt: daysAgo(90), lastLogin: daysAgo(30) },
  ]
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { name: u.name, phone: u.phone, email: u.email, role: u.role, active: u.active, specialty: u.specialty, lastLogin: u.lastLogin },
      create: u,
    })
  }
  console.log(`  ✓ ${users.length} Users seeded`)

  // 7. Suppliers
  const suppliers = [
    { id: 'sup-1', supplierCode: 'SUP-001', name: 'Royal Gold Suppliers', companyName: 'Royal Gold Pvt Ltd', phone: '+91 98250 11111', email: 'sales@royalgold.in', address: 'Manek Chowk, Surat', gstin: '24RGLD1234F1Z5', pan: 'RGLD1234F', openingBalancePaise: 0n, totalPurchasePaise: rupeesToPaise(1252000), totalPaidPaise: rupeesToPaise(1252000), createdAt: daysAgo(300) },
    { id: 'sup-2', supplierCode: 'SUP-002', name: 'Anand Bullion', companyName: 'Anand Bullion Traders', phone: '+91 99240 22222', email: 'anand@bullion.in', address: 'Bhagal, Surat', gstin: '24ANBD5678G1Z2', pan: 'ANBD5678G', openingBalancePaise: 0n, totalPurchasePaise: rupeesToPaise(314580), totalPaidPaise: rupeesToPaise(250000), createdAt: daysAgo(250) },
    { id: 'sup-3', supplierCode: 'SUP-003', name: 'Silver Mart', companyName: 'Silver Mart Co', phone: '+91 98795 33333', email: 'info@silvermart.in', address: 'Rander, Surat', gstin: '24SLVM9012H1Z9', pan: 'SLVM9012H', openingBalancePaise: 0n, totalPurchasePaise: rupeesToPaise(440000), totalPaidPaise: rupeesToPaise(440000), createdAt: daysAgo(200) },
    { id: 'sup-4', supplierCode: 'SUP-004', name: 'Brilliant Stones Co', companyName: 'Brilliant Stones International', phone: '+91 99750 44444', email: 'gems@brilliant.co', address: 'Mumbai', gstin: '27BRST3456I1Z6', pan: 'BRST3456I', openingBalancePaise: 0n, totalPurchasePaise: rupeesToPaise(1650000), totalPaidPaise: rupeesToPaise(1200000), createdAt: daysAgo(180) },
    { id: 'sup-5', supplierCode: 'SUP-005', name: 'Gem House', companyName: 'Gem House Ltd', phone: '+91 98250 55555', email: 'sales@gemhouse.in', address: 'Jaipur', gstin: '08GEMH7890J1Z3', pan: 'GEMH7890J', openingBalancePaise: 0n, totalPurchasePaise: rupeesToPaise(630000), totalPaidPaise: rupeesToPaise(500000), createdAt: daysAgo(150) },
  ]
  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { id: s.id },
      update: s,
      create: s,
    })
  }
  console.log(`  ✓ ${suppliers.length} Suppliers seeded`)

  // 8. Customers
  const customers = [
    { id: 'cus-1', customerId: 'CUST-001', name: 'Priya Patel', phone: '+91 98240 11223', email: 'priya.patel@example.com', address: 'B-204, Pinnacle Apartments, Adajan', city: 'Surat', pincode: '395009', pan: 'ABCPP1234K', dateOfBirth: new Date('1991-04-18'), anniversary: new Date('2016-12-02'), totalPurchasePaise: rupeesToPaise(482000), totalPaidPaise: rupeesToPaise(482000), totalDuePaise: 0n, totalBills: 4, createdAt: daysAgo(120) },
    { id: 'cus-2', customerId: 'CUST-002', name: 'Rajesh Mehta', phone: '+91 99250 44556', email: 'rajesh.mehta@example.com', address: '12, Sai Krupa Society, Varachha', city: 'Surat', pincode: '395006', pan: 'ABCRM1234M', totalPurchasePaise: rupeesToPaise(215000), totalPaidPaise: rupeesToPaise(215000), totalDuePaise: 0n, totalBills: 2, createdAt: daysAgo(95) },
    { id: 'cus-3', customerId: 'CUST-003', name: 'Anita Desai', phone: '+91 98795 78901', email: 'anita.desai@example.com', address: 'A-501, Rajhans Tower, Vesu', city: 'Surat', pincode: '395007', gstin: '24ANITD1234D1Z9', pan: 'ANITD1234D', totalPurchasePaise: rupeesToPaise(678000), totalPaidPaise: rupeesToPaise(678000), totalDuePaise: 0n, totalBills: 6, createdAt: daysAgo(80) },
    { id: 'cus-4', customerId: 'CUST-004', name: 'Mahesh Shah', phone: '+91 98250 77882', address: 'Shop 4, Ring Road, Near Railway Station', city: 'Surat', pincode: '395003', totalPurchasePaise: rupeesToPaise(152000), totalPaidPaise: rupeesToPaise(152000), totalDuePaise: 0n, totalBills: 1, createdAt: daysAgo(40) },
    { id: 'cus-5', customerId: 'CUST-005', name: 'Sneha Joshi', phone: '+91 99750 33110', email: 'sneha.joshi@example.com', address: '5, Tulsi Bungalows, Bhatha', city: 'Surat', pincode: '394510', dateOfBirth: new Date('1994-06-12'), totalPurchasePaise: rupeesToPaise(89000), totalPaidPaise: rupeesToPaise(40000), totalDuePaise: rupeesToPaise(49000), totalBills: 1, createdAt: daysAgo(15) },
  ]
  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: c,
      create: c,
    })
  }
  console.log(`  ✓ ${customers.length} Customers seeded`)

  // 9. Gold Stocks
  const goldStocks = [
    { id: 'gs-1', stockId: 'GB-001', materialType: MaterialType.GOLD_BAR, metal: MetalType.GOLD, purity: '22K', karat: '22K', grossWeightMg: gramsToMg(100), fineGoldWeightMg: gramsToMg(91.6), supplierId: 'sup-1', purchaseDate: daysAgo(30), purchaseRatePaisePerGram: rupeesToPaise(7100), purchaseValuePaise: rupeesToPaise(710000), currentLocation: 'Vault A', status: GoldStockStatus.AVAILABLE, referenceNumber: 'SUP-INV-001', createdAt: daysAgo(30) },
    { id: 'gs-2', stockId: 'GB-002', materialType: MaterialType.GOLD_BAR, metal: MetalType.GOLD, purity: '24K', karat: '24K', grossWeightMg: gramsToMg(50), fineGoldWeightMg: gramsToMg(49.95), supplierId: 'sup-1', purchaseDate: daysAgo(25), purchaseRatePaisePerGram: rupeesToPaise(7200), purchaseValuePaise: rupeesToPaise(360000), currentLocation: 'Vault A', status: GoldStockStatus.AVAILABLE, referenceNumber: 'SUP-INV-002', createdAt: daysAgo(25) },
    { id: 'gs-3', stockId: 'GS-001', materialType: MaterialType.GOLD_SCRAP, metal: MetalType.GOLD, purity: '22K', karat: '22K', grossWeightMg: gramsToMg(35.6), fineGoldWeightMg: gramsToMg(32.61), supplierId: 'sup-2', purchaseDate: daysAgo(10), purchaseRatePaisePerGram: rupeesToPaise(6800), purchaseValuePaise: rupeesToPaise(242080), currentLocation: 'Vault B', status: GoldStockStatus.AVAILABLE, referenceNumber: 'SUP-INV-003', createdAt: daysAgo(10) },
    { id: 'gs-4', stockId: 'GB-003', materialType: MaterialType.GOLD_BAR, metal: MetalType.GOLD, purity: '22K', karat: '22K', grossWeightMg: gramsToMg(25.5), fineGoldWeightMg: gramsToMg(23.36), supplierId: 'sup-1', purchaseDate: daysAgo(5), purchaseRatePaisePerGram: rupeesToPaise(7150), purchaseValuePaise: rupeesToPaise(182075), currentLocation: 'Production Floor', status: GoldStockStatus.IN_PRODUCTION, referenceNumber: 'WF-10025', createdAt: daysAgo(5) },
    { id: 'gs-5', stockId: 'GC-001', materialType: MaterialType.GOLD_COIN, metal: MetalType.GOLD, purity: '24K', karat: '24K', grossWeightMg: gramsToMg(10), fineGoldWeightMg: gramsToMg(9.99), supplierId: 'sup-2', purchaseDate: daysAgo(3), purchaseRatePaisePerGram: rupeesToPaise(7250), purchaseValuePaise: rupeesToPaise(72500), currentLocation: 'Display Counter', status: GoldStockStatus.AVAILABLE, referenceNumber: 'SUP-INV-004', createdAt: daysAgo(3) },
    { id: 'gs-6', stockId: 'SV-001', materialType: MaterialType.SILVER, metal: MetalType.SILVER, purity: '925', karat: '925', grossWeightMg: gramsToMg(5000), fineGoldWeightMg: gramsToMg(4625), supplierId: 'sup-3', purchaseDate: daysAgo(15), purchaseRatePaisePerGram: rupeesToPaise(88), purchaseValuePaise: rupeesToPaise(440000), currentLocation: 'Vault B', status: GoldStockStatus.AVAILABLE, referenceNumber: 'SUP-INV-005', createdAt: daysAgo(15) },
    { id: 'gs-7', stockId: 'GB-004', materialType: MaterialType.GOLD_BAR, metal: MetalType.GOLD, purity: '18K', karat: '18K', grossWeightMg: gramsToMg(6.5), fineGoldWeightMg: gramsToMg(4.88), supplierId: 'sup-1', purchaseDate: daysAgo(2), purchaseRatePaisePerGram: rupeesToPaise(5400), purchaseValuePaise: rupeesToPaise(35100), currentLocation: 'Production Floor', status: GoldStockStatus.IN_PRODUCTION, referenceNumber: 'WF-10027', createdAt: daysAgo(2) },
  ]
  for (const gs of goldStocks) {
    await prisma.goldStock.upsert({
      where: { id: gs.id },
      update: gs,
      create: gs,
    })
  }
  console.log(`  ✓ ${goldStocks.length} Gold stocks seeded`)

  // 10. Stone Items
  const stones = [
    { id: 'st-1', stoneId: 'DM-001', type: 'Diamond', shape: 'Round', size: '0.3ct', quantity: 50, weightCarats: 15, unit: 'carat', purchaseCostPaise: rupeesToPaise(750000), supplierId: 'sup-4', usedQuantity: 12, remainingQuantity: 38, createdAt: daysAgo(60) },
    { id: 'st-2', stoneId: 'DM-002', type: 'Diamond', shape: 'Princess', size: '0.5ct', quantity: 30, weightCarats: 15, unit: 'carat', purchaseCostPaise: rupeesToPaise(900000), supplierId: 'sup-4', usedQuantity: 5, remainingQuantity: 25, createdAt: daysAgo(45) },
    { id: 'st-3', stoneId: 'RB-001', type: 'Ruby', shape: 'Oval', size: '4x6mm', quantity: 40, weightCarats: 20, unit: 'carat', purchaseCostPaise: rupeesToPaise(200000), supplierId: 'sup-5', usedQuantity: 8, remainingQuantity: 32, createdAt: daysAgo(40) },
    { id: 'st-4', stoneId: 'EM-001', type: 'Emerald', shape: 'Oval', size: '5x7mm', quantity: 25, weightCarats: 18, unit: 'carat', purchaseCostPaise: rupeesToPaise(280000), supplierId: 'sup-5', usedQuantity: 3, remainingQuantity: 22, createdAt: daysAgo(35) },
    { id: 'st-5', stoneId: 'SP-001', type: 'Sapphire', shape: 'Round', size: '3mm', quantity: 60, weightCarats: 12, unit: 'carat', purchaseCostPaise: rupeesToPaise(150000), supplierId: 'sup-5', usedQuantity: 10, remainingQuantity: 50, createdAt: daysAgo(25) },
  ]
  for (const st of stones) {
    await prisma.stoneItem.upsert({
      where: { id: st.id },
      update: st,
      create: st,
    })
  }
  console.log(`  ✓ ${stones.length} Stone items seeded`)

  // 11. Finished Products
  const products = [
    { id: 'prd-1', productCode: 'SJ-RING-001', barcode: '8901234500011', name: 'Antique Temple Ring', categoryId: catMap['Ring'], metal: MetalType.GOLD, purity: '22K', grossWeightMg: gramsToMg(8.5), netWeightMg: gramsToMg(8.2), stoneWeightMg: gramsToMg(0.3), wastageMg: gramsToMg(0.3), makingChargePaise: rupeesToPaise(12000), otherChargesPaise: 0n, gstRateBps: percentToBps(3), sellingPricePaise: rupeesToPaise(68500), costPricePaise: rupeesToPaise(58000), stock: 3, hsnCode: '7113', imageColor: 'from-amber-400 to-yellow-600', createdAt: daysAgo(20) },
    { id: 'prd-2', productCode: 'SJ-NEC-001', barcode: '8901234500028', name: 'Antique Temple Necklace', categoryId: catMap['Necklace'], metal: MetalType.GOLD, purity: '22K', grossWeightMg: gramsToMg(48.5), netWeightMg: gramsToMg(46.2), stoneWeightMg: gramsToMg(2.3), wastageMg: gramsToMg(2.3), makingChargePaise: rupeesToPaise(65000), otherChargesPaise: rupeesToPaise(5000), gstRateBps: percentToBps(3), sellingPricePaise: rupeesToPaise(405000), costPricePaise: rupeesToPaise(345000), stock: 1, hsnCode: '7113', imageColor: 'from-yellow-500 to-amber-700', createdAt: daysAgo(18) },
    { id: 'prd-3', productCode: 'SJ-BAN-001', barcode: '8901234500035', name: 'Kundan Bridal Bangles (Pair)', categoryId: catMap['Bangle'], metal: MetalType.GOLD, purity: '22K', grossWeightMg: gramsToMg(62.8), netWeightMg: gramsToMg(58.4), stoneWeightMg: gramsToMg(4.4), wastageMg: gramsToMg(4.4), makingChargePaise: rupeesToPaise(85000), otherChargesPaise: rupeesToPaise(8000), gstRateBps: percentToBps(3), sellingPricePaise: rupeesToPaise(525000), costPricePaise: rupeesToPaise(445000), stock: 1, hsnCode: '7113', imageColor: 'from-yellow-500 to-amber-700', createdAt: daysAgo(15) },
    { id: 'prd-4', productCode: 'SJ-CHN-001', barcode: '8901234500042', name: 'Daily Wear Gold Chain (24 inch)', categoryId: catMap['Chain'], metal: MetalType.GOLD, purity: '22K', grossWeightMg: gramsToMg(18.4), netWeightMg: gramsToMg(18.4), stoneWeightMg: 0n, wastageMg: gramsToMg(0.6), makingChargePaise: rupeesToPaise(7000), otherChargesPaise: 0n, gstRateBps: percentToBps(3), sellingPricePaise: rupeesToPaise(145000), costPricePaise: rupeesToPaise(128000), stock: 5, hsnCode: '7113', imageColor: 'from-amber-300 to-yellow-500', createdAt: daysAgo(12) },
    { id: 'prd-5', productCode: 'SJ-ER-001', barcode: '8901234500059', name: 'Pearl Drop Earrings', categoryId: catMap['Earrings'], metal: MetalType.GOLD, purity: '18K', grossWeightMg: gramsToMg(6.2), netWeightMg: gramsToMg(5.8), stoneWeightMg: gramsToMg(0.4), wastageMg: gramsToMg(0.4), makingChargePaise: rupeesToPaise(6500), otherChargesPaise: 0n, gstRateBps: percentToBps(3), sellingPricePaise: rupeesToPaise(42500), costPricePaise: rupeesToPaise(34500), stock: 4, hsnCode: '7113', imageColor: 'from-rose-300 to-pink-500', createdAt: daysAgo(10) },
    { id: 'prd-6', productCode: 'SJ-AK-001', barcode: '8901234500066', name: 'Silver Anklet Pair', categoryId: catMap['Anklet'], metal: MetalType.SILVER, purity: '925', grossWeightMg: gramsToMg(84), netWeightMg: gramsToMg(84), stoneWeightMg: 0n, wastageMg: gramsToMg(2), makingChargePaise: rupeesToPaise(2100), otherChargesPaise: 0n, gstRateBps: percentToBps(3), sellingPricePaise: rupeesToPaise(9600), costPricePaise: rupeesToPaise(7900), stock: 12, hsnCode: '7113', imageColor: 'from-slate-300 to-slate-500', createdAt: daysAgo(8) },
    { id: 'prd-7', productCode: 'SJ-PD-001', barcode: '8901234500073', name: 'Rose Gold Pendant', categoryId: catMap['Pendant'], metal: MetalType.GOLD, purity: '18K', grossWeightMg: gramsToMg(3.8), netWeightMg: gramsToMg(3.5), stoneWeightMg: gramsToMg(0.3), wastageMg: gramsToMg(0.3), makingChargePaise: rupeesToPaise(5000), otherChargesPaise: 0n, gstRateBps: percentToBps(3), sellingPricePaise: rupeesToPaise(27800), costPricePaise: rupeesToPaise(21500), stock: 6, hsnCode: '7113', imageColor: 'from-rose-300 to-amber-500', createdAt: daysAgo(6) },
    { id: 'prd-8', productCode: 'SJ-CN-001', barcode: '8901234500080', name: 'Lakshmi Coin 10g', categoryId: catMap['Coins & Bars'], metal: MetalType.GOLD, purity: '24K', grossWeightMg: gramsToMg(10), netWeightMg: gramsToMg(10), stoneWeightMg: 0n, wastageMg: 0n, makingChargePaise: rupeesToPaise(800), otherChargesPaise: 0n, gstRateBps: percentToBps(3), sellingPricePaise: rupeesToPaise(74500), costPricePaise: rupeesToPaise(73300), stock: 20, hsnCode: '7108', imageColor: 'from-yellow-400 to-amber-600', createdAt: daysAgo(5) },
  ]
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    })
  }
  console.log(`  ✓ ${products.length} Products seeded`)

  // 12. Workflows & Steps
  const workflows = [
    {
      id: 'wf-ring',
      code: 'wf-ring',
      name: 'Gold Ring Production',
      description: 'Standard workflow for gold ring manufacturing',
      active: true,
      createdAt: daysAgo(90),
      steps: [
        { name: 'Gold Issue', description: 'Issue gold to karigar', defaultUserId: 'usr-rahul', estimatedHours: 2, order: 0 },
        { name: 'Melting', description: 'Melt gold bar', defaultUserId: 'usr-rahul', estimatedHours: 4, order: 1 },
        { name: 'Shaping', description: 'Shape the ring', defaultUserId: 'usr-amit', estimatedHours: 8, order: 2 },
        { name: 'Design & Cutting', description: 'Add design details', defaultUserId: 'usr-sumit', estimatedHours: 6, order: 3 },
        { name: 'Polishing', description: 'Polish the ring', defaultUserId: 'usr-rakesh', estimatedHours: 4, order: 4 },
        { name: 'Stone Setting', description: 'Set stones if needed', defaultUserId: 'usr-ankit', estimatedHours: 6, order: 5 },
        { name: 'Finishing', description: 'Final finishing touches', defaultUserId: 'usr-rahul', estimatedHours: 3, order: 6 },
        { name: 'Quality Check', description: 'QC by admin', defaultUserId: 'usr-admin', estimatedHours: 1, order: 7 },
      ],
    },
    {
      id: 'wf-necklace',
      code: 'wf-necklace',
      name: 'Necklace Production',
      description: 'Standard workflow for necklace manufacturing',
      active: true,
      createdAt: daysAgo(85),
      steps: [
        { name: 'Gold Issue', defaultUserId: 'usr-rahul', estimatedHours: 2, order: 0 },
        { name: 'Melting', defaultUserId: 'usr-rahul', estimatedHours: 4, order: 1 },
        { name: 'Shaping', defaultUserId: 'usr-amit', estimatedHours: 12, order: 2 },
        { name: 'Design & Cutting', defaultUserId: 'usr-sumit', estimatedHours: 10, order: 3 },
        { name: 'Polishing', defaultUserId: 'usr-rakesh', estimatedHours: 6, order: 4 },
        { name: 'Stone Setting', defaultUserId: 'usr-ankit', estimatedHours: 8, order: 5 },
        { name: 'Finishing', defaultUserId: 'usr-rahul', estimatedHours: 4, order: 6 },
        { name: 'Quality Check', defaultUserId: 'usr-admin', estimatedHours: 1, order: 7 },
      ],
    },
    {
      id: 'wf-bangle',
      code: 'wf-bangle',
      name: 'Bangle Production',
      description: 'Standard workflow for bangle manufacturing',
      active: true,
      createdAt: daysAgo(80),
      steps: [
        { name: 'Gold Issue', defaultUserId: 'usr-rahul', estimatedHours: 2, order: 0 },
        { name: 'Melting', defaultUserId: 'usr-rahul', estimatedHours: 4, order: 1 },
        { name: 'Shaping', defaultUserId: 'usr-amit', estimatedHours: 10, order: 2 },
        { name: 'Design & Cutting', defaultUserId: 'usr-sumit', estimatedHours: 8, order: 3 },
        { name: 'Polishing', defaultUserId: 'usr-rakesh', estimatedHours: 5, order: 4 },
        { name: 'Finishing', defaultUserId: 'usr-rahul', estimatedHours: 3, order: 5 },
        { name: 'Quality Check', defaultUserId: 'usr-admin', estimatedHours: 1, order: 6 },
      ],
    },
  ]

  for (const wf of workflows) {
    const { steps, ...wfData } = wf
    await prisma.workflow.upsert({
      where: { code: wfData.code },
      update: wfData,
      create: wfData,
    })

    // Remove old steps & recreate
    await prisma.workflowStep.deleteMany({ where: { workflowId: wf.id } })
    for (const step of steps) {
      await prisma.workflowStep.create({
        data: {
          ...step,
          workflowId: wf.id,
        },
      })
    }
  }
  console.log(`  ✓ ${workflows.length} Workflows seeded`)

  // 13. Purchases
  const purchases = [
    {
      id: 'pur-1',
      purchaseId: 'PUR-2026-0001',
      supplierId: 'sup-1',
      supplierName: 'Royal Gold Suppliers',
      invoiceNumber: 'SUP-INV-001',
      purchaseDate: daysAgo(30),
      subtotalPaise: rupeesToPaise(710000),
      totalTaxPaise: 0n,
      grandTotalPaise: rupeesToPaise(710000),
      paidAmountPaise: rupeesToPaise(710000),
      paymentStatus: PurchasePaymentStatus.PAID,
      performedById: 'usr-admin',
      createdAt: daysAgo(30),
      items: [
        { materialType: MaterialType.GOLD_BAR, description: 'Gold Bar 100g 22K', purity: '22K', grossWeightMg: gramsToMg(100), netWeightMg: gramsToMg(100), ratePaisePerGram: rupeesToPaise(7100), totalPaise: rupeesToPaise(710000) },
      ],
    },
    {
      id: 'pur-2',
      purchaseId: 'PUR-2026-0002',
      supplierId: 'sup-1',
      supplierName: 'Royal Gold Suppliers',
      invoiceNumber: 'SUP-INV-002',
      purchaseDate: daysAgo(25),
      subtotalPaise: rupeesToPaise(360000),
      totalTaxPaise: 0n,
      grandTotalPaise: rupeesToPaise(360000),
      paidAmountPaise: rupeesToPaise(360000),
      paymentStatus: PurchasePaymentStatus.PAID,
      performedById: 'usr-admin',
      createdAt: daysAgo(25),
      items: [
        { materialType: MaterialType.GOLD_BAR, description: 'Gold Bar 50g 24K', purity: '24K', grossWeightMg: gramsToMg(50), netWeightMg: gramsToMg(50), ratePaisePerGram: rupeesToPaise(7200), totalPaise: rupeesToPaise(360000) },
      ],
    },
    {
      id: 'pur-3',
      purchaseId: 'PUR-2026-0003',
      supplierId: 'sup-2',
      supplierName: 'Anand Bullion',
      invoiceNumber: 'SUP-INV-003',
      purchaseDate: daysAgo(10),
      subtotalPaise: rupeesToPaise(242080),
      totalTaxPaise: 0n,
      grandTotalPaise: rupeesToPaise(242080),
      paidAmountPaise: rupeesToPaise(150000),
      paymentStatus: PurchasePaymentStatus.PARTIAL,
      performedById: 'usr-admin',
      createdAt: daysAgo(10),
      items: [
        { materialType: MaterialType.GOLD_SCRAP, description: 'Gold Scrap 22K', purity: '22K', grossWeightMg: gramsToMg(35.6), netWeightMg: gramsToMg(32.6), ratePaisePerGram: rupeesToPaise(6800), totalPaise: rupeesToPaise(242080) },
      ],
    },
    {
      id: 'pur-4',
      purchaseId: 'PUR-2026-0004',
      supplierId: 'sup-4',
      supplierName: 'Brilliant Stones Co',
      invoiceNumber: 'SUP-INV-006',
      purchaseDate: daysAgo(7),
      subtotalPaise: rupeesToPaise(750000),
      totalTaxPaise: 0n,
      grandTotalPaise: rupeesToPaise(750000),
      paidAmountPaise: rupeesToPaise(500000),
      paymentStatus: PurchasePaymentStatus.PARTIAL,
      performedById: 'usr-admin',
      createdAt: daysAgo(7),
      items: [
        { materialType: MaterialType.DIAMOND, description: 'Round Diamonds 0.3ct x50', purity: 'NA', grossWeightMg: gramsToMg(15), netWeightMg: gramsToMg(15), ratePaisePerGram: rupeesToPaise(50000), totalPaise: rupeesToPaise(750000) },
      ],
    },
    {
      id: 'pur-5',
      purchaseId: 'PUR-2026-0005',
      supplierId: 'sup-1',
      supplierName: 'Royal Gold Suppliers',
      invoiceNumber: 'SUP-INV-007',
      purchaseDate: daysAgo(2),
      subtotalPaise: rupeesToPaise(35100),
      totalTaxPaise: 0n,
      grandTotalPaise: rupeesToPaise(35100),
      paidAmountPaise: rupeesToPaise(35100),
      paymentStatus: PurchasePaymentStatus.PAID,
      performedById: 'usr-admin',
      createdAt: daysAgo(2),
      items: [
        { materialType: MaterialType.GOLD_BAR, description: 'Gold Bar 6.5g 18K', purity: '18K', grossWeightMg: gramsToMg(6.5), netWeightMg: gramsToMg(6.5), ratePaisePerGram: rupeesToPaise(5400), totalPaise: rupeesToPaise(35100) },
      ],
    },
  ]

  for (const pur of purchases) {
    const { items, ...purData } = pur
    await prisma.purchase.upsert({
      where: { id: purData.id },
      update: purData,
      create: purData,
    })

    await prisma.purchaseItem.deleteMany({ where: { purchaseId: pur.id } })
    for (const item of items) {
      await prisma.purchaseItem.create({
        data: {
          ...item,
          purchaseId: pur.id,
        },
      })
    }
  }
  console.log(`  ✓ ${purchases.length} Purchases seeded`)

  // 14. Sales & Sale Items
  const sales = [
    {
      id: 'sale-1',
      invoiceNo: 'INV-2026-00121',
      customerId: 'cus-1',
      customerName: 'Priya Patel',
      customerPhone: '+91 98240 11223',
      customerAddress: 'B-204, Pinnacle Apartments, Adajan, Surat - 395009',
      subtotalPaise: rupeesToPaise(42500),
      totalMakingPaise: rupeesToPaise(6500),
      totalStonePaise: rupeesToPaise(8500),
      totalOtherPaise: 0n,
      totalDiscountPaise: rupeesToPaise(500),
      totalGstPaise: rupeesToPaise(1260),
      grandTotalPaise: rupeesToPaise(43260),
      paidAmountPaise: rupeesToPaise(43260),
      dueAmountPaise: 0n,
      paymentMode: PaymentMode.UPI,
      paymentRef: 'UPI/9824011223/00121',
      status: SaleStatus.PAID,
      branch: 'Main Branch',
      billedById: 'usr-admin',
      createdAt: daysAgo(15),
      items: [
        {
          productId: 'prd-5',
          productCode: 'SJ-ER-001',
          name: 'Pearl Drop Earrings',
          hsn: '7113',
          metal: MetalType.GOLD,
          purity: '18K',
          grossWeightMg: gramsToMg(6.2),
          netWeightMg: gramsToMg(5.8),
          stoneWeightMg: gramsToMg(0.4),
          ratePaisePerGram: rupeesToPaise(36000),
          makingAmountPaise: rupeesToPaise(6500),
          stoneAmountPaise: rupeesToPaise(8500),
          subtotalPaise: rupeesToPaise(42500),
          discountPaise: rupeesToPaise(500),
          gstRateBps: percentToBps(3),
          gstAmountPaise: rupeesToPaise(1260),
          totalPaise: rupeesToPaise(43260),
          quantity: 1,
        },
      ],
    },
    {
      id: 'sale-2',
      invoiceNo: 'INV-2026-00122',
      customerId: 'cus-2',
      customerName: 'Rajesh Mehta',
      customerPhone: '+91 99250 44556',
      subtotalPaise: rupeesToPaise(145000),
      totalMakingPaise: rupeesToPaise(7000),
      totalStonePaise: 0n,
      totalOtherPaise: 0n,
      totalDiscountPaise: 0n,
      totalGstPaise: rupeesToPaise(4350),
      grandTotalPaise: rupeesToPaise(149350),
      paidAmountPaise: rupeesToPaise(149350),
      dueAmountPaise: 0n,
      paymentMode: PaymentMode.CARD,
      paymentRef: 'CARD/HDFC/****4421',
      status: SaleStatus.PAID,
      oldGoldAdjustmentPaise: rupeesToPaise(35000),
      branch: 'Main Branch',
      billedById: 'usr-admin',
      createdAt: daysAgo(11),
      items: [
        {
          productId: 'prd-4',
          productCode: 'SJ-CHN-001',
          name: 'Daily Wear Gold Chain (24 inch)',
          hsn: '7113',
          metal: MetalType.GOLD,
          purity: '22K',
          grossWeightMg: gramsToMg(18.4),
          netWeightMg: gramsToMg(18.4),
          stoneWeightMg: 0n,
          ratePaisePerGram: rupeesToPaise(138000),
          makingAmountPaise: rupeesToPaise(7000),
          stoneAmountPaise: 0n,
          subtotalPaise: rupeesToPaise(145000),
          discountPaise: 0n,
          gstRateBps: percentToBps(3),
          gstAmountPaise: rupeesToPaise(4350),
          totalPaise: rupeesToPaise(149350),
          quantity: 1,
        },
      ],
    },
    {
      id: 'sale-3',
      invoiceNo: 'INV-2026-00123',
      customerId: 'cus-3',
      customerName: 'Anita Desai',
      customerPhone: '+91 98795 78901',
      customerGstin: '24ANITD1234D1Z9',
      subtotalPaise: rupeesToPaise(405000),
      totalMakingPaise: rupeesToPaise(65000),
      totalStonePaise: rupeesToPaise(18000),
      totalOtherPaise: rupeesToPaise(5000),
      totalDiscountPaise: rupeesToPaise(5000),
      totalGstPaise: rupeesToPaise(12000),
      grandTotalPaise: rupeesToPaise(412000),
      paidAmountPaise: rupeesToPaise(412000),
      dueAmountPaise: 0n,
      paymentMode: PaymentMode.BANK,
      paymentRef: 'NEFT/HDFC0001234',
      status: SaleStatus.PAID,
      branch: 'Main Branch',
      billedById: 'usr-admin',
      createdAt: daysAgo(7),
      items: [
        {
          productId: 'prd-2',
          productCode: 'SJ-NEC-001',
          name: 'Antique Temple Necklace',
          hsn: '7113',
          metal: MetalType.GOLD,
          purity: '22K',
          grossWeightMg: gramsToMg(48.5),
          netWeightMg: gramsToMg(46.2),
          stoneWeightMg: gramsToMg(2.3),
          ratePaisePerGram: rupeesToPaise(335000),
          makingAmountPaise: rupeesToPaise(65000),
          stoneAmountPaise: rupeesToPaise(18000),
          otherChargesPaise: rupeesToPaise(5000),
          subtotalPaise: rupeesToPaise(405000),
          discountPaise: rupeesToPaise(5000),
          gstRateBps: percentToBps(3),
          gstAmountPaise: rupeesToPaise(12000),
          totalPaise: rupeesToPaise(412000),
          quantity: 1,
        },
      ],
    },
    {
      id: 'sale-4',
      invoiceNo: 'INV-2026-00124',
      customerId: 'cus-4',
      customerName: 'Mahesh Shah',
      customerPhone: '+91 98250 77882',
      subtotalPaise: rupeesToPaise(9600),
      totalMakingPaise: rupeesToPaise(2100),
      totalStonePaise: 0n,
      totalOtherPaise: 0n,
      totalDiscountPaise: rupeesToPaise(100),
      totalGstPaise: rupeesToPaise(285),
      grandTotalPaise: rupeesToPaise(9785),
      paidAmountPaise: rupeesToPaise(9785),
      dueAmountPaise: 0n,
      paymentMode: PaymentMode.CASH,
      status: SaleStatus.PAID,
      branch: 'Main Branch',
      billedById: 'usr-admin',
      createdAt: daysAgo(4),
      items: [
        {
          productId: 'prd-6',
          productCode: 'SJ-AK-001',
          name: 'Silver Anklet Pair',
          hsn: '7113',
          metal: MetalType.SILVER,
          purity: '925',
          grossWeightMg: gramsToMg(84),
          netWeightMg: gramsToMg(84),
          stoneWeightMg: 0n,
          ratePaisePerGram: rupeesToPaise(7500),
          makingAmountPaise: rupeesToPaise(2100),
          stoneAmountPaise: 0n,
          subtotalPaise: rupeesToPaise(9600),
          discountPaise: rupeesToPaise(100),
          gstRateBps: percentToBps(3),
          gstAmountPaise: rupeesToPaise(285),
          totalPaise: rupeesToPaise(9785),
          quantity: 1,
        },
      ],
    },
    {
      id: 'sale-5',
      invoiceNo: 'INV-2026-00125',
      customerId: 'cus-5',
      customerName: 'Sneha Joshi',
      customerPhone: '+91 99750 33110',
      subtotalPaise: rupeesToPaise(74500),
      totalMakingPaise: rupeesToPaise(800),
      totalStonePaise: 0n,
      totalOtherPaise: 0n,
      totalDiscountPaise: 0n,
      totalGstPaise: rupeesToPaise(2235),
      grandTotalPaise: rupeesToPaise(76735),
      paidAmountPaise: rupeesToPaise(40000),
      dueAmountPaise: rupeesToPaise(36735),
      paymentMode: PaymentMode.UPI,
      paymentRef: 'UPI/9975033110/00125',
      status: SaleStatus.PARTIAL,
      branch: 'Main Branch',
      billedById: 'usr-admin',
      createdAt: daysAgo(2),
      items: [
        {
          productId: 'prd-8',
          productCode: 'SJ-CN-001',
          name: 'Lakshmi Coin 10g',
          hsn: '7108',
          metal: MetalType.GOLD,
          purity: '24K',
          grossWeightMg: gramsToMg(10),
          netWeightMg: gramsToMg(10),
          stoneWeightMg: 0n,
          ratePaisePerGram: rupeesToPaise(73700),
          makingAmountPaise: rupeesToPaise(800),
          stoneAmountPaise: 0n,
          subtotalPaise: rupeesToPaise(74500),
          discountPaise: 0n,
          gstRateBps: percentToBps(3),
          gstAmountPaise: rupeesToPaise(2235),
          totalPaise: rupeesToPaise(76735),
          quantity: 1,
        },
      ],
    },
  ]

  for (const sale of sales) {
    const { items, ...saleData } = sale
    await prisma.sale.upsert({
      where: { id: saleData.id },
      update: saleData,
      create: saleData,
    })

    await prisma.saleItem.deleteMany({ where: { saleId: sale.id } })
    for (const item of items) {
      await prisma.saleItem.create({
        data: {
          ...item,
          saleId: sale.id,
        },
      })
    }
  }
  console.log(`  ✓ ${sales.length} Sales invoices seeded`)

  // 15. Payments
  const payments = [
    { id: 'pay-1', paymentId: 'PAY-2026-0001', saleId: 'sale-1', invoiceNo: 'INV-2026-00121', customerId: 'cus-1', customerName: 'Priya Patel', amountPaise: rupeesToPaise(43260), paymentMode: PaymentMode.UPI, transactionId: 'UPI/9824011223/00121', status: PaymentStatus.COMPLETED, receivedById: 'usr-admin', date: daysAgo(15), createdAt: daysAgo(15) },
    { id: 'pay-2', paymentId: 'PAY-2026-0002', saleId: 'sale-2', invoiceNo: 'INV-2026-00122', customerId: 'cus-2', customerName: 'Rajesh Mehta', amountPaise: rupeesToPaise(149350), paymentMode: PaymentMode.CARD, transactionId: 'CARD/HDFC/****4421', status: PaymentStatus.COMPLETED, receivedById: 'usr-admin', date: daysAgo(11), createdAt: daysAgo(11) },
    { id: 'pay-3', paymentId: 'PAY-2026-0003', saleId: 'sale-3', invoiceNo: 'INV-2026-00123', customerId: 'cus-3', customerName: 'Anita Desai', amountPaise: rupeesToPaise(412000), paymentMode: PaymentMode.BANK, transactionId: 'NEFT/HDFC0001234', status: PaymentStatus.COMPLETED, receivedById: 'usr-admin', date: daysAgo(7), createdAt: daysAgo(7) },
    { id: 'pay-4', paymentId: 'PAY-2026-0004', saleId: 'sale-4', invoiceNo: 'INV-2026-00124', customerId: 'cus-4', customerName: 'Mahesh Shah', amountPaise: rupeesToPaise(9785), paymentMode: PaymentMode.CASH, status: PaymentStatus.COMPLETED, receivedById: 'usr-admin', date: daysAgo(4), createdAt: daysAgo(4) },
    { id: 'pay-5', paymentId: 'PAY-2026-0005', saleId: 'sale-5', invoiceNo: 'INV-2026-00125', customerId: 'cus-5', customerName: 'Sneha Joshi', amountPaise: rupeesToPaise(40000), paymentMode: PaymentMode.UPI, transactionId: 'UPI/9975033110/00125', status: PaymentStatus.COMPLETED, receivedById: 'usr-admin', date: daysAgo(2), createdAt: daysAgo(2) },
  ]
  for (const pay of payments) {
    await prisma.payment.upsert({
      where: { id: pay.id },
      update: pay,
      create: pay,
    })
  }
  console.log(`  ✓ ${payments.length} Payments seeded`)

  // 16. Exchanges & Returns
  const exchanges = [
    { id: 'ex-1', voucherNo: 'EX-2026-0008', customerName: 'Rajesh Mehta', customerPhone: '+91 99250 44556', type: ExchangeType.EXCHANGE, itemDescription: 'Old gold chain, broken, 22K', grossWeightMg: gramsToMg(12.4), netWeightMg: gramsToMg(11.8), karat: '22K', touchBps: percentToBps(91.6), ratePaisePerGram: rupeesToPaise(6680), totalValuePaise: rupeesToPaise(35000), adjustedAgainstSaleId: 'sale-2', adjustedAgainstInvoice: 'INV-2026-00122', paidAmountPaise: 0n, status: RecordStatus.ACTIVE, date: daysAgo(11), createdAt: daysAgo(11) },
    { id: 'ex-2', voucherNo: 'EX-2026-0009', customerName: 'Walk-in Seller', customerPhone: '+91 98250 00099', type: ExchangeType.BUY, itemDescription: 'Scrap gold, assorted old bangles', grossWeightMg: gramsToMg(35.6), netWeightMg: gramsToMg(33.2), karat: '22K', touchBps: percentToBps(88), ratePaisePerGram: rupeesToPaise(6380), totalValuePaise: rupeesToPaise(92416), paidAmountPaise: rupeesToPaise(92416), status: RecordStatus.ACTIVE, date: daysAgo(3), createdAt: daysAgo(3) },
  ]
  for (const ex of exchanges) {
    await prisma.oldGoldExchange.upsert({
      where: { id: ex.id },
      update: ex,
      create: ex,
    })
  }

  await prisma.salesReturn.upsert({
    where: { id: 'ret-1' },
    update: {},
    create: {
      id: 'ret-1',
      returnId: 'RET-2026-0001',
      originalInvoiceNo: 'INV-2026-00121',
      saleId: 'sale-1',
      customerName: 'Kamlesh Shah',
      productName: 'Gold Ring (old design)',
      returnQuantity: 1,
      returnWeightMg: gramsToMg(8.2),
      reason: 'Design not as expected',
      refundAmountPaise: rupeesToPaise(45000),
      exchangeAmountPaise: 0n,
      restockingStatus: RestockingStatus.DONE,
      status: RecordStatus.ACTIVE,
      date: daysAgo(20),
      createdAt: daysAgo(20),
    },
  })
  console.log('  ✓ Exchanges and Returns seeded')

  // 16b. Production Workflows
  const demoWorkflows = [
    {
      id: 'wf-ring',
      code: 'wf-ring',
      name: 'Gold Ring Production',
      description: 'Standard 4-step production flow for plain and studded gold rings',
      steps: [
        { name: 'Gold Melting & Ingot Casting', defaultUserId: 'usr-rahul', estimatedHours: 2, order: 0 },
        { name: 'Die Shaping & Band Sizing', defaultUserId: 'usr-amit', estimatedHours: 4, order: 1 },
        { name: 'Filing, Jointing & Soldering', defaultUserId: 'usr-sumit', estimatedHours: 3, order: 2 },
        { name: 'Buffing & High Luster Polishing', defaultUserId: 'usr-rakesh', estimatedHours: 2, order: 3 },
      ],
    },
    {
      id: 'wf-necklace',
      code: 'wf-necklace',
      name: 'Necklace Production',
      description: '5-step delicate chain linking and heavy necklace assembly flow',
      steps: [
        { name: 'Wire Drawing & Link Weaving', defaultUserId: 'usr-rahul', estimatedHours: 6, order: 0 },
        { name: 'Clasp / S-Hook Joint Soldering', defaultUserId: 'usr-amit', estimatedHours: 4, order: 1 },
        { name: 'Centerpiece / Stone Attachment', defaultUserId: 'usr-ankit', estimatedHours: 5, order: 2 },
        { name: 'Ultrasonic Bath & Steam Cleaning', defaultUserId: 'usr-rakesh', estimatedHours: 2, order: 3 },
        { name: 'Hallmarking & Dimensional QC', defaultUserId: 'usr-admin', estimatedHours: 1, order: 4 },
      ],
    },
    {
      id: 'wf-bangle',
      code: 'wf-bangle',
      name: 'Bangle Production',
      description: '4-step heavy jewellery production for bangles, kadas, and bracelets',
      steps: [
        { name: 'Continuous Strip / Rod Casting', defaultUserId: 'usr-rahul', estimatedHours: 4, order: 0 },
        { name: 'Mandrel Rolling & Lock Jointing', defaultUserId: 'usr-amit', estimatedHours: 5, order: 1 },
        { name: 'Hand Chasing & CNC Faceting', defaultUserId: 'usr-sumit', estimatedHours: 6, order: 2 },
        { name: 'High Speed Rotary Buffing & Clean', defaultUserId: 'usr-rakesh', estimatedHours: 3, order: 3 },
      ],
    },
    {
      id: 'wf-diamond',
      code: 'wf-diamond',
      name: 'Diamond & Gemstone Setting',
      description: 'Precision 5-step workflow with prong/pave stone setting & microscopic QC',
      steps: [
        { name: 'Mount Casting & Laser Trimming', defaultUserId: 'usr-rahul', estimatedHours: 3, order: 0 },
        { name: 'Mount Pre-Polishing & Cleaning', defaultUserId: 'usr-amit', estimatedHours: 2, order: 1 },
        { name: 'Micro-Prong Diamond Setting', defaultUserId: 'usr-ankit', estimatedHours: 6, order: 2 },
        { name: 'Rhodium Plating & Final Luster', defaultUserId: 'usr-rakesh', estimatedHours: 3, order: 3 },
        { name: 'Microscopic Quality & Purity Inspection', defaultUserId: 'usr-admin', estimatedHours: 1, order: 4 },
      ],
    },
  ]

  for (const wf of demoWorkflows) {
    const { steps, ...wfData } = wf
    await prisma.workflow.upsert({
      where: { id: wfData.id },
      update: { name: wfData.name, description: wfData.description, code: wfData.code, active: true },
      create: { ...wfData, active: true },
    })

    await prisma.workflowStep.deleteMany({ where: { workflowId: wf.id } })
    for (const step of steps) {
      await prisma.workflowStep.create({
        data: {
          ...step,
          workflowId: wf.id,
        },
      })
    }
  }
  console.log(`  ✓ ${demoWorkflows.length} Workflow templates seeded`)

  // 17. Work Orders
  const workOrders = [
    {
      id: 'wo-10025',
      workId: 'WF-10025',
      productCode: 'SJ-RING-001',
      productName: 'Gold Ring — 22K',
      customerName: 'Priya Patel',
      workflowId: 'wf-ring',
      workflowName: 'Gold Ring Production',
      currentStepIndex: 3,
      grossWeightMg: gramsToMg(25.5),
      netWeightMg: gramsToMg(25.1),
      purity: '22K',
      metal: MetalType.GOLD,
      priority: WorkPriority.HIGH,
      status: WorkStatusValue.IN_PROGRESS,
      assignedToId: 'usr-sumit',
      assignedToName: 'Sumit Verma',
      startDate: daysAgo(3),
      expectedCompletion: daysAhead(3),
      createdAt: daysAgo(3),
      steps: [
        { stepId: 'ws-r1', stepName: 'Gold Issue', assignedToId: 'usr-rahul', assignedToName: 'Rahul Kumar', status: WorkStatusValue.COMPLETED, inputWeightMg: gramsToMg(25.5), outputWeightMg: gramsToMg(25.5), order: 0, startedAt: daysAgo(3), completedAt: daysAgo(3), dueDate: daysAgo(3) },
        { stepId: 'ws-r2', stepName: 'Melting', assignedToId: 'usr-rahul', assignedToName: 'Rahul Kumar', status: WorkStatusValue.COMPLETED, inputWeightMg: gramsToMg(25.5), outputWeightMg: gramsToMg(25.4), order: 1, startedAt: daysAgo(3), completedAt: daysAgo(2), dueDate: daysAgo(2) },
        { stepId: 'ws-r3', stepName: 'Shaping', assignedToId: 'usr-amit', assignedToName: 'Amit Patel', status: WorkStatusValue.COMPLETED, inputWeightMg: gramsToMg(25.4), outputWeightMg: gramsToMg(25.1), order: 2, startedAt: daysAgo(2), completedAt: daysAgo(1), dueDate: daysAgo(1) },
        { stepId: 'ws-r4', stepName: 'Design & Cutting', assignedToId: 'usr-sumit', assignedToName: 'Sumit Verma', status: WorkStatusValue.IN_PROGRESS, inputWeightMg: gramsToMg(25.1), order: 3, startedAt: hoursAgo(6), dueDate: daysAhead(0) },
        { stepId: 'ws-r5', stepName: 'Polishing', status: WorkStatusValue.PENDING, order: 4, dueDate: daysAhead(1) },
        { stepId: 'ws-r6', stepName: 'Stone Setting', status: WorkStatusValue.PENDING, order: 5, dueDate: daysAhead(2) },
        { stepId: 'ws-r7', stepName: 'Finishing', status: WorkStatusValue.PENDING, order: 6, dueDate: daysAhead(3) },
        { stepId: 'ws-r8', stepName: 'Quality Check', status: WorkStatusValue.PENDING, order: 7, dueDate: daysAhead(3) },
      ],
    },
    {
      id: 'wo-10026',
      workId: 'WF-10026',
      productCode: 'SJ-NEC-002',
      productName: 'Temple Necklace — 22K',
      customerName: 'Anita Desai',
      workflowId: 'wf-necklace',
      workflowName: 'Necklace Production',
      currentStepIndex: 2,
      grossWeightMg: gramsToMg(48.5),
      netWeightMg: gramsToMg(48.3),
      purity: '22K',
      metal: MetalType.GOLD,
      priority: WorkPriority.URGENT,
      status: WorkStatusValue.IN_PROGRESS,
      assignedToId: 'usr-amit',
      assignedToName: 'Amit Patel',
      startDate: daysAgo(5),
      expectedCompletion: daysAhead(8),
      createdAt: daysAgo(5),
      steps: [
        { stepId: 'ws-n1', stepName: 'Gold Issue', assignedToId: 'usr-rahul', assignedToName: 'Rahul Kumar', status: WorkStatusValue.COMPLETED, inputWeightMg: gramsToMg(48.5), outputWeightMg: gramsToMg(48.5), order: 0, startedAt: daysAgo(5), completedAt: daysAgo(5), dueDate: daysAgo(5) },
        { stepId: 'ws-n2', stepName: 'Melting', assignedToId: 'usr-rahul', assignedToName: 'Rahul Kumar', status: WorkStatusValue.COMPLETED, inputWeightMg: gramsToMg(48.5), outputWeightMg: gramsToMg(48.3), order: 1, startedAt: daysAgo(5), completedAt: daysAgo(4), dueDate: daysAgo(4) },
        { stepId: 'ws-n3', stepName: 'Shaping', assignedToId: 'usr-amit', assignedToName: 'Amit Patel', status: WorkStatusValue.IN_PROGRESS, inputWeightMg: gramsToMg(48.3), order: 2, startedAt: daysAgo(3), dueDate: daysAhead(1) },
        { stepId: 'ws-n4', stepName: 'Design & Cutting', status: WorkStatusValue.PENDING, order: 3, dueDate: daysAhead(3) },
        { stepId: 'ws-n5', stepName: 'Polishing', status: WorkStatusValue.PENDING, order: 4, dueDate: daysAhead(5) },
        { stepId: 'ws-n6', stepName: 'Stone Setting', status: WorkStatusValue.PENDING, order: 5, dueDate: daysAhead(7) },
        { stepId: 'ws-n7', stepName: 'Finishing', status: WorkStatusValue.PENDING, order: 6, dueDate: daysAhead(8) },
        { stepId: 'ws-n8', stepName: 'Quality Check', status: WorkStatusValue.PENDING, order: 7, dueDate: daysAhead(8) },
      ],
    },
    {
      id: 'wo-10024',
      workId: 'WF-10024',
      productCode: 'SJ-BAN-001',
      productName: 'Bridal Bangles (Pair) — 22K',
      customerName: 'Priya Patel',
      workflowId: 'wf-bangle',
      workflowName: 'Bangle Production',
      currentStepIndex: 6,
      grossWeightMg: gramsToMg(62.8),
      netWeightMg: gramsToMg(61.2),
      purity: '22K',
      metal: MetalType.GOLD,
      priority: WorkPriority.HIGH,
      status: WorkStatusValue.APPROVED,
      assignedToId: 'usr-admin',
      assignedToName: 'Suresh Shah (Admin)',
      startDate: daysAgo(15),
      expectedCompletion: daysAgo(6),
      actualCompletion: daysAgo(6),
      createdAt: daysAgo(15),
      steps: [
        { stepId: 'ws-b1', stepName: 'Gold Issue', assignedToId: 'usr-rahul', assignedToName: 'Rahul Kumar', status: WorkStatusValue.COMPLETED, inputWeightMg: gramsToMg(62.8), outputWeightMg: gramsToMg(62.8), order: 0, startedAt: daysAgo(15), completedAt: daysAgo(15), dueDate: daysAgo(15) },
        { stepId: 'ws-b2', stepName: 'Melting', assignedToId: 'usr-rahul', assignedToName: 'Rahul Kumar', status: WorkStatusValue.COMPLETED, inputWeightMg: gramsToMg(62.8), outputWeightMg: gramsToMg(62.5), order: 1, startedAt: daysAgo(15), completedAt: daysAgo(14), dueDate: daysAgo(14) },
        { stepId: 'ws-b3', stepName: 'Shaping', assignedToId: 'usr-amit', assignedToName: 'Amit Patel', status: WorkStatusValue.COMPLETED, inputWeightMg: gramsToMg(62.5), outputWeightMg: gramsToMg(62.0), order: 2, startedAt: daysAgo(14), completedAt: daysAgo(12), dueDate: daysAgo(12) },
        { stepId: 'ws-b4', stepName: 'Design & Cutting', assignedToId: 'usr-sumit', assignedToName: 'Sumit Verma', status: WorkStatusValue.COMPLETED, inputWeightMg: gramsToMg(62.0), outputWeightMg: gramsToMg(61.6), order: 3, startedAt: daysAgo(12), completedAt: daysAgo(10), dueDate: daysAgo(10) },
        { stepId: 'ws-b5', stepName: 'Polishing', assignedToId: 'usr-rakesh', assignedToName: 'Rakesh Singh', status: WorkStatusValue.COMPLETED, inputWeightMg: gramsToMg(61.6), outputWeightMg: gramsToMg(61.4), order: 4, startedAt: daysAgo(10), completedAt: daysAgo(8), dueDate: daysAgo(8) },
        { stepId: 'ws-b6', stepName: 'Finishing', assignedToId: 'usr-rahul', assignedToName: 'Rahul Kumar', status: WorkStatusValue.COMPLETED, inputWeightMg: gramsToMg(61.4), outputWeightMg: gramsToMg(61.2), order: 5, startedAt: daysAgo(8), completedAt: daysAgo(6), dueDate: daysAgo(6) },
        { stepId: 'ws-b7', stepName: 'Quality Check', assignedToId: 'usr-admin', assignedToName: 'Suresh Shah (Admin)', status: WorkStatusValue.APPROVED, order: 6, startedAt: daysAgo(6), completedAt: daysAgo(6), dueDate: daysAgo(6) },
      ],
    },
  ]

  for (const wo of workOrders) {
    const { steps, ...woData } = wo
    await prisma.workOrder.upsert({
      where: { id: woData.id },
      update: woData,
      create: woData,
    })

    await prisma.workOrderStep.deleteMany({ where: { workOrderId: wo.id } })
    for (const step of steps) {
      await prisma.workOrderStep.create({
        data: {
          ...step,
          workOrderId: wo.id,
        },
      })
    }
  }
  console.log(`  ✓ ${workOrders.length} Work orders seeded`)

  // 18. Wastage Records & Quality Checks
  const wastages = [
    { id: 'wst-1', workOrderId: 'wo-10025', workId: 'WF-10025', stepName: 'Melting', userId: 'usr-rahul', userName: 'Rahul Kumar', inputWeightMg: gramsToMg(25.5), outputWeightMg: gramsToMg(25.4), wastageWeightMg: gramsToMg(0.1), wastageBps: 39, date: daysAgo(2) },
    { id: 'wst-2', workOrderId: 'wo-10025', workId: 'WF-10025', stepName: 'Shaping', userId: 'usr-amit', userName: 'Amit Patel', inputWeightMg: gramsToMg(25.4), outputWeightMg: gramsToMg(25.1), wastageWeightMg: gramsToMg(0.3), wastageBps: 118, date: daysAgo(1) },
    { id: 'wst-3', workOrderId: 'wo-10026', workId: 'WF-10026', stepName: 'Melting', userId: 'usr-rahul', userName: 'Rahul Kumar', inputWeightMg: gramsToMg(48.5), outputWeightMg: gramsToMg(48.3), wastageWeightMg: gramsToMg(0.2), wastageBps: 41, date: daysAgo(4) },
    { id: 'wst-4', workOrderId: 'wo-10024', workId: 'WF-10024', stepName: 'Shaping', userId: 'usr-amit', userName: 'Amit Patel', inputWeightMg: gramsToMg(62.5), outputWeightMg: gramsToMg(62.0), wastageWeightMg: gramsToMg(0.5), wastageBps: 80, date: daysAgo(12) },
    { id: 'wst-5', workOrderId: 'wo-10024', workId: 'WF-10024', stepName: 'Polishing', userId: 'usr-rakesh', userName: 'Rakesh Singh', inputWeightMg: gramsToMg(61.6), outputWeightMg: gramsToMg(61.4), wastageWeightMg: gramsToMg(0.2), wastageBps: 32, date: daysAgo(8) },
  ]
  for (const w of wastages) {
    await prisma.wastageRecord.upsert({
      where: { id: w.id },
      update: w,
      create: w,
    })
  }

  const qcs = [
    { id: 'qc-1', workOrderId: 'wo-10024', workId: 'WF-10024', productName: 'Bridal Bangles (Pair) — 22K', weightChecked: true, purityChecked: true, designChecked: true, stoneChecked: true, finishingChecked: true, result: QCResult.APPROVED, remarks: 'All checks passed, excellent finishing', checkedById: 'usr-admin', date: daysAgo(6) },
  ]
  for (const q of qcs) {
    await prisma.qualityCheck.upsert({
      where: { id: q.id },
      update: q,
      create: q,
    })
  }
  console.log('  ✓ Wastage records and Quality Checks seeded')

  // 19. Audit Logs & Notifications
  const auditLogs = [
    { id: 'al-1', timestamp: daysAgo(30), userId: 'usr-admin', userName: 'Suresh Shah (Admin)', action: 'CREATE_PURCHASE', entity: 'Purchase', entityId: 'PUR-2026-0001', details: 'Created purchase from Royal Gold Suppliers (₹710,000)' },
    { id: 'al-2', timestamp: daysAgo(15), userId: 'usr-admin', userName: 'Suresh Shah (Admin)', action: 'CREATE_SALE', entity: 'Sale', entityId: 'INV-2026-00121', details: 'Created invoice for Priya Patel (₹43,260)' },
    { id: 'al-3', timestamp: daysAgo(3), userId: 'usr-admin', userName: 'Suresh Shah (Admin)', action: 'CREATE_WORK_ORDER', entity: 'WorkOrder', entityId: 'WF-10025', details: 'Created work order for Gold Ring' },
    { id: 'al-6', timestamp: hoursAgo(2), userId: 'usr-admin', userName: 'Suresh Shah (Admin)', action: 'LOGIN', entity: 'User', entityId: 'usr-admin', details: 'Admin logged in' },
  ]
  for (const al of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: al.id },
      update: al,
      create: al,
    })
  }

  const notifications = [
    { id: 'ntf-1', type: NotificationType.WORK_ASSIGNED, title: 'New Work Assigned', message: 'Work Order WF-10025 step "Design & Cutting" assigned to you.', forUserId: 'usr-sumit', read: false, link: 'workflow', createdAt: hoursAgo(6) },
    { id: 'ntf-2', type: NotificationType.WORK_COMPLETED, title: 'Step Completed', message: 'Rahul Kumar completed step "Melting" for WF-10025.', forUserId: 'usr-admin', read: true, link: 'workflow', createdAt: daysAgo(2) },
    { id: 'ntf-3', type: NotificationType.STOCK_LOW, title: 'Low Stock Alert', message: 'Diamond Princess 0.5ct stock is below reorder level (25 remaining).', forUserId: 'usr-admin', read: false, link: 'raw-materials', createdAt: daysAgo(1) },
    { id: 'ntf-4', type: NotificationType.PAYMENT_DUE, title: 'Payment Due', message: 'Sneha Joshi has pending payment of ₹36,735 on INV-2026-00125.', forUserId: 'usr-admin', read: false, link: 'customers', createdAt: daysAgo(2) },
    { id: 'ntf-5', type: NotificationType.NEW_SALE, title: 'New Sale Billed', message: 'Invoice INV-2026-00125 generated for ₹76,735.', forUserId: 'usr-admin', read: true, link: 'sales', createdAt: daysAgo(2) },
  ]
  for (const n of notifications) {
    await prisma.appNotification.upsert({
      where: { id: n.id },
      update: n,
      create: n,
    })
  }
  console.log('  ✓ Audit logs and Notifications seeded')

  console.log('🎉 Comprehensive DEMO seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Demo seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
