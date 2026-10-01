import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Run SELECT 1 through Prisma to verify database connectivity
    await db.$queryRaw`SELECT 1`
    
    return NextResponse.json(
      {
        status: 'healthy',
        service: 'SS Jewellery ERP API',
        timestamp: new Date().toISOString(),
        database: 'connected',
      },
      { status: 200 }
    )
  } catch (error) {
    // Safe error response with zero sensitive data/connection string leakage
    console.error('Health check database error:', error instanceof Error ? error.name : 'Unknown error')
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'SS Jewellery ERP API',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      },
      { status: 503 }
    )
  }
}
