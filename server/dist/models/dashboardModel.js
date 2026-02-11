/**
 * Dashboard Model - Gets statistics for the dashboard
 *
 * What this does:
 * - Counts products, categories, suppliers
 * - Calculates total inventory value
 * - Finds most active products
 */
import pool from '../config/database';
class DashboardModel {
    // Get overview statistics (counts of everything)
    async getOverviewStats() {
        const query = `
      SELECT 
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT COUNT(*) FROM suppliers) as total_suppliers,
        (
          SELECT COUNT(*) 
          FROM products p
          LEFT JOIN (
            SELECT 
              product_id,
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
            GROUP BY product_id
          ) stock ON p.id = stock.product_id
          WHERE COALESCE(stock.current_stock, 0) <= p.reorder_level
        ) as low_stock_count
    `;
        const result = await pool.query(query);
        return {
            total_products: parseInt(result.rows[0].total_products),
            total_categories: parseInt(result.rows[0].total_categories),
            total_suppliers: parseInt(result.rows[0].total_suppliers),
            low_stock_count: parseInt(result.rows[0].low_stock_count),
        };
    }
    // Calculate total value of all inventory (stock × price)
    async getInventoryValue() {
        const query = `
      SELECT 
        COALESCE(
          SUM(
            p.unit_price * COALESCE(stock.current_stock, 0)
          ), 0
        ) as total_value
      FROM products p
      LEFT JOIN (
        SELECT 
          product_id,
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
        GROUP BY product_id
      ) stock ON p.id = stock.product_id
    `;
        const result = await pool.query(query);
        return {
            total_value: parseFloat(result.rows[0].total_value),
            currency: 'USD',
        };
    }
    // Get products with most transactions (most active)
    async getTopProducts(limit = 5) {
        const query = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.sku,
        COUNT(it.id) as transaction_count
      FROM products p
      LEFT JOIN inventory_transactions it ON p.id = it.product_id
      GROUP BY p.id, p.name, p.sku
      ORDER BY transaction_count DESC
      LIMIT $1
    `;
        const result = await pool.query(query, [limit]);
        return result.rows.map((row) => ({
            product_id: row.product_id,
            product_name: row.product_name,
            sku: row.sku,
            transaction_count: parseInt(row.transaction_count),
        }));
    }
}
export default new DashboardModel();
