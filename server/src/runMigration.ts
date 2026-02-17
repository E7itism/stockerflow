/**
 * runMigration.ts
 *
 * One-time script to apply the database schema (init.sql).
 * Run with: npx ts-node src/runMigration.ts
 *
 * Uses a separate Pool (not the shared one from database.ts)
 * with ssl: { rejectUnauthorized: false } for cloud DB connections (Railway).
 *
 * process.cwd() makes the SQL path work regardless of where the command is run from.
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const runMigration = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required for Railway/Heroku SSL connections
  });

  try {
    const sqlPath = path.join(process.cwd(), 'src/database/init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);
    console.log('✅ Migration successful');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigration();
