-- Migration: 005_add_sync_metadata.sql
--
-- Adds tenant + sync metadata for local-first replication:
-- - tenant_id: multi-tenant partition key
-- - version: global monotonic sync cursor
-- - is_deleted/deleted_at: tombstones for soft deletes
-- - updated_at: deterministic last-write timestamp
--
-- This migration is written to be idempotent and safe to re-run.

BEGIN;

-- 1) Extensions + global version sequence
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SEQUENCE IF NOT EXISTS global_sync_version_seq
  AS BIGINT
  START WITH 1
  INCREMENT BY 1;

-- 2) Trigger function (defensive: only assigns columns if present)
CREATE OR REPLACE FUNCTION sync_version_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
      AND table_name = TG_TABLE_NAME
      AND column_name = 'version'
  ) THEN
    NEW.version := nextval('global_sync_version_seq');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
      AND table_name = TG_TABLE_NAME
      AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at := CURRENT_TIMESTAMP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  default_tenant_id UUID := '00000000-0000-0000-0000-000000000000';
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
    -- Skip cleanly if table is not present in a partial environment.
    IF to_regclass(t) IS NULL THEN
      RAISE NOTICE 'Skipping missing table: %', t;
      CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT %L::uuid',
      t, default_tenant_id
    );

    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT nextval(''global_sync_version_seq'')',
      t
    );

    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE',
      t
    );

    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP',
      t
    );

    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
      t
    );

    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_sync ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_sync BEFORE INSERT OR UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION sync_version_trigger()',
      t, t
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%I_tenant_version ON %I (tenant_id, version)',
      t, t
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%I_tenant_not_deleted ON %I (tenant_id, is_deleted)',
      t, t
    );
  END LOOP;
END $$;

COMMIT;
