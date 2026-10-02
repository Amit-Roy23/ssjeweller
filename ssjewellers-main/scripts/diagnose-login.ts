import 'dotenv/config'
import { PrismaClient, UserRole } from '@prisma/client'
import { verifyPassword, hashPassword } from '../src/lib/auth/password'
import { createSessionToken } from '../src/lib/auth/session'

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
const db = new PrismaClient({ datasources: { db: { url: directUrl } } })

async function main() {
  const username = `diag_user_${Date.now()}`
  const rawPw = 'DiagPassword@123'
  const passwordHash = await hashPassword(rawPw)

  console.log('1. Creating test user in DB:', username)
  const user = await db.user.create({
    data: {
      username,
      name: 'Diag User',
      phone: '9898989898',
      role: UserRole.ADMIN,
      passwordHash,
      active: true,
      mustChangePassword: false,
    },
  })
  console.log('2. User created with ID:', user.id)

  const isValid = await verifyPassword(rawPw, user.passwordHash)
  console.log('3. Password verify result:', isValid)

  try {
    const token = await createSessionToken({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    })
    console.log('4. Session token generated successfully, length:', token.length)
  } catch (e: any) {
    console.error('4. Session token generation error:', e.message)
  }

  // Test calling fetch to localhost:3000/api/auth/login if server is up
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: rawPw }),
    })
    const body = await res.json()
    console.log('5. HTTP /api/auth/login response status:', res.status, body)
  } catch (e: any) {
    console.log('5. Local dev server fetch (if running):', e.message)
  }

  await db.user.delete({ where: { id: user.id } })
  console.log('6. Cleanup finished.')
  await db.$disconnect()
}

main().catch(console.error)
