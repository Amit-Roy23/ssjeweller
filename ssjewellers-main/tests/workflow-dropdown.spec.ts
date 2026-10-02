import 'dotenv/config'
import { test, expect } from '@playwright/test'
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
const db = new PrismaClient({
  datasources: { db: { url: directUrl } },
})

test('Verify Workflow Dropdown in Browser', async ({ page }) => {
  const username = `test_admin_${Date.now().toString().slice(-4)}`
  const password = 'TestAdminPass@2026'
  const hash = await bcrypt.hash(password, 10)

  const user = await db.user.create({
    data: {
      username,
      name: 'Dropdown Test Admin',
      phone: '9898099999',
      role: UserRole.ADMIN,
      passwordHash: hash,
      active: true,
      mustChangePassword: false,
    },
  })

  try {
    await page.goto('/')
    await page.locator('#username').fill(username)
    await page.locator('#password').fill(password)
    await page.locator('button[type="submit"]:has-text("Sign In")').click()
    await expect(page.locator('text=Jewellery ERP').first()).toBeVisible({ timeout: 15000 })

    // Navigate to Workflow
    await page.locator('aside button:has-text("Workflow")').click()
    await expect(page.locator('button:has-text("New Work Order")').first()).toBeVisible({ timeout: 10000 })

    // Click New Work Order
    await page.locator('button:has-text("New Work Order")').first().click()
    await expect(page.locator('div[role="dialog"]')).toBeVisible({ timeout: 5000 })

    // Check Workflow Select
    const workflowSelect = page.locator('div[role="dialog"] button:has-text("Production"), div[role="dialog"] button:has-text("Jewellery"), div[role="dialog"] button:has-text("Manufacturing"), div[role="dialog"] button:has-text("Assembly"), div[role="dialog"] button[role="combobox"]').first()
    await expect(workflowSelect).toBeVisible()

    // Click to open dropdown options
    await workflowSelect.click()

    // Verify option items
    await expect(page.locator('[role="option"]:has-text("Gold Ring Production")').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[role="option"]:has-text("Diamond & Gemstone Jewellery")').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[role="option"]:has-text("Bangle & Kada Manufacturing")').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[role="option"]:has-text("Necklace & Chain Assembly")').first()).toBeVisible({ timeout: 5000 })

    console.log('✔ Verified all 4 workflow templates are visible and selectable in the dropdown!')
  } finally {
    await db.user.delete({ where: { id: user.id } })
    await db.$disconnect()
  }
})
