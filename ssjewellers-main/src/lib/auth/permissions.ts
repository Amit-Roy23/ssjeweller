import { UserRole } from '@prisma/client'
import { Permission } from './types'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'settings:read',
    'settings:update',
    'audit:read',
    'masters:read',
    'masters:write',
    'inventory:read',
    'inventory:write',
    'inventory:adjust',
    'inventory:view_costs',
    'sales:read',
    'sales:create',
    'sales:cancel',
    'sales:discount',
    'sales:reports',
    'exchanges:read',
    'exchanges:create',
    'exchanges:cancel',
    'purchases:read',
    'purchases:create',
    'purchases:cancel',
    'suppliers:read',
    'suppliers:write',
    'customers:read',
    'customers:write',
    'payments:read',
    'payments:create',
    'payments:cancel',
    'workshop:read',
    'workshop:create',
    'workshop:assign',
    'workshop:update_step',
    'workshop:qc',
    'workshop:rework',
    'workshop:wastage_entry',
    'reports:financial',
    'reports:operational',
    'reports:export',
  ],

  MANAGER: [
    'settings:read',
    'audit:read',
    'masters:read',
    'masters:write',
    'inventory:read',
    'inventory:write',
    'inventory:adjust',
    'inventory:view_costs',
    'sales:read',
    'sales:create',
    'sales:cancel',
    'sales:discount',
    'sales:reports',
    'exchanges:read',
    'exchanges:create',
    'exchanges:cancel',
    'purchases:read',
    'purchases:create',
    'purchases:cancel',
    'suppliers:read',
    'suppliers:write',
    'customers:read',
    'customers:write',
    'payments:read',
    'payments:create',
    'payments:cancel',
    'workshop:read',
    'workshop:create',
    'workshop:assign',
    'workshop:update_step',
    'workshop:qc',
    'workshop:rework',
    'workshop:wastage_entry',
    'reports:financial',
    'reports:operational',
    'reports:export',
  ],

  STAFF: [
    'masters:read',
    'inventory:read',
    'sales:read',
    'sales:create',
    'exchanges:read',
    'exchanges:create',
    'customers:read',
    'customers:write',
    'payments:read',
    'payments:create',
    'workshop:read',
    'workshop:update_step',
    'workshop:wastage_entry',
    'reports:operational',
  ],
}

/**
 * Checks if a given role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  return permissions ? permissions.includes(permission) : false
}

/**
 * Checks if a given role has all specified permissions.
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

/**
 * Checks if a given role has any of the specified permissions.
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}
