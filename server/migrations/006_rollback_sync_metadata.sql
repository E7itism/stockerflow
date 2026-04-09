-- Migration: 006_rollback_sync_metadata.sql
--
-- Rollback for 005_add_sync_metadata.sql.
-- WARNING: This removes sync metadata columns and indexes.
-- Run only if you intentionally want to revert local-first sync scaffolding.

BEGIN;

DO $$
DECLARE
  t TEXT;
  target_tables TEXT[] := ARRAY[
    'users',
    'categories',
    'suppliers',
    'products',
    'inventory_transactions',
    'sales',
    'sale_items'
  ];
BEGIN
  FOREACH t IN ARRAY target_tables LOOP
    IF to_regclass(t) IS NULL THEN
      RAISE NOTICE 'Skipping missing table: %', t;
      CONTINUE;
    END IF;

    -- Remove triggers created by 005
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_sync ON %I', t, t);

    -- Remove indexes created by 005
    EXECUTE format('DROP INDEX IF EXISTS idx_%I_tenant_version', t);
    EXECUTE format('DROP INDEX IF EXISTS idx_%I_tenant_not_deleted', t);

    -- Remove added columns (in dependency-safe order)
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS deleted_at', t);
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS is_deleted', t);
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS version', t);
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS tenant_id', t);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS sync_version_trigger();
DROP SEQUENCE IF EXISTS global_sync_version_seq;

COMMIT;
