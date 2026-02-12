// src/runMigration.ts
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const runMigration = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required for cloud connections
  });

  try {
    // This points to the project root, making it environment-agnostic
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
