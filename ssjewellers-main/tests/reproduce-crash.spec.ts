import 'dotenv/config'
import { test, expect } from '@playwright/test'
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
const db = new PrismaClient({
  datasources: { db: { url: directUrl } },
})

test('Reproduce Add Stock & Add Stone Crash', async ({ page }) => {
  const username = `test_admin_${Date.now().toString().slice(-4)}`
  const password = 'TestAdminPass@2026'
  const hash = await bcrypt.hash(password, 10)

  const user = await db.user.create({
    data: {
      username,
      name: 'Crash Test Admin',
      phone: '9898088888',
      role: UserRole.ADMIN,
      passwordHash: hash,
      active: true,
      mustChangePassword: false,
    },
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text())
    }
  })

  page.on('pageerror', (err) => {
    console.log('PAGE ERROR (UNCAUGHT EXCEPTION):', err.message, err.stack)
  })

  try {
    await page.goto('/')
    await page.locator('#username').fill(username)
    await page.locator('#password').fill(password)
    await page.locator('button[type="submit"]:has-text("Sign In")').click()
    await expect(page.locator('text=Jewellery ERP').first()).toBeVisible({ timeout: 15000 })

    // 1. Go to Gold & Raw Material page
    console.log('\n--- Testing Gold & Raw Material Add Stock ---')
    await page.locator('aside button:has-text("Gold Stock"), aside button:has-text("Gold & Raw Material"), aside button:has-text("Raw Materials")').first().click()
    await page.waitForTimeout(1000)

    // Click "Add Stock"
    const addStockBtn = page.locator('button:has-text("Add Stock")').first()
    await expect(addStockBtn).toBeVisible()
    await addStockBtn.click()

    // Wait and check if error boundary or dialog appeared
    await page.waitForTimeout(1000)
    const errorBoundary = await page.locator('text=This page couldn\'t load, text=Something went wrong, text=Application error').first().isVisible()
    console.log('Gold Add Stock Error Boundary Visible?', errorBoundary)

    // Close gold dialog (Click Cancel)
    await page.locator('button:has-text("Cancel")').first().click()
    await page.waitForTimeout(500)

    // 2. Go to Loose Stones & Diamond page
    console.log('\n--- Testing Loose Stones Add Stone ---')
    await page.locator('aside button:has-text("Stones")').first().click()
    await page.waitForTimeout(1000)

    // Click "Add Stone"
    const addStoneBtn = page.locator('button:has-text("Add Stone")').first()
    await expect(addStoneBtn).toBeVisible()
    await addStoneBtn.click()

    await page.waitForTimeout(1000)
    const errorBoundary2 = await page.locator('text=This page couldn\'t load, text=Something went wrong, text=Application error').first().isVisible()
    console.log('Stones Add Stone Error Boundary Visible?', errorBoundary2)

    // Check that Add Stone dialog is visible
    await expect(page.locator('text=Add a new stone or diamond lot')).toBeVisible()
    console.log('Stones Add Stone Dialog is visible and functional!')

    // Close stones dialog
    await page.locator('button:has-text("Cancel")').first().click()

  } finally {
    await db.user.delete({ where: { id: user.id } })
    await db.$disconnect()
  }
})
