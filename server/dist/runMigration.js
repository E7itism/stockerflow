import pool from './config/database';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runMigration = async () => {
    try {
        console.log('📦 Running database migration...');
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'database', 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        // Execute the SQL
        await pool.query(sql);
        console.log('✅ Database migration completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};
runMigration();
