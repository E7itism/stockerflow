/**
 * productModel.ts
 *
 * Database operations for the products table.
 * Includes a JOIN with the current_stock VIEW for real-time stock levels.
 */

import pool from '../config/database';

interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category_id: number | null;
  supplier_id: number | null;
  unit_price: number;
  reorder_level: number;
  created_at: Date;
  updated_at: Date;
  unit_of_measure?: string;
}

interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  category_id?: number;
  supplier_id?: number;
  unit_price: number;
  reorder_level?: number;
  unit_of_measure?: string;
}

interface UpdateProductInput {
  sku?: string;
  name?: string;
  description?: string;
  category_id?: number;
  supplier_id?: number;
  unit_price?: number;
  reorder_level?: number;
  unit_of_measure?: string;
}

class ProductModel {
  async create(productData: CreateProductInput): Promise<Product> {
    const {
      sku,
      name,
      description,
      category_id,
      supplier_id,
      unit_price,
      reorder_level = 10,
      unit_of_measure = 'piece',
    } = productData;

    const query = `
      INSERT INTO products (sku, name, description, category_id, supplier_id, unit_price, reorder_level, unit_of_measure)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      sku,
      name,
      description || null,
      category_id || null,
      supplier_id || null,
      unit_price,
      reorder_level,
      unit_of_measure,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * findAll — JOINs with the current_stock VIEW.
   *
   * current_stock is a database VIEW (defined in init.sql) that calculates
   * stock levels from inventory_transactions. JOINing here means every product
   * automatically comes with its live stock count — no separate query needed.
   *
   * COALESCE(cs.current_quantity, 0): Products with no transactions return
   * NULL from the LEFT JOIN. COALESCE converts that to 0.
   */
  async findAll(): Promise<any[]> {
    const query = `
      SELECT 
        p.*,
        COALESCE(cs.current_quantity, 0) as current_stock
      FROM products p
      LEFT JOIN current_stock cs ON p.id = cs.product_id
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async findById(id: number): Promise<any | null> {
    const query = `
      SELECT 
        p.*,
        COALESCE(cs.current_quantity, 0) as current_stock
      FROM products p
      LEFT JOIN current_stock cs ON p.id = cs.product_id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findBySKU(sku: string): Promise<Product | null> {
    const query = 'SELECT * FROM products WHERE sku = $1';
    const result = await pool.query(query, [sku]);
    return result.rows[0] || null;
  }

  /**
   * update — dynamically builds the UPDATE query based on which fields were provided.
   *
   * Why dynamic instead of always updating all fields?
   * If we always updated every column, a PATCH request that only changes the name
   * would also overwrite unit_price, sku, etc. with whatever is in the request body
   * (potentially undefined → NULL in the DB).
   *
   * How it works:
   * - Loop through each field in updateData
   * - If the field was provided (not undefined), add it to the query
   * - $1, $2, $3... are placeholders that prevent SQL injection
   * - paramCount tracks which placeholder number we're at
   *
   * Example: updating only name and unit_price produces:
   *   UPDATE products SET name = $1, unit_price = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3
   */
  async update(
    id: number,
    productData: UpdateProductInput,
  ): Promise<Product | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (productData.sku !== undefined) {
      fields.push(`sku = $${paramCount++}`);
      values.push(productData.sku);
    }
    if (productData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(productData.name);
    }
    if (productData.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(productData.description);
    }
    if (productData.category_id !== undefined) {
      fields.push(`category_id = $${paramCount++}`);
      values.push(productData.category_id);
    }
    if (productData.supplier_id !== undefined) {
      fields.push(`supplier_id = $${paramCount++}`);
      values.push(productData.supplier_id);
    }
    if (productData.unit_price !== undefined) {
      fields.push(`unit_price = $${paramCount++}`);
      values.push(productData.unit_price);
    }
    if (productData.reorder_level !== undefined) {
      fields.push(`reorder_level = $${paramCount++}`);
      values.push(productData.reorder_level);
    }
    if (productData.unit_of_measure !== undefined) {
      fields.push(`unit_of_measure = $${paramCount++}`);
      values.push(productData.unit_of_measure);
    }

    // Always update updated_at to track when the record was last modified
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Nothing to update (only updated_at would change) — just return current data
    if (fields.length === 1) {
      return await this.findById(id);
    }

    values.push(id);

    const query = `
      UPDATE products
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export default new ProductModel();
