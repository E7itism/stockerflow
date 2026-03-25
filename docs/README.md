# Stockerflow — Inventory Management and POS System

A full-stack inventory management and point-of-sale system built for small businesses in the Philippines. Built as a monorepo — two frontend apps sharing one Express backend and one PostgreSQL database. Changes in STOCKER reflect instantly in the POS and vice versa.

---

## Live Demo

| App             | URL                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------- |
| STOCKER (Admin) | [stockerflow.vercel.app](https://stockerflow.vercel.app)                                       |
| STOCKPOS (POS)  | [stockerflow-pos.vercel.app](https://stockerflow-pos.vercel.app)                               |
| Backend API     | [stockerflow-production.up.railway.app/api](https://stockerflow-production.up.railway.app/api) |

| Credential | Value               |
| ---------- | ------------------- |
| Email      | admin@demo.com      |
| Password   | demo123             |
| Role       | Admin (full access) |

---

## Screenshots

### STOCKER — Dashboard

![Dashboard](screenshots/dashboard.PNG)

### STOCKER — Products (Desktop)

![Products Desktop](screenshots/products.PNG)

### STOCKER — Inventory Transactions

![Inventory](screenshots/inventory.PNG)

### STOCKER — Dashboard (Mobile)

![Dashboard Mobile](screenshots/dashboard-mobile.PNG)

### STOCKER — Products (Mobile)

![Products Mobile](screenshots/products-mobile.PNG)

### STOCKPOS — Login

![POS Login](screenshots/pos-login.PNG)

### STOCKPOS — Product Browser

![POS Products](screenshots/pos-products.PNG)

### STOCKPOS — Cart

![POS Cart](screenshots/pos-cart.PNG)

### STOCKPOS — Checkout

![POS Checkout](screenshots/pos-checkout.PNG)

### STOCKPOS — Receipt

![POS Receipt](screenshots/pos-receipt.PNG)

### STOCKPOS — Mobile View

![POS Mobile](screenshots/pos-mobile.PNG)

---

## Features

### STOCKER (Admin Dashboard)

- **Real-time Dashboard** — inventory value, revenue chart, low stock alerts, recent transactions
- **Product Management** — full CRUD with SKU, unit of measure, reorder level, category, and supplier
- **Categories and Suppliers** — organize inventory with relational data
- **Inventory Tracking** — stock in, stock out, and adjustments with full audit trail
- **Sales Reports** — date-filtered summary, top products, transaction list, CSV export
- **User Management** — invite users, assign roles, deactivate accounts
- **Role-Based Access Control** — admin, manager, and staff roles with granular permissions
- **Mobile Responsive** — desktop table view with mobile card fallback

### STOCKPOS (Cashier Screen)

- **Product Browser** — category filter, search, live stock levels
- **Cart** — add items, adjust quantities, remove items
- **Checkout** — cash tendered with automatic change calculation
- **Receipt** — printed after every sale with snapshot pricing
- **Sales History** — today's transactions with revenue summary
- **Mobile-First** — tab layout on phone, split panel on tablet and desktop

### System-Wide

- **Automatic Sync** — POS sales instantly deduct from STOCKER inventory via shared DB
- **JWT Authentication** — separate sessions for admin and cashier apps
- **Philippine-ready** — peso formatting, local units of measure

---

## Role-Based Access Control

| Page / Action         | Admin | Manager | Staff |
| --------------------- | ----- | ------- | ----- |
| Dashboard             | Yes   | Yes     | Yes   |
| Products (view)       | Yes   | Yes     | Yes   |
| Products (add / edit) | Yes   | Yes     | No    |
| Products (delete)     | Yes   | No      | No    |
| Inventory             | Yes   | Yes     | Yes   |
| Categories            | Yes   | Yes     | No    |
| Suppliers             | Yes   | Yes     | No    |
| Sales Reports         | Yes   | Yes     | No    |
| Revenue Chart         | Yes   | Yes     | No    |
| User Management       | Yes   | No      | No    |

Enforced on both frontend (route guards, sidebar filtering, conditional UI) and backend (middleware on every protected route).

---

## System Design

```
+------------------+       +------------------+
|    STOCKER       |       |    STOCKPOS      |
|    (Admin)       |       |    (Cashier)     |
|    admin-web/    |       |    pos-web/      |
+--------+---------+       +--------+---------+
         |                          |
         +-------------+------------+
                       |
              +--------+---------+
              |  Express Backend  |
              |    server/        |
              +--------+---------+
                       |
              +--------+---------+
              |    PostgreSQL     |
              |  Shared database  |
              +------------------+
```

**Why a monorepo?** Both apps share one backend and one database. When a cashier processes a sale, the POS writes an `inventory_transaction` row — the same table STOCKER reads to calculate stock. No syncing layer, no duplication.

---

## Tech Stack

### STOCKER (admin-web)

| Technology      | Purpose             |
| --------------- | ------------------- |
| React 18        | UI framework        |
| TypeScript      | Type safety         |
| Vite            | Build tool          |
| Tailwind CSS v4 | Styling             |
| shadcn/ui       | Component library   |
| Lucide React    | Icons               |
| React Router v6 | Client-side routing |
| Axios           | HTTP client         |
| Recharts        | Revenue chart       |
| react-hot-toast | Toast notifications |

### STOCKPOS (pos-web)

| Technology      | Purpose             |
| --------------- | ------------------- |
| React 18        | UI framework        |
| TypeScript      | Type safety         |
| Vite            | Build tool          |
| Tailwind CSS    | Styling             |
| React Router v7 | Client-side routing |
| Axios           | HTTP client         |
| react-hot-toast | Toast notifications |

### Backend (server)

| Technology | Purpose          |
| ---------- | ---------------- |
| Node.js 18 | Runtime          |
| Express.js | Web framework    |
| PostgreSQL | Database         |
| pg         | Database client  |
| JWT        | Authentication   |
| bcrypt     | Password hashing |
| TypeScript | Type safety      |

### Deployment

| Service | Purpose              |
| ------- | -------------------- |
| Vercel  | Both frontend apps   |
| Railway | Backend + PostgreSQL |

---

## Database Schema

```sql
users (
  id, email, password_hash,
  first_name, last_name,
  role,        -- 'admin' | 'manager' | 'staff'
  is_active,   -- soft delete: preserves audit trail
  created_at
)

categories (id, name, description, created_at)

suppliers (id, name, contact_person, email, phone, address, created_at)

products (
  id, sku, name, description,
  category_id  --> categories,
  supplier_id  --> suppliers,
  unit_price, unit_of_measure,
  reorder_level, created_at, updated_at
)

inventory_transactions (
  id, product_id --> products,
  transaction_type,  -- 'in' | 'out' | 'adjustment'
  quantity, user_id --> users,
  notes, created_at
)

-- Stock is never stored. It is always calculated:
-- current_stock = SUM(quantity) across all transactions for a product

sales (
  id, cashier_id --> users,
  total_amount, cash_tendered, change_amount,
  payment_method, created_at
)

sale_items (
  id, sale_id --> sales, product_id --> products,
  product_name,    -- snapshot at time of sale
  unit_of_measure, -- snapshot at time of sale
  unit_price,      -- snapshot at time of sale
  quantity, subtotal
)
```

**Key architectural decisions:**

- **Stock is calculated, not stored.** `current_stock` is a database view — the sum of all inventory transactions per product. This gives a complete audit trail and eliminates sync bugs.
- **Snapshot pattern in sale_items.** Product name and price are copied at sale time. Receipts always reflect what the customer actually paid, even if the product is edited later.
- **Atomic sale transactions.** Creating a sale wraps the insert into `sales`, `sale_items`, and `inventory_transactions` in a single DB transaction. If anything fails, nothing is saved.
- **Soft delete on users.** Setting `is_active = false` blocks login without destroying historical data. Sales and inventory records remain intact and attributed correctly.

---

## API Reference

### Authentication

```
POST  /api/auth/login       Login — returns JWT, blocks inactive users
POST  /api/auth/register    Register new user
GET   /api/auth/me          Get current user from token
```

### Products

```
GET    /api/products          All products with stock levels
GET    /api/products/:id      Single product
POST   /api/products          Create product
PUT    /api/products/:id      Update product
DELETE /api/products/:id      Delete product
```

### Categories / Suppliers

```
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

GET    /api/suppliers
POST   /api/suppliers
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id
```

### Inventory

```
GET   /api/inventory/transactions           All transactions
POST  /api/inventory/transactions           Create transaction
GET   /api/inventory/transactions/recent    Recent activity
GET   /api/inventory/stock/low              Products below reorder level
GET   /api/inventory/products/:id/stock     Stock level for one product
```

### Dashboard

```
GET   /api/dashboard/stats    Summary stats for dashboard cards
```

### POS

```
GET   /api/pos/products          Products with live stock (cashier view)
POST  /api/pos/sales             Create sale — atomic
GET   /api/pos/sales             Sales list, filterable by ?from=&to=
GET   /api/pos/sales/:id         Single sale with line items
```

### Reports (admin and manager only)

```
GET   /api/reports/summary?from=&to=            Summary cards
GET   /api/reports/sales?from=&to=&page=&limit= Paginated transactions
GET   /api/reports/sales/:id/items              Line items for one sale
GET   /api/reports/revenue-chart?days=30        Daily revenue using generate_series
```

### Users (admin only)

```
GET   /api/users                All users
PUT   /api/users/:id/role       Update role
PUT   /api/users/:id/status     Activate or deactivate
```

---

## Project Structure

```
stockerflow/
├── admin-web/                  # STOCKER — React admin dashboard
│   └── src/
│       ├── components/
│       │   ├── Dashboard/      # OverviewCards, RevenueChart, LowStockAlert, etc.
│       │   ├── Products/       # ProductModal (shadcn Dialog)
│       │   ├── ui/             # shadcn components
│       │   ├── Layout.tsx
│       │   ├── Sidebar.tsx     # Role-filtered navigation
│       │   ├── ProtectedRoute.tsx
│       │   └── RoleProtectedRoute.tsx
│       ├── pages/
│       │   ├── DashboardPage.tsx
│       │   ├── ProductsPage.tsx
│       │   ├── CategoriesPage.tsx
│       │   ├── SupplierPage.tsx
│       │   ├── InventoryPage.tsx
│       │   ├── SalesReportsPage.tsx
│       │   ├── UsersPage.tsx
│       │   ├── LoginPage.tsx
│       │   └── RegisterPage.tsx
│       ├── context/AuthContext.tsx
│       ├── hooks/useRole.ts    # isAdmin, canEdit, canDelete, canViewReports
│       └── services/api.ts
│
├── pos-web/                    # STOCKPOS — Cashier screen
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
└── server/                     # Shared Express backend
    ├── migrations/
    │   ├── 001_init.sql
    │   ├── 002_add_pos_tables.sql
    │   ├── 003_add_user_management.sql
    │   └── 004_seed_admin.sql
    └── src/
        ├── controllers/
        │   ├── authController.ts
        │   ├── categoryController.ts
        │   ├── dashboardController.ts
        │   ├── inventoryController.ts
        │   ├── posController.ts
        │   ├── productController.ts
        │   ├── reportsController.ts
        │   ├── supplierController.ts
        │   └── userController.ts
        ├── routes/
        ├── middleware/authMiddleware.ts
        ├── config/database.ts
        └── server.ts
```

---

## Quick Start

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
# Runs on http://localhost:3001
```

### 4. STOCKPOS (Cashier)

```bash
cd pos-web
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api

npm run dev
# Runs on http://localhost:5174
```

---

## Environment Variables

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

## Deployment

### Frontend — Vercel

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Set root directory to `admin-web` or `pos-web`
4. Set environment variable: `VITE_API_URL=https://your-railway-url.railway.app/api`
5. Add `vercel.json` in the app folder for SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

6. Deploy

### Backend — Railway

1. Create a new project at [railway.app](https://railway.app)
2. Add a PostgreSQL service
3. Deploy from GitHub with root directory set to `server`
4. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
5. Pre-deploy command: `npm run build`
6. Start command: `npm run deploy` (runs migrate then start)

---

## Changelog

### v3.0.0 (March 2026)

- Role-based access control (admin / manager / staff)
- User management page — role assignment, deactivate / reactivate accounts
- Sales Reports — date filter, summary cards, top products, CSV export
- Revenue chart on dashboard (Recharts, admin and manager only)
- Low stock banner with link to inventory page
- Full shadcn/ui redesign of admin dashboard
- Migrated admin-web from Create React App to Vite
- Demo login button on both apps

### v2.0.0 (February 2026)

- Full POS system (pos-web)
- Monorepo structure (admin-web + pos-web + server)
- Sales and sale_items tables with receipt snapshots
- Automatic inventory sync — POS sales deduct from STOCKER
- Mobile-first POS with tab navigation
- Sales history page
- Sequential migration system
- Deployed POS to Vercel

### v1.0.0 (February 2026)

- STOCKER inventory management system
- Full CRUD for products, categories, suppliers
- Dashboard with real-time stats
- Low stock alerts
- JWT authentication
- Mobile responsive layout

---

## Author

**Eliezer Gaudiel Jr**

- GitHub: [E7itism](https://github.com/E7itism)
- LinkedIn: [esgaudiel](https://www.linkedin.com/in/esgaudiel)
- Location: Philippines

---

## License

MIT License — free to use for learning or as a portfolio reference.
