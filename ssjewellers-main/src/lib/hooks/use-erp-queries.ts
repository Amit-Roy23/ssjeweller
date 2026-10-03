'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// ===== Query Keys =====
export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  sales: (params?: unknown) => ['sales', params] as const,
  sale: (id: string) => ['sales', id] as const,
  returns: () => ['sales', 'returns'] as const,
  goldStock: (params?: unknown) => ['inventory', 'gold', params] as const,
  stones: () => ['inventory', 'stones'] as const,
  products: (params?: unknown) => ['inventory', 'products', params] as const,
  product: (id: string) => ['inventory', 'products', id] as const,
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

// ===== Auth Hooks =====
export function useAuthMe() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: apiClient.auth.me,
    retry: false,
    staleTime: 1000 * 60,
  })
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
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
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
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
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
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
  })
}

export function useSalesReturns() {
  return useQuery({
    queryKey: queryKeys.returns(),
    queryFn: apiClient.sales.returns.list,
  })
}

export function useCreateSalesReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.sales.returns.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
  })
}

// ===== Inventory Hooks =====
export function useGoldStock(params?: { status?: string; metal?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.goldStock(params),
    queryFn: () => apiClient.inventory.getGold(params),
  })
}

export function useAddGoldStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.inventory.addGold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
  })
}

export function useUpdateGoldStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.inventory.updateGold(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useDeleteGoldStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.inventory.deleteGold(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
    },
  })
}

export function useIssueGold() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.inventory.issueGold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
  })
}

export function useStones(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['inventory', 'stones', params],
    queryFn: () => apiClient.inventory.getStones(params),
  })
}

export function useAddStone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.inventory.addStone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
    },
  })
}

export function useUpdateStone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.inventory.updateStone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
    },
  })
}

export function useDeleteStone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.inventory.deleteStone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useIssueStones() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.inventory.issueStones,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
    },
  })
}

export function useProducts(params?: { search?: string; categoryId?: string; inStock?: boolean; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => apiClient.inventory.getProducts(params),
  })
}

export function useAddProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.inventory.addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.inventory.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.inventory.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
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
export function useWorkOrders(params?: { status?: string; priority?: string; search?: string; page?: number; limit?: number }) {
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
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
  })
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.workshop.updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.workshop.deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useUpdateWorkStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: any }) =>
      apiClient.workshop.updateStep(orderId, data),
    onMutate: async ({ orderId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['workshop', 'orders'] })

      const previousOrders = queryClient.getQueryData(['workshop', 'orders'])
      const previousDetail = queryClient.getQueryData(queryKeys.workOrder(orderId))

      // Optimistic update in list cache
      queryClient.setQueriesData({ queryKey: ['workshop', 'orders'] }, (old: any) => {
        if (!old || !old.workOrders) return old
        return {
          ...old,
          workOrders: old.workOrders.map((wo: any) => {
            if (wo.id !== orderId) return wo
            const newSteps = (wo.steps || []).map((s: any, idx: number) => {
              if (idx !== data.stepIndex) return s
              return {
                ...s,
                status: data.status,
                outputWeightMg: data.outputWeightMg ?? s.outputWeightMg,
                remarks: data.remarks ?? s.remarks,
              }
            })
            return {
              ...wo,
              steps: newSteps,
              status: data.status === 'COMPLETED' ? (data.stepIndex + 1 >= newSteps.length ? 'COMPLETED' : 'IN_PROGRESS') : wo.status,
            }
          }),
        }
      })

      return { previousOrders, previousDetail, orderId }
    },
    onError: (err, _vars, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['workshop', 'orders'], context.previousOrders)
      }
      if (context?.previousDetail && context?.orderId) {
        queryClient.setQueryData(queryKeys.workOrder(context.orderId), context.previousDetail)
      }
    },
    onSuccess: (res, { orderId }) => {
      if (res?.workOrder) {
        queryClient.setQueryData(queryKeys.workOrder(orderId), { workOrder: res.workOrder })
        queryClient.setQueriesData({ queryKey: ['workshop', 'orders'] }, (old: any) => {
          if (!old || !old.workOrders) return old
          return {
            ...old,
            workOrders: old.workOrders.map((wo: any) => (wo.id === orderId ? res.workOrder : wo)),
          }
        })
      }
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
  })
}

export function useRecordQC() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.workshop.recordQC,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useWastageRecords() {
  return useQuery({
    queryKey: queryKeys.wastages(),
    queryFn: apiClient.workshop.getWastage,
  })
}

export function useRecordWastage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.workshop.recordWastage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useWorkflows() {
  return useQuery({
    queryKey: queryKeys.workflows(),
    queryFn: apiClient.workshop.getWorkflows,
  })
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.workshop.createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop', 'workflows'] })
    },
  })
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.workshop.updateWorkflow(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop', 'workflows'] })
    },
  })
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.workshop.deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop', 'workflows'] })
    },
  })
}

// ===== Customers & Suppliers =====
export function useCustomers(params?: { search?: string; withDues?: boolean; page?: number; limit?: number }) {
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
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.customers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.customers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useSuppliers(params?: { search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => apiClient.suppliers.list(params),
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.suppliers.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.suppliers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.suppliers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

export function useSupplierStatement(id: string) {
  return useQuery({
    queryKey: queryKeys.supplierStatement(id),
    queryFn: () => apiClient.suppliers.getStatement(id),
    enabled: Boolean(id),
  })
}

// ===== Purchases =====
export function usePurchases(params?: { search?: string; supplierId?: string; paymentStatus?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['purchases', params],
    queryFn: () => apiClient.purchases.list(params),
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
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export function useCancelPurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.purchases.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

// ===== Exchanges =====
export function useExchanges(params?: { search?: string; type?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['exchanges', params],
    queryFn: () => apiClient.exchanges.list(params),
  })
}

export function useCreateExchange() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.exchanges.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

// ===== Reports, Logs & Settings =====
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

export function useCreateAuditLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.auditLogs.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: apiClient.notifications.list,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.notifications.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const previous = queryClient.getQueryData(['notifications'])
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old || !old.notifications) return old
        return {
          ...old,
          notifications: old.notifications.map((n: any) => (n.id === id ? { ...n, read: true } : n)),
        }
      })
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.notifications.markAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const previous = queryClient.getQueryData(['notifications'])
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old || !old.notifications) return old
        return {
          ...old,
          notifications: old.notifications.map((n: any) => ({ ...n, read: true })),
        }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings(),
    queryFn: apiClient.settings.get,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.settings.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['exchanges'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

// ===== Master Data =====
export function usePurities() {
  return useQuery({
    queryKey: queryKeys.masters.purities(),
    queryFn: apiClient.masters.purities,
  })
}

export function useCreatePurity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.masters.createPurity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters', 'purities'] })
    },
  })
}

export function useUpdatePurity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.masters.updatePurity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters', 'purities'] })
    },
  })
}

export function useDeletePurity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.masters.deletePurity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters', 'purities'] })
    },
  })
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.masters.categories(),
    queryFn: apiClient.masters.categories,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.masters.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters', 'categories'] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.masters.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters', 'categories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.masters.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters', 'categories'] })
    },
  })
}

export function useWorkStatuses() {
  return useQuery({
    queryKey: queryKeys.masters.statuses(),
    queryFn: apiClient.masters.statuses,
  })
}

export function useCreateWorkStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.masters.createStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters', 'statuses'] })
    },
  })
}

export function useUpdateWorkStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.masters.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters', 'statuses'] })
    },
  })
}

export function useDeleteWorkStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.masters.deleteStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters', 'statuses'] })
    },
  })
}

// ===== Users =====
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users(),
    queryFn: apiClient.users.list,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiClient.users.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      apiClient.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.users.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
