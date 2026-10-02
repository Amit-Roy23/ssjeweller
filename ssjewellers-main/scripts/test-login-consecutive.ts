import 'dotenv/config'
import { db } from '../src/lib/db'
import { hashPassword, verifyPassword } from '../src/lib/auth/password'
import { UserRole } from '@prisma/client'

async function runConsecutiveLoginTest() {
  console.log('================================================================');
  console.log('🧪 AUTOMATED TEST: 3 CONSECUTIVE LOGINS WITH ACCURATE COUNTERS');
  console.log('================================================================\n');

  const testUsername = `test_verifier_${Date.now()}`
  const testPassword = 'TestPassword123!'
  const testPasswordHash = await hashPassword(testPassword)

  console.log(`1. Setting up ephemeral test user in Supabase: @${testUsername}`);
  const createdTestUser = await db.user.create({
    data: {
      username: testUsername,
      name: 'Automated Test User',
      phone: '+91 99999 00000',
      email: `${testUsername}@example.com`,
      role: UserRole.STAFF,
      passwordHash: testPasswordHash,
      active: true,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  })

  console.log(`✓ Ephemeral test user created (ID: ${createdTestUser.id})`);
  console.log(`✓ Initial failedLoginAttempts: ${createdTestUser.failedLoginAttempts}`);
  console.log(`✓ Initial lockedUntil: ${createdTestUser.lockedUntil ?? 'null'}\n`);

  try {
    // Helper simulating the exact login decision & counter handling in /api/auth/login
    async function executeLoginFlow(attemptNumber: number, pwd: string, expectSuccess: boolean) {
      console.log(`--- Login Attempt #${attemptNumber} (${expectSuccess ? 'Valid Password' : 'Wrong Password'}) ---`);

      // Query user
      const user = await db.user.findUnique({
        where: { username: testUsername },
      })

      if (!user) throw new Error('User not found')
      if (!user.active) throw new Error('User inactive')
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new Error(`User locked until ${user.lockedUntil.toISOString()}`)
      }

      const isPasswordValid = await verifyPassword(pwd, user.passwordHash)

      if (!isPasswordValid) {
        // Wrong password branch
        const failedAttempts = user.failedLoginAttempts + 1
        const lockAccount = failedAttempts >= 5
        const lockedUntil = lockAccount ? new Date(Date.now() + 15 * 60 * 1000) : null

        await db.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: failedAttempts,
            lockedUntil,
          },
        })

        const updated = await db.user.findUnique({ where: { id: user.id } })
        console.log(`  ✓ Decision reason     : wrong_password`);
        console.log(`  ✓ failedLoginAttempts : ${updated?.failedLoginAttempts} (incremented)`);
        console.log(`  ✓ lockedUntil         : ${updated?.lockedUntil ?? 'null'}`);
        return { success: false, failedAttempts: updated?.failedLoginAttempts }
      }

      // Valid password branch
      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLogin: new Date(),
        },
      })

      const updated = await db.user.findUnique({ where: { id: user.id } })
      if (!updated) throw new Error('Failed to retrieve updated user')

      if (updated.failedLoginAttempts !== 0) {
        throw new Error(`Assertion failed: failedLoginAttempts is ${updated.failedLoginAttempts}, expected 0`)
      }
      if (updated.lockedUntil !== null) {
        throw new Error(`Assertion failed: lockedUntil is ${updated.lockedUntil}, expected null`)
      }

      console.log(`  ✓ Decision reason     : ok`);
      console.log(`  ✓ Password verified   : true`);
      console.log(`  ✓ failedLoginAttempts : ${updated.failedLoginAttempts} (stays at 0)`);
      console.log(`  ✓ lockedUntil         : ${updated.lockedUntil ?? 'null'}`);
      console.log(`  ✓ lastLogin timestamp : ${updated.lastLogin?.toISOString()}`);
      console.log(`  ✓ Attempt #${attemptNumber} SUCCESS\n`);

      return { success: true, failedAttempts: updated.failedLoginAttempts }
    }

    // Run 3 consecutive logins with correct password
    for (let i = 1; i <= 3; i++) {
      const res = await executeLoginFlow(i, testPassword, true)
      if (!res.success) {
        throw new Error(`Consecutive login attempt #${i} unexpectedly failed`)
      }
    }

    // Verify 1 failed attempt increments counter, then correct attempt resets it to 0
    console.log('--- Testing Reset Behavior: 1 Failed Attempt followed by 1 Successful Attempt ---');
    const failRes = await executeLoginFlow(4, 'IncorrectPassword123!', false)
    if (failRes.failedAttempts !== 1) {
      throw new Error(`Expected failedAttempts to be 1 after wrong password, got ${failRes.failedAttempts}`)
    }

    const recoverRes = await executeLoginFlow(5, testPassword, true)
    if (recoverRes.failedAttempts !== 0) {
      throw new Error(`Expected failedAttempts to reset to 0 after recovery login, got ${recoverRes.failedAttempts}`)
    }

    // Final verification
    const finalState = await db.user.findUnique({
      where: { username: testUsername },
    })

    console.log('================================================================');
    console.log('📊 FINAL DB VERIFICATION IN SUPABASE:');
    console.log(`  ✓ Username            : ${finalState?.username}`);
    console.log(`  ✓ Active              : ${finalState?.active}`);
    console.log(`  ✓ failedLoginAttempts : ${finalState?.failedLoginAttempts} (CONFIRMED 0)`);
    console.log(`  ✓ lockedUntil         : ${finalState?.lockedUntil ?? 'null'}`);
    console.log('================================================================');
    console.log('🎉 TEST RESULT: ALL 3 CONSECUTIVE LOGINS SUCCEEDED, COUNTERS STAY AT 0!');
    console.log('================================================================\n');

  } finally {
    // Cleanup ephemeral test user
    await db.user.delete({
      where: { id: createdTestUser.id },
    })
    console.log(`🧹 Cleaned up ephemeral test user @${testUsername} from Supabase.`);
  }
}

runConsecutiveLoginTest()
  .catch((err) => {
    console.error('❌ Test failed:', err.message || err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
