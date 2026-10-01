'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// ===== Query Keys =====
export const queryKeys = {
  sales: (params?: unknown) => ['sales', params] as const,
  sale: (id: string) => ['sales', id] as const,
  returns: () => ['sales', 'returns'] as const,
  goldStock: (params?: unknown) => ['inventory', 'gold', params] as const,
  stones: () => ['inventory', 'stones'] as const,
  products: (params?: unknown) => ['inventory', 'products', params] as const,
  movements: (params?: unknown) => ['inventory', 'movements', params] as const,
  inventorySummary: () => ['inventory', 'summary'] as const,
  workOrders: (params?: unknown) => ['workshop', 'orders', params] as const,
  workOrder: (id: string) => ['workshop', 'orders', id] as const,
  wastages: () => ['workshop', 'wastages'] as const,
  workflows: () => ['workshop', 'workflows'] as const,
  suppliers: () => ['suppliers'] as const,
  supplierStatement: (id: string) => ['suppliers', id, 'statement'] as const,
  purchases: () => ['purchases'] as const,
  exchanges: () => ['exchanges'] as const,
  customers: (params?: unknown) => ['customers', params] as const,
  customerStatement: (id: string) => ['customers', id, 'statement'] as const,
  financialOverview: (params?: unknown) => ['reports', 'overview', params] as const,
  auditLogs: (params?: unknown) => ['audit-logs', params] as const,
  notifications: () => ['notifications'] as const,
  settings: () => ['settings'] as const,
  users: () => ['users'] as const,
  masters: {
    purities: () => ['masters', 'purities'] as const,
    categories: () => ['masters', 'categories'] as const,
    statuses: () => ['masters', 'statuses'] as const,
  },
}

// ===== Sales Hooks =====
export function useSales(params?: { search?: string; status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.sales(params),
    queryFn: () => apiClient.sales.list(params),
  })
}

export function useSaleDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.sale(id),
    queryFn: () => apiClient.sales.get(id),
    enabled: Boolean(id),
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.sales.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useCancelSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => apiClient.sales.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useRecordPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ saleId, data }: { saleId: string; data: unknown }) =>
      apiClient.sales.recordPayment(saleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

// ===== Inventory Hooks =====
export function useGoldStock(params?: { status?: string; metal?: string }) {
  return useQuery({
    queryKey: queryKeys.goldStock(params),
    queryFn: () => apiClient.inventory.getGold(params),
  })
}

export function useStones() {
  return useQuery({
    queryKey: queryKeys.stones(),
    queryFn: apiClient.inventory.getStones,
  })
}

export function useProducts(params?: { search?: string; categoryId?: string; inStock?: boolean }) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => apiClient.inventory.getProducts(params),
  })
}

export function useMovements(params?: { itemType?: string; itemId?: string }) {
  return useQuery({
    queryKey: queryKeys.movements(params),
    queryFn: () => apiClient.inventory.getMovements(params),
  })
}

export function useInventorySummary() {
  return useQuery({
    queryKey: queryKeys.inventorySummary(),
    queryFn: apiClient.inventory.getSummary,
  })
}

export function useAddGoldStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.inventory.addGold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useAddProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.inventory.addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useAdjustStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.inventory.adjustStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
  })
}

// ===== Workshop Hooks =====
export function useWorkOrders(params?: { status?: string; priority?: string; search?: string }) {
  return useQuery({
    queryKey: queryKeys.workOrders(params),
    queryFn: () => apiClient.workshop.getOrders(params),
  })
}

export function useWorkOrderDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.workOrder(id),
    queryFn: () => apiClient.workshop.getOrder(id),
    enabled: Boolean(id),
  })
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.workshop.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useUpdateWorkStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: unknown }) =>
      apiClient.workshop.updateStep(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
    },
  })
}

export function useRecordQC() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.workshop.recordQC,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
    },
  })
}

export function useWorkflows() {
  return useQuery({
    queryKey: queryKeys.workflows(),
    queryFn: apiClient.workshop.getWorkflows,
  })
}

// ===== Customers & Suppliers =====
export function useCustomers(params?: { search?: string; withDues?: boolean }) {
  return useQuery({
    queryKey: queryKeys.customers(params),
    queryFn: () => apiClient.customers.list(params),
  })
}

export function useCustomerStatement(id: string) {
  return useQuery({
    queryKey: queryKeys.customerStatement(id),
    queryFn: () => apiClient.customers.getStatement(id),
    enabled: Boolean(id),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.customers.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useSuppliers() {
  return useQuery({
    queryKey: queryKeys.suppliers(),
    queryFn: apiClient.suppliers.list,
  })
}

export function usePurchases() {
  return useQuery({
    queryKey: queryKeys.purchases(),
    queryFn: apiClient.purchases.list,
  })
}

export function useCreatePurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.purchases.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

// ===== Exchanges =====
export function useExchanges() {
  return useQuery({
    queryKey: queryKeys.exchanges(),
    queryFn: apiClient.exchanges.list,
  })
}

export function useCreateExchange() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.exchanges.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

// ===== Reports & Settings =====
export function useFinancialOverview(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: queryKeys.financialOverview(params),
    queryFn: () => apiClient.reports.getOverview(params),
  })
}

export function useAuditLogs(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.auditLogs(params),
    queryFn: () => apiClient.auditLogs.list(params),
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: apiClient.notifications.list,
  })
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings(),
    queryFn: apiClient.settings.get,
  })
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users(),
    queryFn: apiClient.users.list,
  })
}
