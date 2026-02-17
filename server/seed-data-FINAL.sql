-- =====================================================
-- STOCKER - DEMO DATA SEED (Updated for your schema)
-- =====================================================
-- Matches your init.sql schema exactly
-- =====================================================

-- Clean existing data (in correct order to avoid foreign key violations)
TRUNCATE TABLE inventory_transactions CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE suppliers CASCADE;
TRUNCATE TABLE users CASCADE;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE categories_id_seq RESTART WITH 1;
ALTER SEQUENCE suppliers_id_seq RESTART WITH 1;
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE inventory_transactions_id_seq RESTART WITH 1;

-- =====================================================
-- 1. USERS
-- =====================================================
-- NOTE: These are PLACEHOLDER password hashes
-- You should either:
-- 1. Register users through your app's /api/auth/register endpoint
-- 2. Or generate real bcrypt hashes for these passwords
--
-- For now, these won't work for login - they're just to populate the database
-- After seeding, use your app to register actual users

INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@stocker.com', '$2b$10$PLACEHOLDER.HASH.WONT.WORK.FOR.LOGIN.BUT.SEEDS.DATABASE', 'Admin', 'User', 'admin'),
('john.doe@stocker.com', '$2b$10$PLACEHOLDER.HASH.WONT.WORK.FOR.LOGIN.BUT.SEEDS.DATABASE', 'John', 'Doe', 'manager'),
('jane.smith@stocker.com', '$2b$10$PLACEHOLDER.HASH.WONT.WORK.FOR.LOGIN.BUT.SEEDS.DATABASE', 'Jane', 'Smith', 'staff');

-- =====================================================
-- 2. CATEGORIES
-- =====================================================

INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Apparel and fashion items'),
('Office Supplies', 'Stationery and office equipment'),
('Home & Garden', 'Household items and garden supplies'),
('Sports & Fitness', 'Sports equipment and fitness gear'),
('Books & Media', 'Books, magazines, and digital media'),
('Food & Beverages', 'Consumable food and drink items'),
('Toys & Games', 'Children toys and board games'),
('Health & Beauty', 'Personal care and cosmetics'),
('Automotive', 'Car parts and accessories');

-- =====================================================
-- 3. SUPPLIERS
-- =====================================================

INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES
('TechWorld Inc.', 'Sarah Johnson', 'orders@techworld.com', '+1-555-0101', '123 Tech Street, San Francisco, CA 94105'),
('Fashion Forward LLC', 'Michael Chen', 'sales@fashionforward.com', '+1-555-0102', '456 Style Avenue, New York, NY 10001'),
('Office Depot Pro', 'Emily Davis', 'wholesale@officedepot.com', '+1-555-0103', '789 Business Blvd, Chicago, IL 60601'),
('Green Garden Supply', 'Robert Wilson', 'info@greengarden.com', '+1-555-0104', '321 Nature Lane, Portland, OR 97201'),
('SportGear Direct', 'Amanda Taylor', 'orders@sportgear.com', '+1-555-0105', '654 Athlete Way, Denver, CO 80201'),
('Media World', 'David Martinez', 'wholesale@mediaworld.com', '+1-555-0106', '987 Book Street, Boston, MA 02101'),
('Fresh Foods Corp', 'Lisa Anderson', 'orders@freshfoods.com', '+1-555-0107', '147 Market Road, Austin, TX 78701'),
('PlayTime Distributors', 'James Thompson', 'sales@playtime.com', '+1-555-0108', '258 Fun Street, Orlando, FL 32801'),
('Beauty Essentials', 'Jessica Garcia', 'wholesale@beautyessentials.com', '+1-555-0109', '369 Glamour Ave, Los Angeles, CA 90001'),
('Auto Parts Plus', 'Christopher Lee', 'orders@autopartsplus.com', '+1-555-0110', '741 Motor Way, Detroit, MI 48201');

-- =====================================================
-- 4. PRODUCTS
-- =====================================================

-- Electronics (Category 1, Supplier 1)
INSERT INTO products (sku, name, description, category_id, supplier_id, unit_price, reorder_level) VALUES
('ELEC-001', 'Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 1, 1, 29.99, 20),
('ELEC-002', 'Mechanical Keyboard', 'RGB backlit mechanical gaming keyboard', 1, 1, 89.99, 15),
('ELEC-003', 'USB-C Hub', '7-in-1 USB-C hub with HDMI and ethernet', 1, 1, 49.99, 25),
('ELEC-004', 'Webcam HD', '1080p HD webcam with microphone', 1, 1, 59.99, 18),
('ELEC-005', 'Bluetooth Speaker', 'Portable waterproof bluetooth speaker', 1, 1, 39.99, 30),
('ELEC-006', 'Phone Charger', 'Fast charging USB-C wall adapter', 1, 1, 19.99, 50),
('ELEC-007', 'Laptop Stand', 'Adjustable aluminum laptop stand', 1, 1, 44.99, 20),
('ELEC-008', 'HDMI Cable 6ft', 'High-speed HDMI 2.1 cable', 1, 1, 12.99, 40),

-- Clothing (Category 2, Supplier 2)
('CLTH-001', 'Cotton T-Shirt', 'Premium cotton crew neck t-shirt', 2, 2, 24.99, 50),
('CLTH-002', 'Denim Jeans', 'Classic fit denim jeans', 2, 2, 59.99, 30),
('CLTH-003', 'Hoodie', 'Comfortable pullover hoodie', 2, 2, 44.99, 25),
('CLTH-004', 'Running Shoes', 'Lightweight athletic running shoes', 2, 2, 79.99, 20),
('CLTH-005', 'Winter Jacket', 'Insulated winter jacket', 2, 2, 129.99, 15),
('CLTH-006', 'Baseball Cap', 'Adjustable baseball cap', 2, 2, 19.99, 40),

-- Office Supplies (Category 3, Supplier 3)
('OFFC-001', 'Ballpoint Pens', 'Pack of 12 black ballpoint pens', 3, 3, 8.99, 100),
('OFFC-002', 'Notebook A5', 'Spiral bound ruled notebook', 3, 3, 4.99, 80),
('OFFC-003', 'Sticky Notes', 'Pack of 6 sticky note pads', 3, 3, 6.99, 60),
('OFFC-004', 'Desk Organizer', 'Mesh desk organizer with drawers', 3, 3, 24.99, 20),
('OFFC-005', 'Stapler', 'Heavy-duty office stapler', 3, 3, 12.99, 30),
('OFFC-006', 'Paper Clips', 'Box of 100 paper clips', 3, 3, 3.99, 50),
('OFFC-007', 'Highlighters', 'Set of 6 assorted color highlighters', 3, 3, 9.99, 40),
('OFFC-008', 'File Folders', 'Pack of 25 manila file folders', 3, 3, 14.99, 35),

-- Home & Garden (Category 4, Supplier 4)
('HOME-001', 'Throw Pillow', 'Decorative throw pillow', 4, 4, 19.99, 40),
('HOME-002', 'Table Lamp', 'Modern LED table lamp', 4, 4, 39.99, 25),
('HOME-003', 'Garden Hose', '50ft expandable garden hose', 4, 4, 34.99, 20),
('HOME-004', 'Plant Pots', 'Set of 3 ceramic plant pots', 4, 4, 24.99, 30),
('HOME-005', 'Door Mat', 'Weather-resistant outdoor door mat', 4, 4, 16.99, 35),

-- Sports & Fitness (Category 5, Supplier 5)
('SPRT-001', 'Yoga Mat', 'Non-slip exercise yoga mat', 5, 5, 29.99, 40),
('SPRT-002', 'Dumbbell Set', 'Adjustable dumbbell set 10-50lbs', 5, 5, 89.99, 15),
('SPRT-003', 'Resistance Bands', 'Set of 5 resistance bands', 5, 5, 19.99, 30),
('SPRT-004', 'Water Bottle', 'Insulated stainless steel water bottle', 5, 5, 24.99, 50),
('SPRT-005', 'Jump Rope', 'Speed jump rope with counter', 5, 5, 14.99, 35),

-- Books & Media (Category 6, Supplier 6)
('BOOK-001', 'Business Strategy', 'Hardcover business book', 6, 6, 29.99, 20),
('BOOK-002', 'Cooking Guide', 'Complete cooking guide cookbook', 6, 6, 34.99, 18),
('BOOK-003', 'Fiction Novel', 'Bestselling fiction novel', 6, 6, 16.99, 30),
('BOOK-004', 'Magazine Subscription', '12-month magazine subscription', 6, 6, 49.99, 10),

-- Food & Beverages (Category 7, Supplier 7)
('FOOD-001', 'Coffee Beans', '1lb premium arabica coffee beans', 7, 7, 18.99, 25),
('FOOD-002', 'Green Tea', 'Box of 100 green tea bags', 7, 7, 12.99, 30),
('FOOD-003', 'Protein Bars', 'Pack of 12 chocolate protein bars', 7, 7, 24.99, 40),
('FOOD-004', 'Mixed Nuts', '16oz container of mixed nuts', 7, 7, 14.99, 35),

-- Toys & Games (Category 8, Supplier 8)
('TOYS-001', 'Building Blocks', '500-piece building block set', 8, 8, 34.99, 20),
('TOYS-002', 'Board Game', 'Family strategy board game', 8, 8, 29.99, 15),
('TOYS-003', 'Puzzle 1000pc', '1000-piece jigsaw puzzle', 8, 8, 19.99, 25),
('TOYS-004', 'Action Figure', 'Collectible action figure', 8, 8, 24.99, 30),

-- Health & Beauty (Category 9, Supplier 9)
('HLTH-001', 'Face Cream', 'Anti-aging moisturizing face cream', 9, 9, 34.99, 30),
('HLTH-002', 'Shampoo', 'Organic natural shampoo 16oz', 9, 9, 16.99, 40),
('HLTH-003', 'Vitamins', 'Multivitamin 60-day supply', 9, 9, 24.99, 25),
('HLTH-004', 'Hand Sanitizer', '8oz antibacterial hand sanitizer', 9, 9, 6.99, 100),

-- Automotive (Category 10, Supplier 10)
('AUTO-001', 'Car Phone Mount', 'Universal dashboard phone mount', 10, 10, 19.99, 35),
('AUTO-002', 'Microfiber Towels', 'Pack of 6 car cleaning towels', 10, 10, 14.99, 30),
('AUTO-003', 'Air Freshener', 'Car air freshener 3-pack', 10, 10, 8.99, 50),
('AUTO-004', 'Tire Pressure Gauge', 'Digital tire pressure gauge', 10, 10, 12.99, 25);

-- =====================================================
-- 5. INVENTORY TRANSACTIONS
-- =====================================================

-- Initial stock for all products (IN transactions)
INSERT INTO inventory_transactions (product_id, transaction_type, quantity, user_id, notes) VALUES
-- Electronics
(1, 'in', 100, 1, 'Initial stock - Wireless Mouse'),
(2, 'in', 75, 1, 'Initial stock - Mechanical Keyboard'),
(3, 'in', 120, 1, 'Initial stock - USB-C Hub'),
(4, 'in', 80, 1, 'Initial stock - Webcam HD'),
(5, 'in', 150, 1, 'Initial stock - Bluetooth Speaker'),
(6, 'in', 200, 1, 'Initial stock - Phone Charger'),
(7, 'in', 90, 1, 'Initial stock - Laptop Stand'),
(8, 'in', 180, 1, 'Initial stock - HDMI Cable'),

-- Clothing
(9, 'in', 200, 1, 'Initial stock - Cotton T-Shirt'),
(10, 'in', 150, 1, 'Initial stock - Denim Jeans'),
(11, 'in', 120, 1, 'Initial stock - Hoodie'),
(12, 'in', 100, 1, 'Initial stock - Running Shoes'),
(13, 'in', 80, 1, 'Initial stock - Winter Jacket'),
(14, 'in', 160, 1, 'Initial stock - Baseball Cap'),

-- Office Supplies
(15, 'in', 500, 1, 'Initial stock - Ballpoint Pens'),
(16, 'in', 400, 1, 'Initial stock - Notebook A5'),
(17, 'in', 300, 1, 'Initial stock - Sticky Notes'),
(18, 'in', 100, 1, 'Initial stock - Desk Organizer'),
(19, 'in', 150, 1, 'Initial stock - Stapler'),
(20, 'in', 250, 1, 'Initial stock - Paper Clips'),
(21, 'in', 200, 1, 'Initial stock - Highlighters'),
(22, 'in', 175, 1, 'Initial stock - File Folders'),

-- Home & Garden
(23, 'in', 180, 1, 'Initial stock - Throw Pillow'),
(24, 'in', 120, 1, 'Initial stock - Table Lamp'),
(25, 'in', 100, 1, 'Initial stock - Garden Hose'),
(26, 'in', 140, 1, 'Initial stock - Plant Pots'),
(27, 'in', 160, 1, 'Initial stock - Door Mat'),

-- Sports & Fitness
(28, 'in', 180, 1, 'Initial stock - Yoga Mat'),
(29, 'in', 75, 1, 'Initial stock - Dumbbell Set'),
(30, 'in', 140, 1, 'Initial stock - Resistance Bands'),
(31, 'in', 220, 1, 'Initial stock - Water Bottle'),
(32, 'in', 160, 1, 'Initial stock - Jump Rope'),

-- Books & Media
(33, 'in', 100, 1, 'Initial stock - Business Strategy'),
(34, 'in', 90, 1, 'Initial stock - Cooking Guide'),
(35, 'in', 130, 1, 'Initial stock - Fiction Novel'),
(36, 'in', 50, 1, 'Initial stock - Magazine Subscription'),

-- Food & Beverages
(37, 'in', 120, 1, 'Initial stock - Coffee Beans'),
(38, 'in', 140, 1, 'Initial stock - Green Tea'),
(39, 'in', 180, 1, 'Initial stock - Protein Bars'),
(40, 'in', 160, 1, 'Initial stock - Mixed Nuts'),

-- Toys & Games
(41, 'in', 100, 1, 'Initial stock - Building Blocks'),
(42, 'in', 80, 1, 'Initial stock - Board Game'),
(43, 'in', 120, 1, 'Initial stock - Puzzle 1000pc'),
(44, 'in', 140, 1, 'Initial stock - Action Figure'),

-- Health & Beauty
(45, 'in', 140, 1, 'Initial stock - Face Cream'),
(46, 'in', 180, 1, 'Initial stock - Shampoo'),
(47, 'in', 120, 1, 'Initial stock - Vitamins'),
(48, 'in', 400, 1, 'Initial stock - Hand Sanitizer'),

-- Automotive
(49, 'in', 160, 1, 'Initial stock - Car Phone Mount'),
(50, 'in', 140, 1, 'Initial stock - Microfiber Towels'),
(51, 'in', 220, 1, 'Initial stock - Air Freshener'),
(52, 'in', 120, 1, 'Initial stock - Tire Pressure Gauge');

-- Sample OUT transactions (sales)
INSERT INTO inventory_transactions (product_id, transaction_type, quantity, user_id, notes) VALUES
(1, 'out', 15, 2, 'Customer order #1001'),
(2, 'out', 8, 2, 'Customer order #1002'),
(5, 'out', 25, 2, 'Bulk order - Corporate client'),
(9, 'out', 35, 2, 'Customer order #1003'),
(15, 'out', 100, 2, 'Office supply order'),
(28, 'out', 12, 2, 'Gym equipment order'),
(37, 'out', 18, 3, 'Coffee shop order'),
(48, 'out', 80, 3, 'School order'),
(3, 'out', 10, 2, 'Customer order #1004'),
(6, 'out', 30, 2, 'Customer order #1005'),
(10, 'out', 20, 2, 'Fashion boutique order'),
(16, 'out', 50, 2, 'Stationery store order'),
(31, 'out', 40, 3, 'Sports team order'),
(4, 'out', 5, 2, 'Customer order #1006'),
(11, 'out', 15, 2, 'Customer order #1007'),
(20, 'out', 40, 2, 'Office supply distributor'),
(33, 'out', 12, 3, 'Bookstore order');

-- Adjustment transactions
INSERT INTO inventory_transactions (product_id, transaction_type, quantity, user_id, notes) VALUES
(7, 'adjustment', -3, 1, 'Damaged items - quality control'),
(13, 'adjustment', -2, 1, 'Display damage'),
(24, 'adjustment', -1, 1, 'Broken during handling'),
(29, 'adjustment', -1, 1, 'Customer return - defective'),
(42, 'adjustment', 5, 1, 'Found in storage - inventory correction');

-- Create low stock situations for demo
INSERT INTO inventory_transactions (product_id, transaction_type, quantity, user_id, notes) VALUES
(4, 'out', 70, 2, 'Large corporate order - webcams'),
(12, 'out', 75, 2, 'Shoe sale - high demand'),
(29, 'out', 55, 2, 'Gym opening - bulk equipment order');

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show summary
SELECT 'Database seeded successfully!' as message;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_suppliers FROM suppliers;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_transactions FROM inventory_transactions;

-- Show low stock items
SELECT 
    p.sku,
    p.name,
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
GROUP BY p.id, p.sku, p.name, p.reorder_level
HAVING COALESCE(SUM(
    CASE 
        WHEN it.transaction_type = 'in' THEN it.quantity
        WHEN it.transaction_type = 'out' THEN -it.quantity
        WHEN it.transaction_type = 'adjustment' THEN it.quantity
    END
), 0) <= p.reorder_level
ORDER BY current_stock;
