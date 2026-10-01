import 'dotenv/config'
import { db } from '../src/lib/db'
import { URL } from 'url'

async function verifyDatabase() {
  console.log('================================================================');
  console.log('🔍 SUPABASE POSTGRESQL VERIFICATION REPORT');
  console.log('================================================================\n');

  // Extract hostname only (strictly no credentials or query parameters)
  const dbUrl = process.env.DATABASE_URL || ''
  const directUrl = process.env.DIRECT_URL || ''

  try {
    const parsedDbUrl = new URL(dbUrl)
    console.log(`🌐 Database Host (Pooled) : ${parsedDbUrl.hostname}:${parsedDbUrl.port || '5432'}`);
    console.log(`📁 Database Name          : ${parsedDbUrl.pathname.replace('/', '')}`);
  } catch {
    console.log('🌐 Database Host (Pooled) : [Invalid URL format]');
  }

  try {
    if (directUrl) {
      const parsedDirectUrl = new URL(directUrl)
      console.log(`🌐 Direct Migration Host  : ${parsedDirectUrl.hostname}:${parsedDirectUrl.port || '5432'}`);
    }
  } catch {
    console.log('🌐 Direct Migration Host  : [Invalid URL format]');
  }

  console.log('\n📊 Production Seed Table Row Counts in Supabase:');
  console.log('----------------------------------------------------------------');

  const [userCount, purityCount, categoryCount, shopSettingCount, sequenceCounterCount, workStatusCount] = await Promise.all([
    db.user.count(),
    db.purity.count(),
    db.category.count(),
    db.shopSetting.count(),
    db.sequenceCounter.count(),
    db.workStatus.count(),
  ])

  console.log(`  ✓ Users            : ${userCount}`);
  console.log(`  ✓ Purities         : ${purityCount}`);
  console.log(`  ✓ Categories       : ${categoryCount}`);
  console.log(`  ✓ Shop Settings    : ${shopSettingCount}`);
  console.log(`  ✓ Sequence Counters: ${sequenceCounterCount}`);
  console.log(`  ✓ Work Statuses    : ${workStatusCount}`);
  console.log('----------------------------------------------------------------');

  // Also query users to show the seeded admin user info (excluding password hash)
  const adminUser = await db.user.findFirst({
    select: {
      username: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
    }
  })
  console.log('\n👤 Seeded Super Admin:');
  console.log(`  Username: ${adminUser?.username} | Name: ${adminUser?.name} | Role: ${adminUser?.role} | Active: ${adminUser?.active}`);

  console.log('\n================================================================');
}

verifyDatabase()
  .catch((err) => {
    console.error('Verification failed:', err.message)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
