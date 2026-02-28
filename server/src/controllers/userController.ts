/**
 * userController.ts
 *
 * Admin-only endpoints for managing user accounts.
 *
 * WHAT THIS HANDLES:
 * - List all users (with their active status and role)
 * - Update a user's role
 * - Deactivate / reactivate a user account
 *
 * SECURITY RULES (enforced in userRoutes.ts):
 * - All endpoints require authentication (authenticateToken)
 * - All endpoints require admin role (authorizeRole('admin'))
 * - An admin cannot deactivate or change the role of their own account
 *   (prevents accidental lockout)
 */

import { Request, Response } from 'express';
import pool from '../config/database';

const ALLOWED_ROLES = ['admin', 'manager', 'staff'];

export const userController = {
  /**
   * GET /api/users
   *
   * Returns all users ordered by creation date.
   * Password hash is intentionally excluded from the SELECT.
   */
  getAll: async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          email,
          first_name,
          last_name,
          role,
          is_active,
          created_at
        FROM users
        ORDER BY created_at ASC
      `);

      res.json({ users: result.rows });
    } catch (error) {
      console.error('[userController.getAll] Error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  /**
   * PUT /api/users/:id/role
   * Body: { role: 'admin' | 'manager' | 'staff' }
   *
   * WHY validate against ALLOWED_ROLES?
   * Without this, someone could PUT { role: 'superadmin' } and insert
   * an arbitrary string into the role column. Always whitelist valid values.
   *
   * WHY prevent self-role-change?
   * If an admin changes their own role to 'staff', they immediately lose
   * access to this page and can't undo it. Preventing self-changes
   * avoids this accidental lockout scenario.
   */
  updateRole: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !ALLOWED_ROLES.includes(role)) {
        res.status(400).json({
          error: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(', ')}`,
        });
        return;
      }

      // Prevent admin from changing their own role
      if (parseInt(id as string) === req.user?.userId) {
        res.status(400).json({ error: 'You cannot change your own role' });
        return;
      }

      const result = await pool.query(
        `UPDATE users
         SET role = $1
         WHERE id = $2
         RETURNING id, email, first_name, last_name, role, is_active`,
        [role, id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        message: 'Role updated successfully',
        user: result.rows[0],
      });
    } catch (error) {
      console.error('[userController.updateRole] Error:', error);
      res.status(500).json({ error: 'Failed to update role' });
    }
  },

  /**
   * PUT /api/users/:id/status
   * Body: { is_active: true | false }
   *
   * Toggles account active/inactive (soft delete pattern).
   *
   * WHY allow reactivation?
   * Admins make mistakes. If an account is accidentally deactivated,
   * they should be able to restore it without recreating it from scratch.
   *
   * WHY prevent self-deactivation?
   * An admin who deactivates their own account would be locked out
   * with no way to recover (unless another admin reactivates them).
   * Blocking self-deactivation prevents this scenario.
   */
  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      if (typeof is_active !== 'boolean') {
        res.status(400).json({ error: 'is_active must be a boolean' });
        return;
      }

      // Prevent admin from deactivating their own account
      if (parseInt(id as string) === req.user?.userId) {
        res
          .status(400)
          .json({ error: 'You cannot deactivate your own account' });
        return;
      }

      const result = await pool.query(
        `UPDATE users
         SET is_active = $1
         WHERE id = $2
         RETURNING id, email, first_name, last_name, role, is_active`,
        [is_active, id],
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        message: is_active ? 'User reactivated' : 'User deactivated',
        user: result.rows[0],
      });
    } catch (error) {
      console.error('[userController.updateStatus] Error:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  },
};
