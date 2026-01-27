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
}

interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  category_id?: number;
  supplier_id?: number;
  unit_price: number;
  reorder_level?: number;
}

interface UpdateProductInput {
  sku?: string;
  name?: string;
  description?: string;
  category_id?: number;
  supplier_id?: number;
  unit_price?: number;
  reorder_level?: number;
}

class ProductModel {
  // Create a new product
  async create(productData: CreateProductInput): Promise<Product> {
    const {
      sku,
      name,
      description,
      category_id,
      supplier_id,
      unit_price,
      reorder_level = 10,
    } = productData;

    const query = `
      INSERT INTO products (sku, name, description, category_id, supplier_id, unit_price, reorder_level)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
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
    ];
    const result = await pool.query(query, values);

    return result.rows[0];
  }

  // Get all products with current stock
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

  // Get single product by ID
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

  // Get product by SKU
  async findBySKU(sku: string): Promise<Product | null> {
    const query = 'SELECT * FROM products WHERE sku = $1';
    const result = await pool.query(query, [sku]);
    return result.rows[0] || null;
  }

  // Update product
  async update(
    id: number,
    productData: UpdateProductInput,
  ): Promise<Product | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Dynamically build UPDATE query based on provided fields
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

    // Always update updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (fields.length === 1) {
      // Only updated_at, no actual changes
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

  // Delete product
  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export default new ProductModel();
