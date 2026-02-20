-- ============================================================
-- MIGRATION 002 — Add POS tables + unit_of_measure to products
-- Run this against your Railway PostgreSQL database
-- ============================================================

-- Add unit_of_measure to existing products table
-- WHY: STOCKER defines what unit a product is sold in.
--      POS reads this and displays it. Receipt captures it at sale time.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(50) DEFAULT 'piece';

-- ── sales ───────────────────────────────────────────────────
-- One row per transaction at the register
CREATE TABLE IF NOT EXISTS sales (
  id             SERIAL PRIMARY KEY,
  cashier_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  total_amount   DECIMAL(10,2) NOT NULL,
  cash_tendered  DECIMAL(10,2),              -- null for non-cash
  change_amount  DECIMAL(10,2),              -- null for non-cash
  payment_method VARCHAR(20) DEFAULT 'cash',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── sale_items ───────────────────────────────────────────────
-- One row per product per sale (line items on the receipt)
CREATE TABLE IF NOT EXISTS sale_items (
  id              SERIAL PRIMARY KEY,
  sale_id         INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  product_id      INTEGER REFERENCES products(id) ON DELETE SET NULL,

  -- SNAPSHOT columns: product details AT TIME OF SALE
  -- WHY: Product name/price can change later. Receipt must show
  --      what the customer actually paid, not today's price.
  product_name    VARCHAR(255) NOT NULL,
  unit_of_measure VARCHAR(50)  NOT NULL,
  unit_price      DECIMAL(10,2) NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  subtotal        DECIMAL(10,2) NOT NULL
);

-- ── Indexes for common queries ───────────────────────────────
-- Speed up "show today's sales" and "cashier's history" queries
CREATE INDEX IF NOT EXISTS idx_sales_created_at  ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_cashier_id  ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
