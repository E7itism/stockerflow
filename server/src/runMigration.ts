import pool from './config/database';
import fs from 'fs';
import path from 'path';

const runMigration = async () => {
  try {
    console.log('📦 Running database migration...');

    // __dirname is available in CommonJS (no need for fileURLToPath)
    const sqlPath = path.join(__dirname, 'database', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    await pool.query(sql);

    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
