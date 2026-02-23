# 🏪 STOCKER + POS System

> A full-stack inventory management and point-of-sale system built for small businesses and sari-sari stores in the Philippines.

Built as a **monorepo** — two apps, one backend, one database. Changes in STOCKER reflect instantly in the POS and vice versa.

![STOCKER Dashboard](screenshots/dashboard.PNG)

---

## 🌐 Live Demo

| App | URL |
|---|---|
| STOCKER (Admin) | [stockerflow.vercel.app](https://stockerflow.vercel.app) |
| POS (Cashier) | _Coming soon_ |

| Test Account | Credentials |
|---|---|
| Email | demo@mail.com |
| Password | demo123 |

---

## 📸 Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.PNG)

### Products (Desktop)
![Products Desktop](screenshots/products.PNG)

### Inventory Transactions
![Inventory](screenshots/inventory.PNG)

### Dashboard (Mobile)
![Dashboard Mobile](screenshots/dashboard-mobile.PNG)

### Products (Mobile)
![Products Mobile](screenshots/products-mobile.PNG)

---

## ✨ Features

### STOCKER (Admin Dashboard)
- 📊 **Real-time Dashboard** — inventory value, low stock alerts, recent transactions
- 📦 **Product Management** — full CRUD with unit of measure support
- 📁 **Categories & Suppliers** — organize your inventory
- 📈 **Inventory Tracking** — stock in, stock out, adjustments with full audit trail
- ⚠️ **Low Stock Alerts** — notified when stock hits reorder level
- 📱 **Mobile Responsive** — desktop table view + mobile card view

### POS (Cashier Screen)
- 🛍️ **Product Browser** — searchable product grid with live stock levels
- 🛒 **Cart** — add items, adjust quantities, remove items
- 💵 **Checkout** — cash tendered + automatic change calculation
- 🧾 **Receipt** — shown after every sale
- 📋 **Sales History** — today's sales with total revenue summary
- 📱 **Mobile-First** — tab layout on phone, split panel on tablet/desktop
- 👴 **Accessible** — large touch targets, clear labels, designed for non-tech-savvy users

### System-Wide
- 🔄 **Automatic Sync** — POS sales instantly deduct from STOCKER inventory
- 🔐 **JWT Authentication** — separate sessions for admin and cashier
- 🇵🇭 **Philippine-ready** — VAT (12%), peso formatting, local units of measure

---

## 🏗️ System Design

```
┌─────────────────┐     ┌─────────────────┐
│   STOCKER       │     │   POS           │
│   (Admin)       │     │   (Cashier)     │
│   admin-web/    │     │   pos-web/      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └──────────┬────────────┘
                    │
         ┌──────────▼────────────┐
         │   Express Backend     │
         │   server/             │
         └──────────┬────────────┘
                    │
         ┌──────────▼────────────┐
         │   PostgreSQL          │
         │   One shared database │
         └───────────────────────┘
```

**Why monorepo?** Both apps share one backend and one database. When a cashier processes a sale, the POS writes an `inventory_transaction` row — the same table STOCKER reads to calculate stock. No syncing layer needed.

---

## 🛠️ Tech Stack

### Frontend (Both Apps)
| Tech | Purpose |
|---|---|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| React Router | Navigation |
| Axios | API Calls |
| Vite | Build Tool |

### Backend
| Tech | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | Web Framework |
| PostgreSQL | Database |
| JWT | Authentication |
| bcrypt | Password Hashing |

### Deployment
| Service | Purpose |
|---|---|
| Vercel | Frontend Hosting |
| Railway | Backend + Database |

---

## 🗄️ Database Schema

```sql
users (id, email, password_hash, first_name, last_name, role, created_at)

categories (id, name, description, created_at)

suppliers (id, name, contact_person, email, phone, address, created_at)

products (
  id, sku, name, description,
  category_id → categories,
  supplier_id → suppliers,
  unit_price, unit_of_measure,
  reorder_level, created_at, updated_at
)

inventory_transactions (
  id, product_id → products,
  transaction_type ['in'|'out'|'adjustment'],
  quantity, user_id → users, notes, created_at
)

-- THE BRIDGE: POS writes 'out' rows, STOCKER writes 'in' rows.
-- Both apps read the same table. Stock = SUM of all transactions.

sales (
  id, cashier_id → users,
  total_amount, cash_tendered, change_amount,
  payment_method, created_at
)

sale_items (
  id, sale_id → sales, product_id → products,
  product_name,     -- snapshot: frozen at time of sale
  unit_of_measure,  -- snapshot: won't change if product is edited later
  unit_price,       -- snapshot: receipt always shows what customer paid
  quantity, subtotal
)
```

**Key decisions:**
- **Stock is calculated, not stored** — `current_stock = SUM(transactions)`. Complete audit trail, always accurate.
- **Snapshots in sale_items** — product name/price can change later. Receipts show what the customer actually paid.
- **Atomic transactions** — sale + sale_items + inventory_transactions saved together. If anything fails, nothing saves.

---

## 🔌 API Reference

### Authentication
```
POST  /api/auth/login        Login (returns JWT)
POST  /api/auth/register     Register new user
GET   /api/auth/me           Get current user
```

### Products
```
GET    /api/products          All products with stock levels
GET    /api/products/:id      Single product
POST   /api/products          Create product
PUT    /api/products/:id      Update product
DELETE /api/products/:id      Delete product
```

### Inventory
```
GET   /api/inventory/transactions        All transactions
POST  /api/inventory/transactions        Create transaction
GET   /api/inventory/transactions/recent Recent activity
GET   /api/inventory/stock/low           Low stock products
```

### POS
```
GET   /api/pos/products        Products with live stock (for cashier)
GET   /api/pos/products/:id    Single product
POST  /api/pos/sales           Create sale (atomic)
GET   /api/pos/sales           Sales list (filterable by date)
GET   /api/pos/sales/:id       Single sale with line items
```

---

## 📁 Project Structure

```
stocker/
├── admin-web/          # STOCKER — React admin dashboard
│   └── src/
│       ├── components/
│       │   ├── Products/
│       │   │   └── ProductModal.tsx
│       │   ├── Dashboard/
│       │   ├── Layout.tsx
│       │   └── Navbar.tsx
│       ├── pages/
│       │   ├── DashboardPage.tsx
│       │   ├── ProductsPage.tsx
│       │   ├── CategoriesPage.tsx
│       │   ├── SuppliersPage.tsx
│       │   └── InventoryPage.tsx
│       ├── context/AuthContext.tsx
│       └── services/api.ts
│
├── pos-web/            # POS — React cashier screen
│   └── src/
│       ├── components/
│       │   ├── cart/CheckoutModal.tsx
│       │   └── receipt/ReceiptModal.tsx
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── POSPage.tsx
│       │   └── SalesHistoryPage.tsx
│       ├── context/AuthContext.tsx
│       ├── hooks/useCart.ts
│       └── services/api.ts
│
└── server/             # Shared Express backend
    └── src/
        ├── controllers/
        │   ├── authController.ts
        │   ├── productController.ts
        │   ├── inventoryController.ts
        │   └── posController.ts
        ├── models/
        │   └── productModel.ts
        ├── routes/
        │   ├── authRoutes.ts
        │   ├── productRoutes.ts
        │   ├── inventoryRoutes.ts
        │   └── posRoutes.ts
        ├── middleware/authMiddleware.ts
        └── config/database.ts
```

---

## 🏃 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone
```bash
git clone https://github.com/E7itism/stockerflow.git
cd stockerflow
```

### 2. Backend
```bash
cd server
npm install
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET

npm run build
npm run migrate
npm start
# Runs on http://localhost:5000
```

### 3. STOCKER (Admin)
```bash
cd admin-web
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api

npm run dev
# Opens at http://localhost:5173
```

### 4. POS (Cashier)
```bash
cd pos-web
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api

npm run dev
# Opens at http://localhost:5174
```

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
```bash
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/stocker
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### Frontend (`admin-web/.env` and `pos-web/.env`)
```bash
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Deployment

### Frontend → Vercel
1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Set root directory to `admin-web` or `pos-web`
4. Add environment variable: `VITE_API_URL=https://your-railway-url.railway.app/api`
5. Deploy

### Backend → Railway
1. Create project in [railway.app](https://railway.app)
2. Add PostgreSQL service
3. Deploy from GitHub, root directory: `server`
4. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
5. Run migration: `npm run migrate`

---

## 📋 Changelog

### v2.0.0 (February 2026)
- ✅ Added full POS system (pos-web)
- ✅ Monorepo structure (admin-web + pos-web + server)
- ✅ Sales and sale_items tables with receipt snapshots
- ✅ Automatic inventory sync — POS sales deduct from STOCKER
- ✅ Mobile-first POS with tab navigation
- ✅ Sales history page
- ✅ unit_of_measure field on products

### v1.0.0 (February 2026)
- ✅ STOCKER inventory management system
- ✅ Full CRUD for products, categories, suppliers
- ✅ Dashboard with real-time stats
- ✅ Low stock alerts
- ✅ JWT authentication
- ✅ Mobile responsive

---

## 👨‍💻 Author

**Eliezer Gaudiel Jr**
- GitHub: [E7itism](https://github.com/E7itism)
- LinkedIn: [esgaudiel](https://www.linkedin.com/in/esgaudiel)
- Location: Philippines

---

## 📜 License

MIT License — feel free to use this for learning or as a portfolio piece.
