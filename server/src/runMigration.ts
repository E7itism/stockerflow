/**
 * runMigration.ts
 *
 * Runs all SQL migration files in order from the migrations/ folder.
 * Files are run in alphabetical order — so naming matters:
 *   001_init.sql
 *   002_add_pos_tables.sql
 *   003_next_feature.sql  ← future migrations go here
 *
 * Why sequential migrations instead of one big SQL file?
 * - Each file represents one version of the database
 * - You never edit old migration files after they're deployed
 * - New features get new migration files
 * - This is the standard professional approach (used by all major ORMs)
 *
 * Run with:
 *   npm run migrate
 *   or
 *   npx tsx src/runMigration.ts
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import 'dotenv/config';

console.log('DATABASE_URL:', process.env.DATABASE_URL);
const runMigration = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false, // Required for Railway SSL connections
  });
  try {
    // Find all .sql files in migrations/ folder, sorted alphabetically
    // Alphabetical order = chronological order because of our naming convention (001, 002, etc.)
    const migrationsDir = path.join(process.cwd(), 'migrations');

    let migrationFiles: string[] = [];

    if (fs.existsSync(migrationsDir)) {
      migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort(); // alphabetical = 001 before 002 before 003
    }

    if (migrationFiles.length === 0) {
      // Fallback to old init.sql if no migrations folder exists
      console.log(
        'No migrations folder found — falling back to src/database/init.sql',
      );
      const sqlPath = path.join(process.cwd(), 'src/database/init.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(sql);
      console.log('✅ init.sql applied successfully');
    } else {
      // Run each migration file in order
      for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log(`⏳ Running migration: ${file}`);
        await pool.query(sql);
        console.log(`✅ ${file} applied successfully`);
      }

      console.log(
        `\n✅ All ${migrationFiles.length} migration(s) applied successfully`,
      );
    }
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigration();
