/**
 * useRole.ts
 *
 * Custom hook that provides role-checking utilities to any component.
 *
 * WHY a custom hook instead of reading user.role directly everywhere?
 * Two reasons:
 * 1. Centralizes role logic — if roles ever change, update here only
 * 2. Gives readable helper methods (isAdmin, canEdit) instead of
 *    scattered string comparisons like user?.role === 'admin' everywhere
 *
 * USAGE:
 *   const { isAdmin, canEdit, canDelete, hasRole } = useRole();
 *   {canDelete && <button>Delete</button>}
 *   {hasRole('admin', 'manager') && <AdminPanel />}
 */

import { useAuth } from '../context/AuthContext';

export const useRole = () => {
  const { user } = useAuth();
  const role = user?.role;

  /**
   * hasRole — checks if current user has any of the provided roles.
   *
   * WHY accept multiple roles?
   * Most checks aren't "is this exact role" but "is this one of these roles".
   * hasRole('admin', 'manager') is cleaner than
   * role === 'admin' || role === 'manager' repeated everywhere.
   */
  const hasRole = (...roles: string[]): boolean => {
    if (!role) return false;
    return roles.includes(role);
  };

  return {
    role,

    // Convenience booleans for the most common checks
    isAdmin: hasRole('admin'),
    isManager: hasRole('manager'),
    isStaff: hasRole('staff'),

    /**
     * canEdit — admin and manager can add/edit records.
     * Staff can view but not modify product catalog.
     */
    canEdit: hasRole('admin', 'manager'),

    /**
     * canDelete — admin only.
     * Destructive actions are restricted to the highest role
     * to prevent accidental or unauthorized data loss.
     */
    canDelete: hasRole('admin'),

    /**
     * canViewReports — admin and manager only.
     * Revenue data is sensitive — staff don't need to see it.
     */
    canViewReports: hasRole('admin', 'manager'),

    /**
     * canManageUsers — admin only.
     * Creating/deactivating accounts is the highest privilege.
     */
    canManageUsers: hasRole('admin'),

    // Generic checker for custom cases
    hasRole,
  };
};
