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

  let data: any
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`)
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

  // Auth
  auth: {
    me: () => apiClient.get<{ user: any; permissions: string[] }>('/api/auth/me'),
    login: (data: { username: string; password: string }) =>
      apiClient.post<{ success: boolean; user: any; token: string }>('/api/auth/login', data),
    logout: () => apiClient.post<{ success: boolean; message: string }>('/api/auth/logout'),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      apiClient.post<{ success: boolean; message: string; user: any }>('/api/auth/change-password', data),
    resetPassword: (data: { targetUserId: string; newPassword: string }) =>
      apiClient.post<{ success: boolean; message: string }>('/api/auth/reset-password', data),
  },

  // Sales
  sales: {
    list: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.status) q.set('status', params.status)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return apiClient.get<{ sales: any[]; pagination: { totalCount: number; totalPages: number } }>(
        `/api/sales?${q.toString()}`
      )
    },
    get: (id: string) => apiClient.get<{ sale: any }>(`/api/sales/${id}`),
    create: (data: unknown) => apiClient.post<{ success: boolean; sale: any }>('/api/sales', data),
    cancel: (id: string, reason: string) =>
      apiClient.post<{ success: boolean; sale: any }>(`/api/sales/${id}/cancel`, { cancelReason: reason }),
    recordPayment: (saleId: string, data: unknown) =>
      apiClient.post<{ success: boolean; payment: any }>(`/api/sales/${saleId}/payments`, data),
    returns: {
      list: () => apiClient.get<{ returns: any[] }>('/api/sales/returns'),
      create: (data: unknown) => apiClient.post<{ success: boolean; return: any }>('/api/sales/returns', data),
    },
  },

  // Inventory
  inventory: {
    getGold: (params?: { status?: string; metal?: string }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.metal) q.set('metal', params.metal)
      return apiClient.get<{ goldStocks: any[] }>(`/api/inventory/gold?${q.toString()}`)
    },
    addGold: (data: unknown) => apiClient.post<{ success: boolean; stock: any }>('/api/inventory/gold', data),
    updateGold: (id: string, data: unknown) =>
      apiClient.patch<{ success: boolean; stock: any }>(`/api/inventory/gold/${id}`, data),
    deleteGold: (id: string) =>
      apiClient.delete<{ success: boolean; message: string }>(`/api/inventory/gold/${id}`),
    issueGold: (data: { goldStockId: string; workId: string }) =>
      apiClient.post<{ success: boolean; goldStock: any }>('/api/inventory/gold/issue', data),
    getStones: (params?: { search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return apiClient.get<{ stones: any[]; pagination?: any }>(`/api/inventory/stones?${q.toString()}`)
    },
    addStone: (data: unknown) => apiClient.post<{ success: boolean; stone: any }>('/api/inventory/stones', data),
    updateStone: (id: string, data: unknown) =>
      apiClient.patch<{ success: boolean; stone: any }>(`/api/inventory/stones/${id}`, data),
    deleteStone: (id: string) =>
      apiClient.delete<{ success: boolean; message: string }>(`/api/inventory/stones/${id}`),
    issueStones: (data: { stoneItemId: string; quantity: number; workId: string }) =>
      apiClient.post<{ success: boolean; stoneItem: any }>('/api/inventory/stones/issue', data),
    getProducts: (params?: { search?: string; categoryId?: string; inStock?: boolean; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.categoryId) q.set('categoryId', params.categoryId)
      if (params?.inStock) q.set('inStock', 'true')
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return apiClient.get<{ products: any[]; pagination?: any }>(`/api/inventory/products?${q.toString()}`)
    },
    addProduct: (data: unknown) =>
      apiClient.post<{ success: boolean; product: any }>('/api/inventory/products', data),
    updateProduct: (id: string, data: unknown) =>
      apiClient.patch<{ success: boolean; product: any }>(`/api/inventory/products/${id}`, data),
    deleteProduct: (id: string) =>
      apiClient.delete<{ success: boolean; message: string }>(`/api/inventory/products/${id}`),
    getMovements: (params?: { itemType?: string; itemId?: string }) => {
      const q = new URLSearchParams()
      if (params?.itemType) q.set('itemType', params.itemType)
      if (params?.itemId) q.set('itemId', params.itemId)
      return apiClient.get<{ movements: any[] }>(`/api/inventory/movements?${q.toString()}`)
    },
    adjustStock: (data: unknown) =>
      apiClient.post<{ success: boolean; adjustment: any }>('/api/inventory/adjustments', data),
    getSummary: () => apiClient.get<{ summary: any }>('/api/inventory/summary'),
  },

  // Workshop
  workshop: {
    getOrders: (params?: { status?: string; priority?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.priority) q.set('priority', params.priority)
      if (params?.search) q.set('search', params.search)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return apiClient.get<{ workOrders: any[]; pagination?: any }>(`/api/workshop/orders?${q.toString()}`)
    },
    getOrder: (id: string) => apiClient.get<{ workOrder: any }>(`/api/workshop/orders/${id}`),
    createOrder: (data: unknown) =>
      apiClient.post<{ success: boolean; workOrder: any }>('/api/workshop/orders', data),
    updateOrder: (id: string, data: unknown) =>
      apiClient.patch<{ success: boolean; workOrder: any }>(`/api/workshop/orders/${id}`, data),
    deleteOrder: (id: string) =>
      apiClient.delete<{ success: boolean; message: string }>(`/api/workshop/orders/${id}`),
    updateStep: (orderId: string, data: unknown) =>
      apiClient.patch<{ success: boolean; workOrder: any }>(`/api/workshop/orders/${orderId}/steps`, data),
    recordQC: (data: unknown) =>
      apiClient.post<{ success: boolean; qualityCheck: any }>('/api/workshop/qc', data),
    getWastage: () => apiClient.get<{ wastages: any[] }>('/api/workshop/wastage'),
    recordWastage: (data: unknown) =>
      apiClient.post<{ success: boolean; wastageRecord: any }>('/api/workshop/wastage', data),
    getWorkflows: () => apiClient.get<{ workflows: any[] }>('/api/workshop/workflows'),
    createWorkflow: (data: unknown) =>
      apiClient.post<{ success: boolean; workflow: any }>('/api/workshop/workflows', data),
    updateWorkflow: (id: string, data: unknown) =>
      apiClient.patch<{ success: boolean; workflow: any }>(`/api/workshop/workflows/${id}`, data),
    deleteWorkflow: (id: string) =>
      apiClient.delete<{ success: boolean; message: string }>(`/api/workshop/workflows/${id}`),
  },

  // Suppliers & Purchases
  suppliers: {
    list: (params?: { search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return apiClient.get<{ suppliers: any[]; pagination?: any }>(`/api/suppliers?${q.toString()}`)
    },
    create: (data: unknown) => apiClient.post<{ success: boolean; supplier: any }>('/api/suppliers', data),
    update: (id: string, data: unknown) =>
      apiClient.patch<{ success: boolean; supplier: any }>(`/api/suppliers/${id}`, data),
    delete: (id: string) =>
      apiClient.delete<{ success: boolean; message: string }>(`/api/suppliers/${id}`),
    getStatement: (id: string) => apiClient.get<{ statement: any }>(`/api/suppliers/${id}/statement`),
  },
  purchases: {
    list: (params?: { search?: string; supplierId?: string; paymentStatus?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.supplierId) q.set('supplierId', params.supplierId)
      if (params?.paymentStatus) q.set('paymentStatus', params.paymentStatus)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return apiClient.get<{ purchases: any[]; pagination?: any }>(`/api/procurement/purchases?${q.toString()}`)
    },
    create: (data: unknown) =>
      apiClient.post<{ success: boolean; purchase: any }>('/api/procurement/purchases', data),
    cancel: (id: string, reason: string) =>
      apiClient.post<{ success: boolean; purchase: any }>(`/api/procurement/purchases/${id}/cancel`, {
        cancelReason: reason,
      }),
  },

  // Exchanges
  exchanges: {
    list: (params?: { search?: string; type?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.type) q.set('type', params.type)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return apiClient.get<{ exchanges: any[]; pagination?: any }>(`/api/exchanges?${q.toString()}`)
    },
    create: (data: unknown) => apiClient.post<{ success: boolean; exchange: any }>('/api/exchanges', data),
  },

  // Customers
  customers: {
    list: (params?: { search?: string; withDues?: boolean }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.withDues) q.set('withDues', 'true')
      return apiClient.get<{ customers: any[] }>(`/api/customers?${q.toString()}`)
    },
    create: (data: unknown) => apiClient.post<{ success: boolean; customer: any }>('/api/customers', data),
    getStatement: (id: string) => apiClient.get<{ customer: any; sales: any[]; payments: any[] }>(`/api/customers/${id}`),
    update: (id: string, data: unknown) =>
      apiClient.patch<{ success: boolean; customer: any }>(`/api/customers/${id}`, data),
    delete: (id: string) =>
      apiClient.delete<{ success: boolean; message: string }>(`/api/customers/${id}`),
  },

  // Reports, Logs & Settings
  reports: {
    getOverview: (params?: { startDate?: string; endDate?: string }) => {
      const q = new URLSearchParams()
      if (params?.startDate) q.set('startDate', params.startDate)
      if (params?.endDate) q.set('endDate', params.endDate)
      return apiClient.get<{ overview: any }>(`/api/reports/overview?${q.toString()}`)
    },
  },
  auditLogs: {
    list: (params?: { search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return apiClient.get<{ auditLogs: any[]; pagination: { totalCount: number; totalPages: number } }>(
        `/api/audit-logs?${q.toString()}`
      )
    },
    create: (data: unknown) => apiClient.post<{ success: boolean; auditLog: any }>('/api/audit-logs', data),
  },
  notifications: {
    list: () => apiClient.get<{ notifications: any[] }>('/api/notifications'),
    create: (data: unknown) => apiClient.post<{ success: boolean; notification: any }>('/api/notifications', data),
    markRead: (id: string) => apiClient.patch<{ success: boolean }>(`/api/notifications/${id}/read`),
    markAllRead: () => apiClient.post<{ success: boolean }>('/api/notifications/read-all'),
  },
  settings: {
    get: () => apiClient.get<{ settings: any }>('/api/settings'),
    update: (data: unknown) => apiClient.patch<{ success: boolean; settings: any }>('/api/settings', data),
  },
  masters: {
    purities: () => apiClient.get<{ purities: any[] }>('/api/masters/purities'),
    createPurity: (data: unknown) => apiClient.post<{ success: boolean; purity: any }>('/api/masters/purities', data),
    updatePurity: (id: string, data: unknown) => apiClient.patch<{ success: boolean; purity: any }>(`/api/masters/purities/${id}`, data),
    deletePurity: (id: string) => apiClient.delete<{ success: boolean; message: string }>(`/api/masters/purities/${id}`),

    categories: () => apiClient.get<{ categories: any[] }>('/api/masters/categories'),
    createCategory: (data: unknown) => apiClient.post<{ success: boolean; category: any }>('/api/masters/categories', data),
    updateCategory: (id: string, data: unknown) => apiClient.patch<{ success: boolean; category: any }>(`/api/masters/categories/${id}`, data),
    deleteCategory: (id: string) => apiClient.delete<{ success: boolean; message: string }>(`/api/masters/categories/${id}`),

    statuses: () => apiClient.get<{ statuses: any[] }>('/api/masters/statuses'),
    createStatus: (data: unknown) => apiClient.post<{ success: boolean; status: any }>('/api/masters/statuses', data),
    updateStatus: (id: string, data: unknown) => apiClient.patch<{ success: boolean; status: any }>(`/api/masters/statuses/${id}`, data),
    deleteStatus: (id: string) => apiClient.delete<{ success: boolean; message: string }>(`/api/masters/statuses/${id}`),
  },
  users: {
    list: () => apiClient.get<{ users: any[] }>('/api/users'),
    create: (data: unknown) => apiClient.post<{ success: boolean; user: any }>('/api/users', data),
    update: (id: string, data: unknown) => apiClient.patch<{ success: boolean; user: any }>(`/api/users/${id}`, data),
    deactivate: (id: string) => apiClient.delete<{ success: boolean }>(`/api/users/${id}`),
  },
}
