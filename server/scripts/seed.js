require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

console.log('🌱 STOCKER Database Seeder\n');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

async function seed() {
  try {
    console.log('📄 Reading seed file...');

    // Update this path to where your seed file is
    const seedPath = path.join(__dirname, '../seed-data-FINAL.sql');
    const sql = fs.readFileSync(seedPath, 'utf8');

    console.log('🔌 Connecting to database...');
    await pool.query('SELECT 1');

    console.log('🌱 Seeding database...\n');
    await pool.query(sql);

    console.log('✅ Database seeded successfully!\n');

    // Verify
    const products = await pool.query('SELECT COUNT(*) FROM products');
    const categories = await pool.query('SELECT COUNT(*) FROM categories');

    console.log('📊 Database populated with:');
    console.log(`   • ${products.rows[0].count} Products`);
    console.log(`   • ${categories.rows[0].count} Categories\n`);

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seeding failed!');
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seed();
