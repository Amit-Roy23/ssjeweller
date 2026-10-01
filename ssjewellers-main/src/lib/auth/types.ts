import { UserRole } from '@prisma/client'

export interface AuthSessionUser {
  id: string
  username: string
  name: string
  email: string | null
  phone: string
  role: UserRole
  specialty?: string | null
  mustChangePassword: boolean
}

export interface SessionPayload {
  sub: string // User ID
  username: string
  name: string
  role: UserRole
  email?: string | null
  phone: string
  mustChangePassword: boolean
  iat?: number
  exp?: number
}

export type Permission =
  // User & System Management
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'settings:read'
  | 'settings:update'
  | 'audit:read'

  // Master Data
  | 'masters:read'
  | 'masters:write'

  // Raw Materials & Finished Inventory
  | 'inventory:read'
  | 'inventory:write'
  | 'inventory:adjust'
  | 'inventory:view_costs'

  // Sales & Invoicing
  | 'sales:read'
  | 'sales:create'
  | 'sales:cancel'
  | 'sales:discount'
  | 'sales:reports'

  // Old Gold & Exchanges
  | 'exchanges:read'
  | 'exchanges:create'
  | 'exchanges:cancel'

  // Purchases & Suppliers
  | 'purchases:read'
  | 'purchases:create'
  | 'purchases:cancel'
  | 'suppliers:read'
  | 'suppliers:write'

  // Customers & Payments
  | 'customers:read'
  | 'customers:write'
  | 'payments:read'
  | 'payments:create'
  | 'payments:cancel'

  // Workshop & Karigar Production
  | 'workshop:read'
  | 'workshop:create'
  | 'workshop:assign'
  | 'workshop:update_step'
  | 'workshop:qc'
  | 'workshop:rework'
  | 'workshop:wastage_entry'

  // Reports
  | 'reports:financial'
  | 'reports:operational'
  | 'reports:export'
