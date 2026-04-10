import { Request, Response } from 'express';
import pool from '../config/database';

const SYNC_TABLES = [
  'users',
  'categories',
  'suppliers',
  'products',
  'inventory_transactions',
  'sales',
  'sale_items',
] as const;

type SyncTable = (typeof SYNC_TABLES)[number];
type SyncOp = 'upsert' | 'delete';

type PushChange = {
  table: SyncTable;
  op: SyncOp;
  data: Record<string, any>;
};

const TABLE_COLUMNS: Record<SyncTable, string[]> = {
  users: ['id', 'email', 'password_hash', 'first_name', 'last_name', 'role', 'is_active'],
  categories: ['id', 'name', 'description', 'created_at'],
  suppliers: [
    'id',
    'name',
    'contact_person',
    'email',
    'phone',
    'address',
    'created_at',
  ],
  products: [
    'id',
    'sku',
    'name',
    'description',
    'category_id',
    'supplier_id',
    'unit_price',
    'reorder_level',
    'unit_of_measure',
    'created_at',
  ],
  inventory_transactions: [
    'id',
    'product_id',
    'transaction_type',
    'quantity',
    'user_id',
    'notes',
    'created_at',
  ],
  sales: [
    'id',
    'cashier_id',
    'total_amount',
    'cash_tendered',
    'change_amount',
    'payment_method',
    'created_at',
  ],
  sale_items: [
    'id',
    'sale_id',
    'product_id',
    'product_name',
    'unit_of_measure',
    'unit_price',
    'quantity',
    'subtotal',
  ],
};

const SAFE_WRITE_COLUMNS = new Set([
  ...Object.values(TABLE_COLUMNS).flat(),
  'is_deleted',
  'deleted_at',
]);

function normalizeTables(raw: unknown): SyncTable[] {
  if (!raw) return [...SYNC_TABLES];
  if (typeof raw !== 'string') return [...SYNC_TABLES];
  const requested = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as SyncTable[];
  const valid = requested.filter((t) => (SYNC_TABLES as readonly string[]).includes(t));
  return valid.length > 0 ? valid : [...SYNC_TABLES];
}

export async function pullChanges(req: Request, res: Response) {
  try {
    const tenantId = String(req.query.tenant_id || '').trim();
    if (!tenantId) {
      return res.status(400).json({ error: 'tenant_id is required' });
    }

    const cursor = Number(req.query.cursor ?? 0);
    const limitRaw = Number(req.query.limit ?? 500);
    const limit = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(2000, Math.floor(limitRaw)))
      : 500;
    const tables = normalizeTables(req.query.tables);

    const changes: Record<string, any[]> = {};
    let maxVersion = Number.isFinite(cursor) ? cursor : 0;
    let hasMore = false;

    for (const table of tables) {
      const q = `
        SELECT *
        FROM ${table}
        WHERE tenant_id = $1
          AND version > $2
        ORDER BY version ASC
        LIMIT $3
      `;
      const result = await pool.query(q, [tenantId, maxVersion, limit]);
      changes[table] = result.rows;

      if (result.rows.length === limit) {
        hasMore = true;
      }

      for (const row of result.rows) {
        const rowVersion = Number(row.version || 0);
        if (rowVersion > maxVersion) maxVersion = rowVersion;
      }
    }

    res.status(200).json({
      tenant_id: tenantId,
      cursor,
      next_cursor: maxVersion,
      has_more: hasMore,
      changes,
    });
  } catch (error) {
    console.error('pullChanges error:', error);
    res.status(500).json({ error: 'Failed to pull sync changes' });
  }
}

export async function pushChanges(req: Request, res: Response) {
  const client = await pool.connect();
  try {
    const tenantId = String(req.body?.tenant_id || '').trim();
    const changes = (req.body?.changes || []) as PushChange[];

    if (!tenantId) {
      return res.status(400).json({ error: 'tenant_id is required' });
    }
    if (!Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ error: 'changes array is required' });
    }

    await client.query('BEGIN');

    const applied: { table: string; op: string; id: number | null }[] = [];

    for (const change of changes) {
      if (!SYNC_TABLES.includes(change.table)) {
        throw new Error(`Unsupported table: ${change.table}`);
      }
      if (!['upsert', 'delete'].includes(change.op)) {
        throw new Error(`Unsupported operation: ${change.op}`);
      }

      const table = change.table;
      const data = change.data || {};
      const id = data.id ? Number(data.id) : null;

      if (change.op === 'delete') {
        if (!id) throw new Error(`Delete requires numeric id for table ${table}`);
        await client.query(
          `UPDATE ${table}
           SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND tenant_id = $2`,
          [id, tenantId],
        );
        applied.push({ table, op: 'delete', id });
        continue;
      }

      const allowedForTable = new Set(TABLE_COLUMNS[table]);
      const writableEntries = Object.entries(data).filter(
        ([key]) =>
          SAFE_WRITE_COLUMNS.has(key) &&
          allowedForTable.has(key) &&
          key !== 'tenant_id' &&
          key !== 'version' &&
          key !== 'updated_at',
      );

      if (writableEntries.length === 0) {
        throw new Error(`No writable fields provided for table ${table}`);
      }

      const updateEntries = writableEntries.filter(([key]) => key !== 'id');
      if (id) {
        const setSql = updateEntries
          .map(([key], idx) => `${key} = $${idx + 1}`)
          .join(', ');
        const values = updateEntries.map(([, value]) => value);
        const updateResult = await client.query(
          `UPDATE ${table}
           SET ${setSql}
           WHERE id = $${values.length + 1} AND tenant_id = $${values.length + 2}
           RETURNING id`,
          [...values, id, tenantId],
        );

        if (updateResult.rowCount && updateResult.rowCount > 0) {
          applied.push({ table, op: 'upsert', id });
          continue;
        }
      }

      const insertEntries = writableEntries.filter(([key]) => key !== 'id');
      const columns = ['tenant_id', ...insertEntries.map(([key]) => key)];
      const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
      const values = [tenantId, ...insertEntries.map(([, value]) => value)];

      const insertResult = await client.query(
        `INSERT INTO ${table} (${columns.join(', ')})
         VALUES (${placeholders})
         RETURNING id`,
        values,
      );
      applied.push({ table, op: 'upsert', id: insertResult.rows[0]?.id ?? null });
    }

    await client.query('COMMIT');

    const cursorResult = await pool.query(
      `
      SELECT COALESCE(MAX(v), 0) AS cursor
      FROM (
        SELECT MAX(version) AS v FROM users WHERE tenant_id = $1
        UNION ALL
        SELECT MAX(version) AS v FROM categories WHERE tenant_id = $1
        UNION ALL
        SELECT MAX(version) AS v FROM suppliers WHERE tenant_id = $1
        UNION ALL
        SELECT MAX(version) AS v FROM products WHERE tenant_id = $1
        UNION ALL
        SELECT MAX(version) AS v FROM inventory_transactions WHERE tenant_id = $1
        UNION ALL
        SELECT MAX(version) AS v FROM sales WHERE tenant_id = $1
        UNION ALL
        SELECT MAX(version) AS v FROM sale_items WHERE tenant_id = $1
      ) versions
      `,
      [tenantId],
    );

    res.status(200).json({
      tenant_id: tenantId,
      applied_count: applied.length,
      applied,
      next_cursor: Number(cursorResult.rows[0]?.cursor || 0),
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('pushChanges error:', error);
    res.status(500).json({
      error: 'Failed to push sync changes',
      details: error?.message || 'Unknown push error',
    });
  } finally {
    client.release();
  }
}
