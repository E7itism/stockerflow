import pool from './config/database';
import fs from 'fs';
import path from 'path';

const runMigration = async () => {
  try {
    console.log('📦 Running database migration...');

    // This looks relative to where the process is running (the root)
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'src/database/init.sql'),
      'utf8',
    );

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
