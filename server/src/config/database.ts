/**
 * database.ts
 *
 * Creates and exports a PostgreSQL connection pool.
 *
 * Why a pool instead of a single connection?
 * A pool maintains multiple connections simultaneously so concurrent requests
 * don't queue up waiting for one connection to free up.
 * pg's Pool handles acquiring/releasing connections automatically.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err: Error) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1); // Exit on unrecoverable DB error
});

export default pool;
