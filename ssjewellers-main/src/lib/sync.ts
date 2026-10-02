'use client'

import { apiClient } from '@/lib/api-client'

/**
 * Health check utility to verify backend connectivity.
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const health = await apiClient.get<{ status: string }>('/api/health')
    return health.status === 'healthy'
  } catch {
    return false
  }
}
