-- Migration: 003_add_user_management.sql
--
-- WHY is_active instead of deleting users?
-- Deleting a user record would orphan all their related data:
--   - inventory_transactions (user_id)
--   - sales (cashier_id)
-- Their historical records would lose their author reference.
-- Soft delete (is_active = false) preserves the audit trail while
-- preventing the account from being used.
--
-- WHY default TRUE?
-- All existing users are active. New users should be active by default.
-- An admin explicitly deactivates accounts — they should never be
-- deactivated accidentally on creation.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Add a comment to the column for future developers
COMMENT ON COLUMN users.is_active IS
  'Soft delete flag. FALSE = account deactivated by admin. User data is preserved for audit trail.';