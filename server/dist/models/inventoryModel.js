import pool from '../config/database';
class InventoryModel {
    // ─────────────────────────────────────────────────────────────────
    // CREATE TRANSACTION
    // ─────────────────────────────────────────────────────────────────
    async create(transaction) {
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
    // ─────────────────────────────────────────────────────────────────
    // CALCULATE CURRENT STOCK  
    /**
     * HOW IT WORKS:
     * Transaction 1: type='in',  quantity=100  →  +100
     * Transaction 2: type='out', quantity=20   →   -20
     * Transaction 3: type='out', quantity=10   →   -10
     * Current Stock = 100 - 20 - 10 = 70
     */
    async getCurrentStock(productId) {
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
    // ─────────────────────────────────────────────────────────────────
    // GET ALL TRANSACTIONS
    // ─────────────────────────────────────────────────────────────────
    async findAll() {
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
    // ─────────────────────────────────────────────────────────────────
    // GET TRANSACTIONS FOR ONE PRODUCT
    // ─────────────────────────────────────────────────────────────────
    async findByProductId(productId) {
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
    // ─────────────────────────────────────────────────────────────────
    // GET SINGLE TRANSACTION
    // ─────────────────────────────────────────────────────────────────
    async findById(id) {
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
    // ─────────────────────────────────────────────────────────────────
    // GET ALL PRODUCTS WITH STOCK LEVELS
    // ─────────────────────────────────────────────────────────────────
    async getAllProductStock() {
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
    // ─────────────────────────────────────────────────────────────────
    // GET LOW STOCK PRODUCTS
    // ─────────────────────────────────────────────────────────────────
    async getLowStockProducts() {
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
    // ─────────────────────────────────────────────────────────────────
    // GET RECENT TRANSACTIONS
    // ─────────────────────────────────────────────────────────────────
    async getRecentTransactions(limit = 10) {
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
    // ─────────────────────────────────────────────────────────────────
    // DELETE TRANSACTION
    // ─────────────────────────────────────────────────────────────────
    async delete(id) {
        const query = 'DELETE FROM inventory_transactions WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rowCount !== null && result.rowCount > 0;
    }
}
export default new InventoryModel();
