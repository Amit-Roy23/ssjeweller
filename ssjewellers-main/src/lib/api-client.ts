/**
 * S.S JEWELLERY ERP — Unified API Client
 * Connects frontend components and React Query hooks directly to Next.js API route handlers.
 */

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `HTTP error! Status: ${res.status}`)
  }

  return data as T
}

export const apiClient = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),

  // Sales
  sales: {
    list: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.status) q.set('status', params.status)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return apiClient.get<{ sales: unknown[]; pagination: { totalCount: number; totalPages: number } }>(
        `/api/sales?${q.toString()}`
      )
    },
    get: (id: string) => apiClient.get<{ sale: unknown }>(`/api/sales/${id}`),
    create: (data: unknown) => apiClient.post<{ success: boolean; sale: unknown }>('/api/sales', data),
    cancel: (id: string, reason: string) =>
      apiClient.post<{ success: boolean; sale: unknown }>(`/api/sales/${id}/cancel`, { cancelReason: reason }),
    recordPayment: (saleId: string, data: unknown) =>
      apiClient.post<{ success: boolean; payment: unknown }>(`/api/sales/${saleId}/payments`, data),
    returns: {
      list: () => apiClient.get<{ returns: unknown[] }>('/api/sales/returns'),
      create: (data: unknown) => apiClient.post<{ success: boolean; return: unknown }>('/api/sales/returns', data),
    },
  },

  // Inventory
  inventory: {
    getGold: (params?: { status?: string; metal?: string }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.metal) q.set('metal', params.metal)
      return apiClient.get<{ goldStocks: unknown[] }>(`/api/inventory/gold?${q.toString()}`)
    },
    addGold: (data: unknown) => apiClient.post<{ success: boolean; stock: unknown }>('/api/inventory/gold', data),
    issueGold: (data: { goldStockId: string; workId: string }) =>
      apiClient.post<{ success: boolean; goldStock: unknown }>('/api/inventory/gold/issue', data),
    getStones: () => apiClient.get<{ stones: unknown[] }>('/api/inventory/stones'),
    addStone: (data: unknown) => apiClient.post<{ success: boolean; stone: unknown }>('/api/inventory/stones', data),
    issueStones: (data: { stoneItemId: string; quantity: number; workId: string }) =>
      apiClient.post<{ success: boolean; stoneItem: unknown }>('/api/inventory/stones/issue', data),
    getProducts: (params?: { search?: string; categoryId?: string; inStock?: boolean }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.categoryId) q.set('categoryId', params.categoryId)
      if (params?.inStock) q.set('inStock', 'true')
      return apiClient.get<{ products: unknown[] }>(`/api/inventory/products?${q.toString()}`)
    },
    addProduct: (data: unknown) =>
      apiClient.post<{ success: boolean; product: unknown }>('/api/inventory/products', data),
    getMovements: (params?: { itemType?: string; itemId?: string }) => {
      const q = new URLSearchParams()
      if (params?.itemType) q.set('itemType', params.itemType)
      if (params?.itemId) q.set('itemId', params.itemId)
      return apiClient.get<{ movements: unknown[] }>(`/api/inventory/movements?${q.toString()}`)
    },
    adjustStock: (data: unknown) =>
      apiClient.post<{ success: boolean; adjustment: unknown }>('/api/inventory/adjustments', data),
    getSummary: () => apiClient.get<{ summary: unknown }>('/api/inventory/summary'),
  },

  // Workshop
  workshop: {
    getOrders: (params?: { status?: string; priority?: string; search?: string }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.priority) q.set('priority', params.priority)
      if (params?.search) q.set('search', params.search)
      return apiClient.get<{ workOrders: unknown[] }>(`/api/workshop/orders?${q.toString()}`)
    },
    getOrder: (id: string) => apiClient.get<{ workOrder: unknown }>(`/api/workshop/orders/${id}`),
    createOrder: (data: unknown) =>
      apiClient.post<{ success: boolean; workOrder: unknown }>('/api/workshop/orders', data),
    updateStep: (orderId: string, data: unknown) =>
      apiClient.patch<{ success: boolean; workOrder: unknown }>(`/api/workshop/orders/${orderId}/steps`, data),
    recordQC: (data: unknown) =>
      apiClient.post<{ success: boolean; qualityCheck: unknown }>('/api/workshop/qc', data),
    getWastage: () => apiClient.get<{ wastages: unknown[] }>('/api/workshop/wastage'),
    getWorkflows: () => apiClient.get<{ workflows: unknown[] }>('/api/workshop/workflows'),
  },

  // Suppliers & Purchases
  suppliers: {
    list: () => apiClient.get<{ suppliers: unknown[] }>('/api/suppliers'),
    create: (data: unknown) => apiClient.post<{ success: boolean; supplier: unknown }>('/api/suppliers', data),
    getStatement: (id: string) => apiClient.get<{ statement: unknown }>(`/api/suppliers/${id}/statement`),
  },
  purchases: {
    list: () => apiClient.get<{ purchases: unknown[] }>('/api/procurement/purchases'),
    create: (data: unknown) =>
      apiClient.post<{ success: boolean; purchase: unknown }>('/api/procurement/purchases', data),
    cancel: (id: string, reason: string) =>
      apiClient.post<{ success: boolean; purchase: unknown }>(`/api/procurement/purchases/${id}/cancel`, {
        cancelReason: reason,
      }),
  },

  // Exchanges
  exchanges: {
    list: () => apiClient.get<{ exchanges: unknown[] }>('/api/exchanges'),
    create: (data: unknown) => apiClient.post<{ success: boolean; exchange: unknown }>('/api/exchanges', data),
  },

  // Customers
  customers: {
    list: (params?: { search?: string; withDues?: boolean }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.withDues) q.set('withDues', 'true')
      return apiClient.get<{ customers: unknown[] }>(`/api/customers?${q.toString()}`)
    },
    create: (data: unknown) => apiClient.post<{ success: boolean; customer: unknown }>('/api/customers', data),
    getStatement: (id: string) => apiClient.get<{ customer: unknown; sales: unknown[]; payments: unknown[] }>(`/api/customers/${id}`),
    update: (id: string, data: unknown) =>
      apiClient.patch<{ success: boolean; customer: unknown }>(`/api/customers/${id}`, data),
  },

  // Reports, Logs & Settings
  reports: {
    getOverview: (params?: { startDate?: string; endDate?: string }) => {
      const q = new URLSearchParams()
      if (params?.startDate) q.set('startDate', params.startDate)
      if (params?.endDate) q.set('endDate', params.endDate)
      return apiClient.get<{ overview: unknown }>(`/api/reports/overview?${q.toString()}`)
    },
  },
  auditLogs: {
    list: (params?: { search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return apiClient.get<{ auditLogs: unknown[]; pagination: { totalCount: number; totalPages: number } }>(
        `/api/audit-logs?${q.toString()}`
      )
    },
  },
  notifications: {
    list: () => apiClient.get<{ notifications: unknown[] }>('/api/notifications'),
    markRead: (id: string) => apiClient.patch<{ success: boolean }>(`/api/notifications/${id}/read`),
  },
  settings: {
    get: () => apiClient.get<{ settings: unknown }>('/api/settings'),
    update: (data: unknown) => apiClient.patch<{ success: boolean; settings: unknown }>('/api/settings', data),
  },
  masters: {
    purities: () => apiClient.get<{ purities: unknown[] }>('/api/masters/purities'),
    categories: () => apiClient.get<{ categories: unknown[] }>('/api/masters/categories'),
    statuses: () => apiClient.get<{ statuses: unknown[] }>('/api/masters/statuses'),
  },
  users: {
    list: () => apiClient.get<{ users: unknown[] }>('/api/users'),
    create: (data: unknown) => apiClient.post<{ success: boolean; user: unknown }>('/api/users', data),
    update: (id: string, data: unknown) => apiClient.patch<{ success: boolean; user: unknown }>(`/api/users/${id}`, data),
    deactivate: (id: string) => apiClient.delete<{ success: boolean }>(`/api/users/${id}`),
  },
}
