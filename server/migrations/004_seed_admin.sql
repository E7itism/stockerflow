-- Migration: 004_seed_admin.sql
--
-- Creates a default admin account for production.
--
-- WHY ON CONFLICT DO NOTHING?
-- Migrations run every deploy (npm run migrate).
-- Without this, re-running would throw a duplicate email error
-- and crash the migration. ON CONFLICT makes it safe to re-run.
--
-- WHY store the hash here instead of a plain password?
-- Migrations are committed to version control.
-- Never commit plain text passwords to a repo.
-- The hash is useless without the original password.

INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'admin@demo.com',
  '$2b$10$lTmUgfkAVkOWsIfgCY8M4OeOaql7HsxCuuhH01Zwsmps4wXREFjNW',
  'Admin',
  'Tester',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;
