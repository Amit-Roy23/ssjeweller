import 'dotenv/config'
import { db } from '../src/lib/db'

async function checkAndSync() {
  const setting = await db.shopSetting.findUnique({ where: { id: 'default' } })
  console.log('Current ShopSetting in DB:', {
    shopName: setting?.shopName,
    ownerName: setting?.ownerName,
    goldRate24KPaise: setting?.defaultGoldRate24KPaise ? Number(setting.defaultGoldRate24KPaise) : null,
    silverRatePaise: setting?.defaultSilverRatePaisePerKg ? Number(setting.defaultSilverRatePaisePerKg) : null,
    gstRateBps: setting?.defaultGstRateBps,
  })

  const adminUsers = await db.user.findMany({ where: { role: 'ADMIN' } })
  console.log('Current Admins in DB:', adminUsers.map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role })))

  if (setting?.ownerName) {
    const res = await db.user.updateMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { username: 'admin' },
          { id: 'usr-admin' },
        ],
      },
      data: {
        name: setting.ownerName,
      },
    })
    console.log(`✓ Synchronized ${res.count} admin user(s) name with ownerName "${setting.ownerName}"`)
  }
}

checkAndSync()
  .catch(console.error)
  .finally(() => process.exit(0))
