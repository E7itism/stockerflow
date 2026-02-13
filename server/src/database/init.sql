-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create a view for current stock levels
CREATE OR REPLACE VIEW current_stock AS
SELECT 
    p.id as product_id,
    p.sku,
    p.name,
    p.reorder_level,
    COALESCE(SUM(
        CASE 
            WHEN it.transaction_type = 'in' THEN it.quantity
            WHEN it.transaction_type = 'out' THEN -it.quantity
            WHEN it.transaction_type = 'adjustment' THEN it.quantity
        END
    ), 0) as current_quantity
FROM products p
LEFT JOIN inventory_transactions it ON p.id = it.product_id
GROUP BY p.id, p.sku, p.name, p.reorder_level;




-- SEED

/**
 * SEED DATA SCRIPT - COMPLETE GUIDE
 * 
 * WHAT THIS DOES:
 * Adds initial data to your database so dropdowns aren't empty
 * 
 * INCLUDES:
 * - Sample categories
 * - Sample suppliers  
 * - Sample products
 * - Sample transactions
 * 
 * HOW TO USE:
 * Add this to your init.sql OR run it separately in Railway
 */

-- =====================================================================
-- SEED CATEGORIES
-- =====================================================================

/**
 * Categories Seed Data
 * 
 * WHAT IT DOES:
 * Adds 5 common product categories
 * 
 * ON CONFLICT DO NOTHING:
 * If category already exists (by name), skip it
 * This makes the script safe to run multiple times
 */

INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Electronic devices and accessories'),
  ('Office Supplies', 'Pens, paper, notebooks, and office essentials'),
  ('Furniture', 'Chairs, desks, tables, and storage'),
  ('Tools', 'Hardware and maintenance tools'),
  ('Accessories', 'Small accessories and miscellaneous items')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- SEED SUPPLIERS
-- =====================================================================

/**
 * Suppliers Seed Data
 * 
 * WHAT IT DOES:
 * Adds 4 sample suppliers
 * 
 * WHY THESE FIELDS:
 * - name: Company name (unique)
 * - email: Contact email
 * - phone: Contact phone
 * - address: Physical address
 */

INSERT INTO suppliers (name, email, phone, address) VALUES
  ('Tech Direct', 'sales@techdirect.com', '+1-555-0100', '123 Tech Street, San Francisco, CA'),
  ('Office Depot', 'info@officedepot.com', '+1-555-0200', '456 Office Blvd, New York, NY'),
  ('Global Supplies', 'contact@globalsupplies.com', '+1-555-0300', '789 Supply Ave, Chicago, IL'),
  ('Quality Tools Co', 'orders@qualitytools.com', '+1-555-0400', '321 Tool Road, Austin, TX')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- SEED PRODUCTS
-- =====================================================================

/**
 * Products Seed Data
 * 
 * WHAT IT DOES:
 * Adds 10 sample products across different categories
 * 
 * IMPORTANT NOTES:
 * - category_id and supplier_id must match existing records
 * - SKU must be unique
 * - unit_price is in dollars (decimal)
 * - reorder_level is when to restock
 * 
 * HOW category_id WORKS:
 * We use subqueries to find the ID by name
 * (SELECT id FROM categories WHERE name = 'Electronics')
 * This way we don't need to know the exact ID number
 */

INSERT INTO products (sku, name, description, category_id, supplier_id, unit_price, reorder_level) VALUES
  (
    'LAP-001',
    'Dell Laptop',
    '15" business laptop with 16GB RAM',
    (SELECT id FROM categories WHERE name = 'Electronics'),
    (SELECT id FROM suppliers WHERE name = 'Tech Direct'),
    999.99,
    5
  ),
  (
    'MOU-001',
    'Wireless Mouse',
    'Ergonomic wireless mouse',
    (SELECT id FROM categories WHERE name = 'Electronics'),
    (SELECT id FROM suppliers WHERE name = 'Tech Direct'),
    29.99,
    20
  ),
  (
    'KEY-001',
    'Mechanical Keyboard',
    'RGB mechanical keyboard',
    (SELECT id FROM categories WHERE name = 'Electronics'),
    (SELECT id FROM suppliers WHERE name = 'Tech Direct'),
    89.99,
    15
  ),
  (
    'PEN-001',
    'Blue Pens (Box of 12)',
    'Professional ballpoint pens',
    (SELECT id FROM categories WHERE name = 'Office Supplies'),
    (SELECT id FROM suppliers WHERE name = 'Office Depot'),
    4.99,
    50
  ),
  (
    'NOTE-001',
    'Spiral Notebooks (5-Pack)',
    'College ruled notebooks',
    (SELECT id FROM categories WHERE name = 'Office Supplies'),
    (SELECT id FROM suppliers WHERE name = 'Office Depot'),
    12.99,
    30
  ),
  (
    'DESK-001',
    'Standing Desk',
    'Adjustable height desk',
    (SELECT id FROM categories WHERE name = 'Furniture'),
    (SELECT id FROM suppliers WHERE name = 'Global Supplies'),
    399.99,
    3
  ),
  (
    'CHAIR-001',
    'Office Chair',
    'Ergonomic office chair with lumbar support',
    (SELECT id FROM categories WHERE name = 'Furniture'),
    (SELECT id FROM suppliers WHERE name = 'Global Supplies'),
    249.99,
    5
  ),
  (
    'TOOL-001',
    'Screwdriver Set',
    '10-piece screwdriver set',
    (SELECT id FROM categories WHERE name = 'Tools'),
    (SELECT id FROM suppliers WHERE name = 'Quality Tools Co'),
    24.99,
    15
  ),
  (
    'TOOL-002',
    'Cordless Drill',
    '20V cordless drill with battery',
    (SELECT id FROM categories WHERE name = 'Tools'),
    (SELECT id FROM suppliers WHERE name = 'Quality Tools Co'),
    89.99,
    8
  ),
  (
    'ACC-001',
    'Cable Organizer',
    'Desk cable management system',
    (SELECT id FROM categories WHERE name = 'Accessories'),
    (SELECT id FROM suppliers WHERE name = 'Tech Direct'),
    14.99,
    25
  )
ON CONFLICT (sku) DO NOTHING;

-- =====================================================================
-- SEED INVENTORY TRANSACTIONS (Optional)
-- =====================================================================

/**
 * Initial Inventory Transactions
 * 
 * WHAT IT DOES:
 * Adds some starting stock for products
 * This gives products an initial stock level
 * 
 * TRANSACTION TYPES:
 * - 'in' = Stock received (adding inventory)
 * - 'out' = Stock sold/used (removing inventory)
 * - 'adjustment' = Manual correction
 * 
 * NOTE: You need a user_id
 * Replace 1 with the actual user ID from your users table
 * Or remove this section and add transactions through the UI
 */

-- Only run this if you have a user in the database
-- Otherwise, skip this section and add transactions through UI

INSERT INTO inventory_transactions (product_id, transaction_type, quantity, user_id, notes) VALUES
  (
    (SELECT id FROM products WHERE sku = 'LAP-001'),
    'in',
    50,
    1,  -- Replace with actual user ID
    'Initial stock'
  ),
  (
    (SELECT id FROM products WHERE sku = 'MOU-001'),
    'in',
    100,
    1,
    'Initial stock'
  ),
  (
    (SELECT id FROM products WHERE sku = 'KEY-001'),
    'in',
    75,
    1,
    'Initial stock'
  ),
  (
    (SELECT id FROM products WHERE sku = 'PEN-001'),
    'in',
    200,
    1,
    'Initial stock'
  ),
  (
    (SELECT id FROM products WHERE sku = 'NOTE-001'),
    'in',
    150,
    1,
    'Initial stock'
  ),
  (
    (SELECT id FROM products WHERE sku = 'DESK-001'),
    'in',
    20,
    1,
    'Initial stock'
  ),
  (
    (SELECT id FROM products WHERE sku = 'CHAIR-001'),
    'in',
    30,
    1,
    'Initial stock'
  ),
  (
    (SELECT id FROM products WHERE sku = 'TOOL-001'),
    'in',
    80,
    1,
    'Initial stock'
  ),
  (
    (SELECT id FROM products WHERE sku = 'TOOL-002'),
    'in',
    40,
    1,
    'Initial stock'
  ),
  (
    (SELECT id FROM products WHERE sku = 'ACC-001'),
    'in',
    120,
    1,
    'Initial stock'
  )
ON CONFLICT DO NOTHING;

-- =====================================================================
-- VERIFICATION QUERIES
-- =====================================================================

/**
 * Run these to verify data was inserted
 */

-- Check categories
SELECT * FROM categories ORDER BY name;

-- Check suppliers  
SELECT * FROM suppliers ORDER BY name;

-- Check products
SELECT 
  p.sku,
  p.name,
  c.name as category,
  s.name as supplier,
  p.unit_price
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
ORDER BY p.sku;

-- Check inventory transactions
SELECT 
  it.id,
  p.name as product,
  it.transaction_type,
  it.quantity,
  u.first_name || ' ' || u.last_name as user_name,
  it.created_at
FROM inventory_transactions it
LEFT JOIN products p ON it.product_id = p.id
LEFT JOIN users u ON it.user_id = u.id
ORDER BY it.created_at DESC;

-- Check current stock levels
SELECT 
  p.name,
  p.sku,
  COALESCE(SUM(
    CASE 
      WHEN it.transaction_type = 'in' THEN it.quantity
      WHEN it.transaction_type = 'out' THEN -it.quantity
      WHEN it.transaction_type = 'adjustment' THEN it.quantity
    END
  ), 0) as current_stock,
  p.reorder_level
FROM products p
LEFT JOIN inventory_transactions it ON p.id = it.product_id
GROUP BY p.id, p.name, p.sku, p.reorder_level
ORDER BY p.name;