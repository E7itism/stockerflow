import pool from '../config/database';
import bcrypt from 'bcrypt';

interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'staff';
  created_at: Date;
  updated_at: Date;
}

interface CreateUserInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: 'admin' | 'manager' | 'staff';
}

class UserModel {
  // Create a new user
  async create(userData: CreateUserInput): Promise<User> {
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
  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);

    return result.rows[0] || null;
  }

  // Find user by ID
  async findById(id: number): Promise<User | null> {
    const query =
      'SELECT id, email, first_name, last_name, role, created_at, updated_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  }

  // Verify password
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get all users (admin only)
  async findAll(): Promise<Omit<User, 'password_hash'>[]> {
    const query =
      'SELECT id, email, first_name, last_name, role, created_at, updated_at FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);

    return result.rows;
  }
}

export default new UserModel();
