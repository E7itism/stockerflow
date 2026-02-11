import pool from '../config/database';
import bcrypt from 'bcrypt';
class UserModel {
    // Create a new user
    async create(userData) {
        const { email, password, first_name, last_name, role = 'staff' } = userData;
        // Hash the password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, role, created_at, updated_at
    `;
        const values = [email, password_hash, first_name, last_name, role];
        const result = await pool.query(query, values);
        return result.rows[0];
    }
    // Find user by email
    async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        return result.rows[0] || null;
    }
    // Find user by ID
    async findById(id) {
        const query = 'SELECT id, email, first_name, last_name, role, created_at, updated_at FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    }
    // Verify password
    async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
    // Get all users (admin only)
    async findAll() {
        const query = 'SELECT id, email, first_name, last_name, role, created_at, updated_at FROM users ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    }
}
export default new UserModel();
