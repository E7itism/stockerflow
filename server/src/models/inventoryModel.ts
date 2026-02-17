/**
 * inventoryModel.ts
 *
 * Database layer for inventory transactions and stock calculations.
 *
 * Key concept: Stock is NOT stored as a single number in the database.
 * Instead, it's CALCULATED by summing all transactions for a product.
 *
 * Why calculate instead of store?
 * - Stored stock gets out of sync (race conditions, crashes mid-update)
 * - Calculated stock is always accurate — derived from source of truth
 * - Full audit trail of every movement is preserved
 * - Can rebuild the stock level from scratch at any time
 *
 * Trade-off: slightly more complex SQL queries (the CASE SUM pattern).
 */

import pool from '../config/database';

interface InventoryTransaction {
  id?: number;
  product_id: number;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  user_id: number;
  notes?: string;
  created_at?: Date;
}

interface ProductStock {
  product_id: number;
  sku: string;
  name: string;
  current_stock: number;
  reorder_level: number;
  is_low_stock: boolean;
}

class InventoryModel {
  async create(
    transaction: InventoryTransaction,
  ): Promise<InventoryTransaction> {
    const query = `
      INSERT INTO inventory_transactions 
      (product_id, transaction_type, quantity, user_id, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      transaction.product_id,
      transaction.transaction_type,
      transaction.quantity,
      transaction.user_id,
      transaction.notes || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * getCurrentStock — calculates stock by summing all transactions.
   *
   * The SQL CASE maps each transaction type to +/- quantity:
   *   'in'         → +quantity  (receiving stock)
   *   'out'        → -quantity  (selling/using stock)
   *   'adjustment' → +quantity  (manual correction)
   *
   * Example:
   *   Transaction 1: in,  qty=100  →  +100
   *   Transaction 2: out, qty=20   →   -20
   *   Transaction 3: out, qty=10   →   -10
   *   SUM = 70 → current_stock = 70
   *
   * COALESCE(..., 0): SUM of zero rows returns NULL, not 0.
   * COALESCE ensures we always return 0 for products with no transactions.
   */
  async getCurrentStock(productId: number): Promise<number> {
    const query = `
      SELECT 
        COALESCE(
          SUM(
            CASE 
              WHEN transaction_type = 'in' THEN quantity
              WHEN transaction_type = 'out' THEN -quantity
              WHEN transaction_type = 'adjustment' THEN quantity
            END
          ), 0
        ) as current_stock
      FROM inventory_transactions
      WHERE product_id = $1
    `;
    const result = await pool.query(query, [productId]);
    return parseInt(result.rows[0].current_stock) || 0;
  }

  /**
   * findAll — joins 3 tables so controllers get human-readable data.
   *
   * Without JOINs, transactions only have product_id and user_id (numbers).
   * The JOIN adds product name, SKU, and user's full name in one query —
   * faster than multiple separate lookups.
   *
   * || ' ' || is PostgreSQL string concatenation for full name.
   */
  async findAll(): Promise<any[]> {
    const query = `
      SELECT 
        it.*,
        p.sku,
        p.name as product_name,
        u.first_name || ' ' || u.last_name as user_name
      FROM inventory_transactions it
      LEFT JOIN products p ON it.product_id = p.id
      LEFT JOIN users u ON it.user_id = u.id
      ORDER BY it.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async findByProductId(productId: number): Promise<any[]> {
    const query = `
      SELECT 
        it.*,
        u.first_name || ' ' || u.last_name as user_name
      FROM inventory_transactions it
      LEFT JOIN users u ON it.user_id = u.id
      WHERE it.product_id = $1
      ORDER BY it.created_at DESC
    `;
    const result = await pool.query(query, [productId]);
    return result.rows;
  }

  async findById(id: number): Promise<InventoryTransaction | null> {
    const query = `
      SELECT 
        it.*,
        p.sku,
        p.name as product_name,
        u.first_name || ' ' || u.last_name as user_name
      FROM inventory_transactions it
      LEFT JOIN products p ON it.product_id = p.id
      LEFT JOIN users u ON it.user_id = u.id
      WHERE it.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * getAllProductStock — stock level for every product in one query.
   *
   * Uses the same CASE SUM pattern as getCurrentStock but across ALL products
   * simultaneously using GROUP BY p.id.
   *
   * GROUP BY collapses many transaction rows into one row per product,
   * then SUM adds up all quantities for each group.
   *
   * is_low_stock: calculated in SQL so we don't need a second pass in JS.
   * Saves a loop and keeps the logic in the data layer where it belongs.
   */
  async getAllProductStock(): Promise<ProductStock[]> {
    const query = `
      SELECT 
        p.id as product_id,
        p.sku,
        p.name,
        p.reorder_level,
        COALESCE(
          SUM(
            CASE 
              WHEN it.transaction_type = 'in' THEN it.quantity
              WHEN it.transaction_type = 'out' THEN -it.quantity
              WHEN it.transaction_type = 'adjustment' THEN it.quantity
            END
          ), 0
        ) as current_stock,
        CASE 
          WHEN COALESCE(
            SUM(
              CASE 
                WHEN it.transaction_type = 'in' THEN it.quantity
                WHEN it.transaction_type = 'out' THEN -it.quantity
                WHEN it.transaction_type = 'adjustment' THEN it.quantity
              END
            ), 0
          ) <= p.reorder_level THEN true
          ELSE false
        END as is_low_stock
      FROM products p
      LEFT JOIN inventory_transactions it ON p.id = it.product_id
      GROUP BY p.id, p.sku, p.name, p.reorder_level
      ORDER BY p.name
    `;
    const result = await pool.query(query);
    return result.rows.map((row) => ({
      ...row,
      current_stock: parseInt(row.current_stock),
    }));
  }

  /**
   * getLowStockProducts — products where current_stock <= reorder_level.
   *
   * Uses HAVING instead of WHERE because current_stock is a calculated value
   * (from SUM), not a real column. HAVING filters AFTER GROUP BY aggregation.
   * WHERE filters BEFORE, so it can't see computed values.
   *
   * ORDER BY current_stock ASC: most urgent items (lowest stock) appear first.
   */
  async getLowStockProducts(): Promise<ProductStock[]> {
    const query = `
      SELECT 
        p.id as product_id,
        p.sku,
        p.name,
        p.reorder_level,
        COALESCE(
          SUM(
            CASE 
              WHEN it.transaction_type = 'in' THEN it.quantity
              WHEN it.transaction_type = 'out' THEN -it.quantity
              WHEN it.transaction_type = 'adjustment' THEN it.quantity
            END
          ), 0
        ) as current_stock,
        true as is_low_stock
      FROM products p
      LEFT JOIN inventory_transactions it ON p.id = it.product_id
      GROUP BY p.id, p.sku, p.name, p.reorder_level
      HAVING COALESCE(
        SUM(
          CASE 
            WHEN it.transaction_type = 'in' THEN it.quantity
            WHEN it.transaction_type = 'out' THEN -it.quantity
            WHEN it.transaction_type = 'adjustment' THEN it.quantity
          END
        ), 0
      ) <= p.reorder_level
      ORDER BY current_stock ASC
    `;
    const result = await pool.query(query);
    return result.rows.map((row) => ({
      ...row,
      current_stock: parseInt(row.current_stock),
    }));
  }

  async getRecentTransactions(limit: number = 10): Promise<any[]> {
    const query = `
      SELECT 
        it.*,
        p.sku,
        p.name as product_name,
        u.first_name || ' ' || u.last_name as user_name
      FROM inventory_transactions it
      LEFT JOIN products p ON it.product_id = p.id
      LEFT JOIN users u ON it.user_id = u.id
      ORDER BY it.created_at DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM inventory_transactions WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export default new InventoryModel();
