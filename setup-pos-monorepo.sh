#!/bin/bash
# ============================================================
# POS MONOREPO SETUP SCRIPT
# Run this from the ROOT of your existing stocker project.
# It will NOT touch your existing server/ or admin-web/ code.
# ============================================================

set -e  # Exit immediately on any error

echo "🚀 Setting up POS monorepo structure..."

# ─────────────────────────────────────────
# 1. RENAME client/ → admin-web/ (if needed)
# ─────────────────────────────────────────
if [ -d "client" ] && [ ! -d "admin-web" ]; then
  echo "📁 Renaming client/ → admin-web/"
  mv client admin-web
  echo "   ✅ Done. Update your Railway/Vercel build path if needed."
else
  echo "📁 Skipping rename (admin-web already exists or client not found)"
fi

# ─────────────────────────────────────────
# 2. CREATE pos-web/ FOLDER STRUCTURE
# ─────────────────────────────────────────
echo "📁 Creating pos-web/ structure..."

mkdir -p pos-web/src/{pages,components/{cart,products,receipt,layout},services,types,hooks,utils}

# ─────────────────────────────────────────
# 3. pos-web/package.json
# ─────────────────────────────────────────
cat > pos-web/package.json << 'EOF'
{
  "name": "stocker-pos",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.0.2",
    "vite": "^5.0.0"
  }
}
EOF

# ─────────────────────────────────────────
# 4. pos-web/tsconfig.json
# ─────────────────────────────────────────
cat > pos-web/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > pos-web/tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

# ─────────────────────────────────────────
# 5. pos-web/vite.config.ts
# ─────────────────────────────────────────
cat > pos-web/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // 5173 is used by admin-web
  },
})
EOF

# ─────────────────────────────────────────
# 6. pos-web/tailwind.config.js
# ─────────────────────────────────────────
cat > pos-web/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // POS uses a distinct color palette from STOCKER (green vs blue)
        // so cashiers instantly know which app they're on
        primary: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
      },
    },
  },
  plugins: [],
}
EOF

cat > pos-web/postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# ─────────────────────────────────────────
# 7. pos-web/index.html
# ─────────────────────────────────────────
cat > pos-web/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>STOCKER POS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# ─────────────────────────────────────────
# 8. pos-web/.env.example
# ─────────────────────────────────────────
cat > pos-web/.env.example << 'EOF'
# Copy this to .env and fill in your values
VITE_API_URL=http://localhost:3000/api
EOF

# ─────────────────────────────────────────
# 9. pos-web/src/main.tsx
# ─────────────────────────────────────────
cat > pos-web/src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      {/* Toast notifications for sale confirmations, errors, etc. */}
      <Toaster
        position="top-center"
        toastOptions={{
          success: { duration: 3000 },
          error: { duration: 4000 },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
EOF

cat > pos-web/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Prevent accidental text selection during fast cashier interactions */
.no-select {
  -webkit-user-select: none;
  user-select: none;
}
EOF

# ─────────────────────────────────────────
# 10. pos-web/src/types/index.ts
# ─────────────────────────────────────────
cat > pos-web/src/types/index.ts << 'EOF'
// ============================================================
// SHARED TYPES — used across POS components
// ============================================================

/** Product as returned by the API (from STOCKER's products table) */
export interface Product {
  id: number
  sku: string
  name: string
  description: string | null
  category_id: number
  category_name: string   // joined from categories table
  unit_price: string      // PostgreSQL DECIMAL comes as string
  unit_of_measure: string
  current_stock: number   // calculated from inventory_transactions
  reorder_level: number
}

/** One item in the cashier's cart (before sale is created) */
export interface CartItem {
  product_id: number
  product_name: string
  unit_of_measure: string
  unit_price: number
  quantity: number
  subtotal: number        // unit_price * quantity
}

/** Payload sent to POST /api/pos/sales */
export interface CreateSalePayload {
  total_amount: number
  cash_tendered: number
  change_amount: number
  payment_method: 'cash'
  items: {
    product_id: number
    product_name: string
    unit_of_measure: string
    unit_price: number
    quantity: number
    subtotal: number
  }[]
}

/** Sale record returned by the API after creation */
export interface Sale {
  id: number
  cashier_id: number
  cashier_name: string
  total_amount: string
  cash_tendered: string
  change_amount: string
  payment_method: string
  created_at: string
  items: SaleItem[]
}

export interface SaleItem {
  id: number
  sale_id: number
  product_id: number
  product_name: string
  unit_of_measure: string
  unit_price: string
  quantity: number
  subtotal: string
}

/** Auth state stored in localStorage */
export interface AuthUser {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'cashier'
  token: string
}
EOF

# ─────────────────────────────────────────
# 11. pos-web/src/services/api.ts
# ─────────────────────────────────────────
cat > pos-web/src/services/api.ts << 'EOF'
import axios from 'axios'
import type { CreateSalePayload, Sale, Product, AuthUser } from '../types'

// Base URL from environment variable — set in .env file
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor ──────────────────────────────────────
// Automatically attaches JWT token to every request
// WHY: Avoids repeating token logic in every API call
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('pos_user')
  if (raw) {
    const user: AuthUser = JSON.parse(raw)
    config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
})

// ── Response interceptor ─────────────────────────────────────
// Handles 401 globally — logs user out if token expires
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────
export const authAPI = {
  /** Login — same endpoint as STOCKER (shared backend) */
  login: async (email: string, password: string): Promise<AuthUser> => {
    const res = await api.post('/auth/login', { email, password })
    return res.data.user
  },
}

// ─────────────────────────────────────────────────────────────
// PRODUCTS  (read-only from POS perspective)
// ─────────────────────────────────────────────────────────────
export const productAPI = {
  /** Get all products with current stock — for the product browser */
  getAll: async (): Promise<Product[]> => {
    const res = await api.get('/pos/products')
    return res.data.products
  },

  /** Search products by name or SKU */
  search: async (query: string): Promise<Product[]> => {
    const res = await api.get('/pos/products', { params: { search: query } })
    return res.data.products
  },
}

// ─────────────────────────────────────────────────────────────
// SALES
// ─────────────────────────────────────────────────────────────
export const salesAPI = {
  /** Create a sale + auto-generate inventory_transactions */
  create: async (payload: CreateSalePayload): Promise<Sale> => {
    const res = await api.post('/pos/sales', payload)
    return res.data.sale
  },

  /** Get sale by ID — for receipt display after checkout */
  getById: async (id: number): Promise<Sale> => {
    const res = await api.get(`/pos/sales/${id}`)
    return res.data.sale
  },

  /** Sales history — today's sales for the cashier dashboard */
  getHistory: async (params?: { from?: string; to?: string }): Promise<Sale[]> => {
    const res = await api.get('/pos/sales', { params })
    return res.data.sales
  },
}
EOF

# ─────────────────────────────────────────
# 12. pos-web/src/hooks/useAuth.ts
# ─────────────────────────────────────────
cat > pos-web/src/hooks/useAuth.ts << 'EOF'
import { useState, useCallback } from 'react'
import type { AuthUser } from '../types'

const STORAGE_KEY = 'pos_user'

/**
 * useAuth — manages login state for the POS app
 *
 * WHY separate from STOCKER's auth:
 * Both apps share the same backend /auth/login endpoint,
 * but store tokens independently so a cashier can be logged
 * into POS while an admin is logged into STOCKER on another tab.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  })

  const login = useCallback((userData: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  return { user, login, logout, isAuthenticated: !!user }
}
EOF

# ─────────────────────────────────────────
# 13. pos-web/src/hooks/useCart.ts
# ─────────────────────────────────────────
cat > pos-web/src/hooks/useCart.ts << 'EOF'
import { useState, useCallback } from 'react'
import type { CartItem, Product } from '../types'

/**
 * useCart — all cart logic in one place
 *
 * WHY a custom hook:
 * Cart state is needed by ProductBrowser, Cart, and Checkout.
 * Lifting it to App and passing as props works, but a hook is
 * cleaner and easier to test. (Context would also work — this
 * is simpler for the current scale.)
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  /** Add product to cart, or increment quantity if already there */
  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id)

      if (existing) {
        // Increment quantity and recalculate subtotal
        return prev.map((i) =>
          i.product_id === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: (i.quantity + 1) * i.unit_price,
              }
            : i
        )
      }

      // New item
      const price = parseFloat(product.unit_price)
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          unit_of_measure: product.unit_of_measure,
          unit_price: price,
          quantity: 1,
          subtotal: price,
        },
      ]
    })
  }, [])

  /** Update quantity directly (e.g., cashier types "3") */
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity reaches 0
      setItems((prev) => prev.filter((i) => i.product_id !== productId))
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, quantity, subtotal: quantity * i.unit_price }
          : i
      )
    )
  }, [])

  /** Remove a single item from cart */
  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }, [])

  /** Clear cart after successful sale */
  const clearCart = useCallback(() => setItems([]), [])

  /** Total before tax */
  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0)

  /** 12% VAT — standard Philippine VAT rate */
  const TAX_RATE = 0.12
  const tax = subtotal * TAX_RATE

  /** Grand total (what customer pays) */
  const total = subtotal + tax

  return { items, addItem, updateQuantity, removeItem, clearCart, subtotal, tax, total }
}
EOF

# ─────────────────────────────────────────
# 14. pos-web/src/utils/format.ts
# ─────────────────────────────────────────
cat > pos-web/src/utils/format.ts << 'EOF'
/**
 * Formatting utilities for the POS app
 * WHY: Centralizing formatting prevents inconsistency across receipts,
 * carts, and dashboards (e.g., ₱1,234.50 vs 1234.5)
 */

/** Format number as Philippine Peso */
export function formatPeso(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(num)
}

/** Format ISO date string as readable date + time */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** Get today's date as YYYY-MM-DD (for API query params) */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}
EOF

# ─────────────────────────────────────────
# 15. pos-web/src/App.tsx
# ─────────────────────────────────────────
cat > pos-web/src/App.tsx << 'EOF'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import POSPage from './pages/POSPage'
import SalesHistoryPage from './pages/SalesHistoryPage'

/**
 * App — top-level routing
 *
 * Route structure:
 *   /login          → LoginPage (public)
 *   /               → POSPage (protected — main cashier screen)
 *   /history        → SalesHistoryPage (protected)
 */
export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <POSPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/history"
        element={isAuthenticated ? <SalesHistoryPage /> : <Navigate to="/login" replace />}
      />
      {/* Catch-all: redirect unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
EOF

# ─────────────────────────────────────────
# 16. PLACEHOLDER PAGES (to be built next)
# ─────────────────────────────────────────
cat > pos-web/src/pages/LoginPage.tsx << 'EOF'
// TODO: Build in next step
export default function LoginPage() {
  return <div className="p-8 text-center text-gray-500">LoginPage — coming next</div>
}
EOF

cat > pos-web/src/pages/POSPage.tsx << 'EOF'
// TODO: Build in next step — this is the main cashier screen
export default function POSPage() {
  return <div className="p-8 text-center text-gray-500">POSPage — coming next</div>
}
EOF

cat > pos-web/src/pages/SalesHistoryPage.tsx << 'EOF'
// TODO: Build in next step
export default function SalesHistoryPage() {
  return <div className="p-8 text-center text-gray-500">SalesHistoryPage — coming next</div>
}
EOF

# ─────────────────────────────────────────
# 17. SQL MIGRATION FILE
# ─────────────────────────────────────────
mkdir -p server/migrations

cat > server/migrations/002_add_pos_tables.sql << 'EOF'
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
EOF

# ─────────────────────────────────────────
# 18. NEW BACKEND ROUTES FILE
# ─────────────────────────────────────────
mkdir -p server/src/routes

cat > server/src/routes/posRoutes.ts << 'EOF'
import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'  // reuse existing middleware
import * as posController from '../controllers/posController'

const router = Router()

// All POS routes require authentication
// WHY: Even read-only product browsing needs auth so random
//      internet users can't see your product catalog & prices

router.get('/products',       authenticateToken, posController.getProducts)
router.get('/products/:id',   authenticateToken, posController.getProductById)
router.post('/sales',         authenticateToken, posController.createSale)
router.get('/sales',          authenticateToken, posController.getSales)
router.get('/sales/:id',      authenticateToken, posController.getSaleById)

export default router
EOF

# ─────────────────────────────────────────
# 19. POS CONTROLLER SKELETON
# ─────────────────────────────────────────
mkdir -p server/src/controllers

cat > server/src/controllers/posController.ts << 'EOF'
import { Request, Response } from 'express'
import pool from '../config/db'  // reuse existing DB connection

// ─────────────────────────────────────────────────────────────
// GET /api/pos/products
// Returns all products with current stock (calculated)
// Optional: ?search=coca to filter by name or SKU
// ─────────────────────────────────────────────────────────────
export async function getProducts(req: Request, res: Response) {
  try {
    const { search } = req.query

    // WHY calculate stock here instead of storing it:
    // Stock = sum of all inventory_transactions. This gives us
    // a complete audit trail and is always accurate.
    const query = `
      SELECT
        p.id,
        p.sku,
        p.name,
        p.description,
        p.category_id,
        c.name AS category_name,
        p.unit_price,
        p.unit_of_measure,
        p.reorder_level,
        COALESCE(
          SUM(
            CASE
              WHEN it.transaction_type IN ('in', 'adjustment') THEN it.quantity
              WHEN it.transaction_type = 'out'                 THEN -it.quantity
              ELSE 0
            END
          ), 0
        ) AS current_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory_transactions it ON p.id = it.product_id
      WHERE ($1::text IS NULL OR p.name ILIKE $1 OR p.sku ILIKE $1)
      GROUP BY p.id, c.name
      ORDER BY p.name
    `

    const searchParam = search ? `%${search}%` : null
    const result = await pool.query(query, [searchParam])

    res.status(200).json({ products: result.rows })
  } catch (error) {
    console.error('getProducts error:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/pos/products/:id
// ─────────────────────────────────────────────────────────────
export async function getProductById(req: Request, res: Response) {
  try {
    const { id } = req.params
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name,
        COALESCE(SUM(CASE
          WHEN it.transaction_type IN ('in','adjustment') THEN it.quantity
          WHEN it.transaction_type = 'out' THEN -it.quantity
          ELSE 0 END), 0) AS current_stock
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory_transactions it ON p.id = it.product_id
       WHERE p.id = $1
       GROUP BY p.id, c.name`,
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }
    res.status(200).json({ product: result.rows[0] })
  } catch (error) {
    console.error('getProductById error:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/pos/sales
// Creates sale + sale_items + inventory_transactions (atomically)
// ─────────────────────────────────────────────────────────────
export async function createSale(req: Request, res: Response) {
  // Use a database transaction so either EVERYTHING saves or NOTHING does.
  // WHY: If the sale saves but inventory_transactions fail, stock would be
  //      wrong. Atomic operations = data integrity.
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { total_amount, cash_tendered, change_amount, payment_method, items } = req.body
    const cashierId = (req as any).user.id  // set by authenticateToken middleware

    // Basic validation
    if (!items || items.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Sale must have at least one item' })
    }

    // 1. Create the sale record
    const saleResult = await client.query(
      `INSERT INTO sales (cashier_id, total_amount, cash_tendered, change_amount, payment_method)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [cashierId, total_amount, cash_tendered, change_amount, payment_method ?? 'cash']
    )
    const sale = saleResult.rows[0]

    // 2. Create sale_items + inventory_transactions for each product
    for (const item of items) {
      // Insert sale item (with snapshot of product details)
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, product_name, unit_of_measure, unit_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sale.id, item.product_id, item.product_name, item.unit_of_measure,
         item.unit_price, item.quantity, item.subtotal]
      )

      // Automatically deduct from inventory
      // WHY: This is the "magic" that syncs POS → STOCKER.
      //      No manual syncing needed. One sale = one 'out' transaction per item.
      await client.query(
        `INSERT INTO inventory_transactions (product_id, transaction_type, quantity, user_id, notes)
         VALUES ($1, 'out', $2, $3, $4)`,
        [item.product_id, item.quantity, cashierId, `POS Sale #${sale.id}`]
      )
    }

    await client.query('COMMIT')

    // Return the complete sale with items for receipt display
    const fullSale = await getSaleData(sale.id)
    res.status(201).json({ message: 'Sale created successfully', sale: fullSale })

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('createSale error:', error)
    res.status(500).json({ error: 'Failed to create sale' })
  } finally {
    client.release()
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/pos/sales
// Query params: ?from=2024-01-01&to=2024-01-31
// ─────────────────────────────────────────────────────────────
export async function getSales(req: Request, res: Response) {
  try {
    const { from, to } = req.query

    const result = await pool.query(
      `SELECT s.*,
              u.first_name || ' ' || u.last_name AS cashier_name
       FROM sales s
       LEFT JOIN users u ON s.cashier_id = u.id
       WHERE ($1::date IS NULL OR s.created_at::date >= $1::date)
         AND ($2::date IS NULL OR s.created_at::date <= $2::date)
       ORDER BY s.created_at DESC
       LIMIT 100`,
      [from ?? null, to ?? null]
    )

    res.status(200).json({ sales: result.rows })
  } catch (error) {
    console.error('getSales error:', error)
    res.status(500).json({ error: 'Failed to fetch sales' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/pos/sales/:id
// ─────────────────────────────────────────────────────────────
export async function getSaleById(req: Request, res: Response) {
  try {
    const sale = await getSaleData(parseInt(req.params.id))
    if (!sale) return res.status(404).json({ error: 'Sale not found' })
    res.status(200).json({ sale })
  } catch (error) {
    console.error('getSaleById error:', error)
    res.status(500).json({ error: 'Failed to fetch sale' })
  }
}

// ── Helper: fetch sale with all items ────────────────────────
async function getSaleData(saleId: number) {
  const saleResult = await pool.query(
    `SELECT s.*, u.first_name || ' ' || u.last_name AS cashier_name
     FROM sales s LEFT JOIN users u ON s.cashier_id = u.id
     WHERE s.id = $1`,
    [saleId]
  )
  if (saleResult.rows.length === 0) return null

  const itemsResult = await pool.query(
    'SELECT * FROM sale_items WHERE sale_id = $1 ORDER BY id',
    [saleId]
  )

  return { ...saleResult.rows[0], items: itemsResult.rows }
}
EOF

# ─────────────────────────────────────────
# 20. REGISTER POS ROUTES IN SERVER (instructions)
# ─────────────────────────────────────────
cat > server/migrations/REGISTER_ROUTES.md << 'EOF'
# Register POS Routes in Your Express App

In your server/src/app.ts (or index.ts), add:

```typescript
import posRoutes from './routes/posRoutes'

// Add this line alongside your existing routes:
app.use('/api/pos', posRoutes)
```

That's it. Your existing routes are untouched.
EOF

# ─────────────────────────────────────────
# 21. ROOT README UPDATE
# ─────────────────────────────────────────
cat > MONOREPO_STRUCTURE.md << 'EOF'
# Stocker Monorepo Structure

```
stocker/
├── server/                    # Shared backend (ONE API for both apps)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── posController.ts    ← NEW
│   │   │   └── ... (existing)
│   │   └── routes/
│   │       ├── posRoutes.ts        ← NEW
│   │       └── ... (existing)
│   └── migrations/
│       ├── 002_add_pos_tables.sql  ← NEW — run this on Railway DB
│       └── REGISTER_ROUTES.md      ← NEW — instructions
│
├── admin-web/                 # STOCKER (renamed from client/)
│   └── src/ ...
│
└── pos-web/                   # POS — NEW
    ├── src/
    │   ├── hooks/
    │   │   ├── useAuth.ts          ← Auth state management
    │   │   └── useCart.ts          ← Cart logic
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── POSPage.tsx         ← Main cashier screen (build next)
    │   │   └── SalesHistoryPage.tsx
    │   ├── services/
    │   │   └── api.ts              ← All API calls
    │   ├── types/
    │   │   └── index.ts            ← TypeScript interfaces
    │   └── utils/
    │       └── format.ts           ← Peso formatting, dates
    ├── package.json
    ├── tailwind.config.js
    ├── tsconfig.json
    └── vite.config.ts

## Quick Start

# 1. Run the SQL migration on Railway
psql $DATABASE_URL -f server/migrations/002_add_pos_tables.sql

# 2. Register POS routes (see server/migrations/REGISTER_ROUTES.md)

# 3. Start POS dev server
cd pos-web
cp .env.example .env
npm install
npm run dev   # → http://localhost:5174
```
EOF

echo ""
echo "✅ MONOREPO STRUCTURE CREATED SUCCESSFULLY!"
echo ""
echo "📋 NEXT STEPS:"
echo "   1. cd pos-web && npm install"
echo "   2. Run server/migrations/002_add_pos_tables.sql on Railway"
echo "   3. Add posRoutes to server/src/app.ts (see REGISTER_ROUTES.md)"
echo "   4. Tell Claude: 'Ready to build LoginPage and POSPage'"
echo ""
echo "📁 Files created:"
echo "   pos-web/           — Full React + TS + Tailwind scaffold"
echo "   server/migrations/002_add_pos_tables.sql — DB migration"
echo "   server/src/routes/posRoutes.ts           — Express routes"  
echo "   server/src/controllers/posController.ts  — All POS logic"
echo "   MONOREPO_STRUCTURE.md                    — Reference doc"
