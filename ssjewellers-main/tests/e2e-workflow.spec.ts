import 'dotenv/config'
import { test, expect } from '@playwright/test'
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
const db = new PrismaClient({
  datasources: {
    db: {
      url: directUrl,
    },
  },
})

// Secure test-run credentials created dynamically per test run
const E2E_ADMIN_USER = {
  username: `e2e_admin_${Date.now().toString().slice(-4)}`,
  name: 'E2E Test Admin',
  phone: '+91 98980 00001',
  role: UserRole.ADMIN,
  password: 'E2eAdminPassword@2026',
}

const E2E_STAFF_USER = {
  username: `e2e_staff_${Date.now().toString().slice(-4)}`,
  name: 'E2E Test Staff',
  phone: '+91 98980 00002',
  role: UserRole.STAFF,
  password: 'E2eStaffPassword@2026',
}

test.beforeAll(async () => {
  // Ensure test users exist in database
  const adminHash = await bcrypt.hash(E2E_ADMIN_USER.password, 10)
  const staffHash = await bcrypt.hash(E2E_STAFF_USER.password, 10)

  await db.user.create({
    data: {
      username: E2E_ADMIN_USER.username,
      name: E2E_ADMIN_USER.name,
      phone: E2E_ADMIN_USER.phone,
      role: E2E_ADMIN_USER.role,
      passwordHash: adminHash,
      active: true,
      mustChangePassword: false,
    },
  })

  await db.user.create({
    data: {
      username: E2E_STAFF_USER.username,
      name: E2E_STAFF_USER.name,
      phone: E2E_STAFF_USER.phone,
      role: E2E_STAFF_USER.role,
      passwordHash: staffHash,
      active: true,
      mustChangePassword: false,
    },
  })
})

test.afterAll(async () => {
  // Cleanup test users and test entities
  const users = await db.user.findMany({
    where: { username: { in: [E2E_ADMIN_USER.username, E2E_STAFF_USER.username] } },
  })
  const userIds = users.map((u) => u.id)
  if (userIds.length > 0) {
    await db.payment.deleteMany({ where: { receivedById: { in: userIds } } })
    await db.saleItem.deleteMany({ where: { sale: { billedById: { in: userIds } } } })
    await db.stockMovement.deleteMany({ where: { performedById: { in: userIds } } })
    await db.stockAdjustment.deleteMany({ where: { performedById: { in: userIds } } })
    await db.auditLog.deleteMany({ where: { userId: { in: userIds } } })
    await db.sale.deleteMany({ where: { billedById: { in: userIds } } })
    await db.user.deleteMany({ where: { id: { in: userIds } } })
  }
  await db.$disconnect()
})

test.describe('S.S Jewellery ERP E2E Architecture & Permissions Suite', () => {
  test('1. Real Login Page Flow', async ({ page }) => {
    await page.goto('/')

    // Expect Login Page to be visible
    await expect(page.locator('text=Welcome Back').first()).toBeVisible()

    // Fill credentials
    await page.locator('#username').fill(E2E_ADMIN_USER.username)
    await page.locator('#password').fill(E2E_ADMIN_USER.password)

    // Submit
    await page.locator('button[type="submit"]:has-text("Sign In")').click()

    // Expect to enter Dashboard shell
    await expect(page.locator('text=Jewellery ERP').first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('button:has-text("Dashboard")').first()).toBeVisible()
  })

  test('2. Customer Creation, DB Verification, Page Reload & localStorage Independence', async ({ page }) => {
    // Log in
    await page.goto('/')
    await page.locator('#username').fill(E2E_ADMIN_USER.username)
    await page.locator('#password').fill(E2E_ADMIN_USER.password)
    await page.locator('button[type="submit"]:has-text("Sign In")').click()
    await expect(page.locator('text=Jewellery ERP').first()).toBeVisible({ timeout: 15000 })

    // Navigate to Customers screen
    await page.locator('aside button:has-text("Customers")').click()
    await expect(page.locator('button:has-text("Add Customer")').first()).toBeVisible({ timeout: 10000 })

    // Open Add Customer Dialog
    const testCustomerName = `E2E Cust ${Date.now()}`
    const testCustomerPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`

    await page.locator('button:has-text("Add Customer")').first().click()
    await expect(page.locator('div[role="dialog"] input[placeholder="e.g. Rahul Sharma"]')).toBeVisible({ timeout: 10000 })

    // Fill form
    await page.locator('div[role="dialog"] input[placeholder="e.g. Rahul Sharma"]').fill(testCustomerName)
    await page.locator('div[role="dialog"] input[placeholder="e.g. 9825012345"]').fill(testCustomerPhone)
    await page.locator('div[role="dialog"] input[placeholder="e.g. Surat"]').fill('Kolkata')

    // Submit
    await page.locator('div[role="dialog"] button:has-text("Add Customer")').click()

    // Verify customer appears in UI
    await expect(page.locator(`text=${testCustomerName}`).first()).toBeVisible({ timeout: 10000 })

    // Verify customer exists in PostgreSQL database directly
    const dbCustomer = await db.customer.findFirst({
      where: { name: testCustomerName },
    })
    expect(dbCustomer).not.toBeNull()
    expect(dbCustomer?.phone).toBe(testCustomerPhone)

    // Reload page and verify still present (fetched from API)
    await page.reload()
    await page.locator('aside button:has-text("Customers")').click()
    await expect(page.locator(`text=${testCustomerName}`).first()).toBeVisible({ timeout: 10000 })

    // Clear localStorage completely and reload -> customer MUST still be present
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.locator('aside button:has-text("Customers")').click()
    await expect(page.locator(`text=${testCustomerName}`).first()).toBeVisible({ timeout: 10000 })

    // Clean up created test customer from DB
    if (dbCustomer) {
      await db.customer.delete({ where: { id: dbCustomer.id } })
    }
  })

  test('3. Sale Lifecycle: Create Sale -> Decrement Stock -> Cancel Sale -> Restock', async ({ page }) => {
    // 1. Setup a test product in database
    const category = await db.category.findFirst()
    const productCode = `E2E-RING-${Date.now().toString().slice(-5)}`
    const initialStock = 10

    const testProduct = await db.product.create({
      data: {
        productCode,
        barcode: `890${Date.now().toString().slice(-10)}`,
        name: `E2E Test Gold Ring ${Date.now().toString().slice(-4)}`,
        categoryId: category?.id || (await db.category.create({ data: { name: 'E2E Cat' } })).id,
        metal: 'GOLD',
        purity: '22K',
        grossWeightMg: BigInt(5000),
        netWeightMg: BigInt(5000),
        sellingPricePaise: BigInt(4500000), // ₹45,000.00
        costPricePaise: BigInt(4000000),
        stock: initialStock,
      },
    })

    const testCust = await db.customer.create({
      data: {
        customerId: `CUST-E2E-${Date.now().toString().slice(-4)}`,
        name: 'E2E Sale Customer',
        phone: '9876543210',
      },
    })

    // Log in
    await page.goto('/')
    await page.locator('#username').fill(E2E_ADMIN_USER.username)
    await page.locator('#password').fill(E2E_ADMIN_USER.password)
    await page.locator('button[type="submit"]:has-text("Sign In")').click()
    await expect(page.locator('text=Jewellery ERP').first()).toBeVisible({ timeout: 15000 })

    // Create Sale via API request from the authenticated session
    const createSaleRes = await page.request.post('/api/sales', {
      data: {
        customerId: testCust.id,
        customerName: testCust.name,
        customerPhone: testCust.phone,
        items: [
          {
            productId: testProduct.id,
            productCode: testProduct.productCode,
            name: testProduct.name,
            quantity: 2,
            purity: '22K',
            grossWeightMg: 5000,
            netWeightMg: 5000,
            ratePaisePerGram: 720000,
          },
        ],
        paidAmountPaise: 4635000,
        paymentMode: 'CASH',
      },
    })

    if (!createSaleRes.ok()) {
      const errBody = await createSaleRes.text()
      console.error('Create Sale API error:', createSaleRes.status(), errBody)
    }
    expect(createSaleRes.ok()).toBeTruthy()
    const saleData = await createSaleRes.json()
    const saleId = saleData.sale.id

    // Check that product stock decremented from 10 to 8
    const productAfterSale = await db.product.findUnique({ where: { id: testProduct.id } })
    expect(productAfterSale?.stock).toBe(8)

    // Cancel the sale
    const cancelRes = await page.request.post(`/api/sales/${saleId}/cancel`, {
      data: {
        cancelReason: 'Customer returned item in E2E test',
      },
    })
    if (!cancelRes.ok()) {
      const errBody = await cancelRes.text()
      console.error('Cancel Sale API error:', cancelRes.status(), errBody)
    }
    expect(cancelRes.ok()).toBeTruthy()

    // Check that product stock is restored back to 10
    const productAfterCancel = await db.product.findUnique({ where: { id: testProduct.id } })
    expect(productAfterCancel?.stock).toBe(10)

    // Verify sale status is CANCELLED
    const cancelledSale = await db.sale.findUnique({ where: { id: saleId } })
    expect(cancelledSale?.status).toBe('CANCELLED')

    // Cleanup with full cascade order
    await db.payment.deleteMany({ where: { saleId } })
    await db.saleItem.deleteMany({ where: { saleId } })
    await db.sale.delete({ where: { id: saleId } })
    await db.product.delete({ where: { id: testProduct.id } })
    await db.customer.delete({ where: { id: testCust.id } })
  })

  test('4. Role-Based Access Control: STAFF blocked from Users & Audit Log in UI and API', async ({ page }) => {
    // Log in as STAFF user
    await page.goto('/')
    await page.locator('#username').fill(E2E_STAFF_USER.username)
    await page.locator('#password').fill(E2E_STAFF_USER.password)
    await page.locator('button[type="submit"]:has-text("Sign In")').click()
    await expect(page.locator('text=Jewellery ERP').first()).toBeVisible({ timeout: 15000 })

    // Verify UI blocks Admin-only items: Users and Audit Log are NOT visible in navigation
    await expect(page.locator('aside button:has-text("Users")')).toHaveCount(0)
    await expect(page.locator('aside button:has-text("Audit Log")')).toHaveCount(0)

    // Verify API enforces 403 Forbidden for Staff attempting to access Users API
    const usersApiRes = await page.request.get('/api/users')
    expect(usersApiRes.status()).toBe(403)

    // Verify API enforces 403 Forbidden for Staff attempting to access Audit Log API
    const auditApiRes = await page.request.get('/api/audit-logs')
    expect(auditApiRes.status()).toBe(403)
  })
})
