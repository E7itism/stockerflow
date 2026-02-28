/**
 * userModel.ts
 *
 * Handles all database operations for the users table.
 * Contains the most important security logic in the app:
 * bcrypt password hashing and verification.
 *
 * Security rules enforced here:
 * - Passwords are always hashed before storage (never plain text)
 * - password_hash is NEVER returned in findById or findAll queries
 * - findByEmail returns password_hash ONLY because login needs it to verify
 */

import pool from '../config/database';
import bcrypt from 'bcrypt';

interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'staff';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface CreateUserInput {
  email: string;
  password: string; // plain text — will be hashed inside create()
  first_name: string;
  last_name: string;
  role?: 'admin' | 'manager' | 'staff';
}

class UserModel {
  async create(userData: CreateUserInput): Promise<User> {
    const { email, password, first_name, last_name, role = 'staff' } = userData;

    /**
     * bcrypt.hash() — converts plain password to a secure hash.
     *
     * saltRounds = 10: How many times the hashing algorithm runs.
     * Higher = more secure but slower. 10 is the recommended default.
     * At 10 rounds, hashing takes ~100ms — slow enough to make brute force
     * impractical, fast enough that users don't notice.
     *
     * Why NOT use MD5 or SHA256?
     * Those are fast hashing algorithms — an attacker with a GPU can try
     * billions of combinations per second. bcrypt is designed to be slow,
     * which is exactly what you want for passwords.
     *
     * The resulting hash looks like:
     * $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
     * (includes the salt and cost factor — self-contained)
     */
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    /**
     * Notice: SELECT returns everything EXCEPT password_hash.
     * The CREATE itself needs password_hash (to store it),
     * but the returned User object should never expose it.
     * So we explicitly list the columns we want back.
     */
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, role, created_at, updated_at
    `;

    const values = [email, password_hash, first_name, last_name, role];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * findByEmail — used ONLY during login.
   *
   * Why does this return password_hash when other queries don't?
   * Login needs to compare the submitted password against the stored hash.
   * Without password_hash, we can't verify the password.
   * All other queries (findById, findAll) exclude it.
   */
  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * findById — used for getCurrentUser endpoint.
   * Explicitly excludes password_hash from SELECT.
   */
  async findById(id: number): Promise<User | null> {
    const query =
      'SELECT id, email, first_name, last_name, role, created_at, updated_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * verifyPassword — compare submitted plain password to stored hash.
   *
   * Why bcrypt.compare() instead of hashing again and comparing?
   * bcrypt hashes include a random salt — the same password hashed
   * twice produces two DIFFERENT hashes. bcrypt.compare() handles this
   * by extracting the salt from the stored hash and using it during comparison.
   *
   * bcrypt.compare() is also constant-time — it always takes the same
   * amount of time regardless of where the strings differ.
   * This prevents timing attacks.
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * findAll — admin-only endpoint.
   * Omit<User, 'password_hash'> is a TypeScript utility type that removes
   * password_hash from the return type — enforces the exclusion at compile time.
   */
  async findAll(): Promise<Omit<User, 'password_hash'>[]> {
    const query =
      'SELECT id, email, first_name, last_name, role, created_at, updated_at FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }
}

export default new UserModel();
