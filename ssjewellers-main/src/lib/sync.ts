'use client'

import { apiClient } from '@/lib/api-client'
import { useJewelleryStore } from '@/lib/store'

/**
 * Syncs client Zustand store with live server database data if the backend is responsive.
 */
export async function syncServerDataToStore(): Promise<boolean> {
  try {
    const health = await apiClient.get<{ status: string }>('/api/health')
    if (health.status !== 'healthy') return false

    // Fetch initial master data
    const [settingsRes, productsRes, customersRes, goldRes, ordersRes] = await Promise.allSettled([
      apiClient.settings.get(),
      apiClient.inventory.getProducts(),
      apiClient.customers.list(),
      apiClient.inventory.getGold(),
      apiClient.workshop.getOrders(),
    ])

    const store = useJewelleryStore.getState()

    if (settingsRes.status === 'fulfilled' && settingsRes.value.settings) {
      store.updateSettings(settingsRes.value.settings as Record<string, unknown>)
    }

    return true
  } catch {
    // If backend is not reached, preserve current store state
    return false
  }
}
