import pool from '../config/database';
class CategoryModel {
    // Create category
    async create(categoryData) {
        const { name, description } = categoryData;
        const query = `
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING *
    `;
        const values = [name, description || null];
        const result = await pool.query(query, values);
        return result.rows[0];
    }
    // Get all categories
    async findAll() {
        const query = 'SELECT * FROM categories ORDER BY name ASC';
        const result = await pool.query(query);
        return result.rows;
    }
    // Get category by ID
    async findById(id) {
        const query = 'SELECT * FROM categories WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }
    // Get category by name
    async findByName(name) {
        const query = 'SELECT * FROM categories WHERE name = $1';
        const result = await pool.query(query, [name]);
        return result.rows[0] || null;
    }
    // Update category
    async update(id, categoryData) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (categoryData.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(categoryData.name);
        }
        if (categoryData.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(categoryData.description);
        }
        if (fields.length === 0) {
            return await this.findById(id);
        }
        values.push(id);
        const query = `
      UPDATE categories
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }
    // Delete category
    async delete(id) {
        const query = 'DELETE FROM categories WHERE id = $1 RETURNING id';
        const result = await pool.query(query, [id]);
        return result.rowCount ? result.rowCount > 0 : false;
    }
}
export default new CategoryModel();
