# StockerFlow — Inventory Management + POS System

A full-stack inventory management and point-of-sale system built for small businesses in the Philippines. Built as a unified app — one React frontend, one Express backend, one PostgreSQL database. Changes in the admin dashboard reflect instantly in the POS cashier screen via real-time Socket.io sync.

---

## Live Demo

| App | URL |
| --- | --- |
| StockerFlow (Admin + POS) | [stockerflow.vercel.app](https://stockerflow.vercel.app) |
| Backend API | [stockerflow-production.up.railway.app/api](https://stockerflow-production.up.railway.app/api) |

| Credential | Value |
| --- | --- |
| Email | admin@demo.com |
| Password | demo123 |
| Role | Admin (full access) |

---

## Screenshots

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

### POS — Product Browser
![POS Products](screenshots/pos-products.PNG)

### POS — Cart
![POS Cart](screenshots/pos-cart.PNG)

### POS — Checkout
![POS Checkout](screenshots/pos-checkout.PNG)

### POS — Receipt
![POS Receipt](screenshots/pos-receipt.PNG)

### POS — Mobile View
![POS Mobile](screenshots/pos-mobile.PNG)

---

## Features

### Admin Dashboard

- **Real-time Dashboard** — inventory value, revenue chart (last 30 days), low stock alerts, recent activity
- **Product Management** — full CRUD with SKU, unit of measure, reorder level, category, and supplier
- **Inventory Tracking** — stock in, stock out, and adjustments with full audit trail. Filters by search, type, category, and date range
- **Sales Reports** — date-filtered summary cards, top 5 products, paginated transaction list with expandable line items, CSV export
- **User Management** — assign roles, deactivate/reactivate accounts (admin only)
- **Role-Based Access Control** — admin, manager, and staff with granular permissions on both frontend and backend
- **Mobile Responsive** — desktop table view with mobile card fallback on every page

### POS Cashier Screen

- **Product Browser** — category filter, search, live stock levels
- **Cart** — add items, adjust quantities, remove items
- **Checkout** — cash tendered with automatic change calculation and Philippine peso denomination shortcuts
- **Receipt** — printed after every sale with snapshot pricing
- **Sales History** — today's transactions with total revenue summary
- **Mobile-First** — tab layout on phones, split panel on tablet and desktop

### Real-Time Sync

- **Socket.io integration** — when a cashier completes a sale, the admin dashboard updates automatically (stats, revenue chart, inventory list, product stock counts) without a page refresh
- **Bidirectional** — manual stock adjustments from the admin side silently refresh the POS product grid so cashiers always see accurate stock

---

## Role-Based Access Control

| Page / Action | Admin | Manager | Staff |
| --- | --- | --- | --- |
| Dashboard | ✅ | ✅ | ✅ |
| POS (cashier screen) | ✅ | ✅ | ✅ |
| Products (view) | ✅ | ✅ | ✅ |
| Products (add / edit) | ✅ | ✅ | ❌ |
| Products (delete) | ✅ | ❌ | ❌ |
| Inventory | ✅ | ✅ | ✅ |
| Categories | ✅ | ✅ | ❌ |
| Suppliers | ✅ | ✅ | ❌ |
| Sales Reports | ✅ | ✅ | ❌ |
| Revenue Chart | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ |

Enforced on both frontend (route guards, sidebar filtering, conditional UI elements) and backend (middleware on every protected route).

---

## System Design

```
┌─────────────────────────────────────────────┐
│          StockerFlow (admin-web)             │
│                                             │
│  Admin Dashboard  │  POS Cashier (/pos)     │
│  - Inventory      │  - Product browser      │
│  - Reports        │  - Cart + Checkout      │
│  - Users          │  - Receipt              │
└──────────────┬──────────────────────────────┘
               │ HTTP + WebSocket (Socket.io)
    ┌──────────┴──────────┐
    │   Express Backend   │
    │      server/        │
    └──────────┬──────────┘
               │
    ┌──────────┴──────────┐
    │     PostgreSQL      │
    │   Shared database   │
    └─────────────────────┘
```

**Why a single unified app?** The admin dashboard and POS share the same authentication, role system, and API. Merging them into one app eliminates duplicate auth logic, reduces deployment complexity, and lets the sidebar link directly to `/pos` from any admin page.

**Real-time sync flow:**
```
Cashier completes sale (POST /api/pos/sales)
       ↓
Backend emits socket event: sale:created
       ↓
Admin dashboard receives event
       ↓
Dashboard, Inventory, Products pages refetch silently
```

---

## Tech Stack

### Frontend (admin-web)

| Technology | Purpose |
| --- | --- |
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool (migrated from CRA) |
| Tailwind CSS v4 | Styling |
| shadcn/ui | Component library |
| Lucide React | Icons |
| React Router v6 | Client-side routing |
| Axios | HTTP client |
| Recharts v3 | Revenue area chart |
| Socket.io Client | Real-time updates |
| react-hot-toast | Toast notifications |

### Backend (server)

| Technology | Purpose |
| --- | --- |
| Node.js 18 | Runtime |
| Express.js | Web framework |
| PostgreSQL | Database |
| pg | Database client |
| JWT | Authentication |
| bcrypt | Password hashing |
| Socket.io | Real-time events |
| TypeScript | Type safety |

### Deployment

| Service | Purpose |
| --- | --- |
| Vercel | Frontend (SPA with rewrite rules) |
| Railway | Backend + PostgreSQL |

---

## Database Schema

```sql
users (
  id, email, password_hash,
  first_name, last_name,
  role,       -- 'admin' | 'manager' | 'staff'
  is_active,  -- soft delete: preserves audit trail
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

-- Stock is never stored. Always calculated:
-- current_stock = SUM(quantity WHERE type='in') - SUM(quantity WHERE type='out')

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

- **Stock is calculated, not stored.** `current_stock` is always the sum of all inventory transactions. Complete audit trail, zero sync bugs.
- **Snapshot pattern in sale_items.** Product name and price are copied at sale time so receipts always reflect what the customer paid, even if the product is edited later.
- **Atomic sale transactions.** Creating a sale wraps `sales`, `sale_items`, and `inventory_transactions` in a single DB transaction. If anything fails, nothing saves.
- **Soft delete on users.** `is_active = false` blocks login without destroying historical data. Sales and inventory records remain correctly attributed.
- **generate_series for revenue chart.** Fills days with no sales as 0 so the chart always shows a complete unbroken line.
- **Socket.io emits after DB commit.** Events are only emitted after the transaction successfully commits to prevent UI updates based on data that never saved.

---

## Socket.io Events

| Event | Emitted by | Listened by | Action |
| --- | --- | --- | --- |
| `sale:created` | posController (after commit) | Dashboard, Inventory, Products, POS | Refetch stats, transactions, stock counts |
| `stock:updated` | inventoryController | Dashboard, Inventory, Products, POS | Refetch low stock, transactions, stock counts |

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
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
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
GET   /api/inventory/transactions
POST  /api/inventory/transactions
GET   /api/inventory/transactions/recent
GET   /api/inventory/stock/low
GET   /api/inventory/products/:id/stock
```

### Dashboard

```
GET   /api/dashboard/stats
```

### POS

```
GET   /api/pos/products
POST  /api/pos/sales
GET   /api/pos/sales
GET   /api/pos/sales/:id
```

### Reports (admin and manager only)

```
GET   /api/reports/summary?from=&to=
GET   /api/reports/sales?from=&to=&page=&limit=
GET   /api/reports/sales/:id/items
GET   /api/reports/revenue-chart?days=30
```

### Users (admin only)

```
GET   /api/users
PUT   /api/users/:id/role
PUT   /api/users/:id/status
```

---

## Project Structure

```
stockerflow/
├── admin-web/                   # React app — admin dashboard + POS
│   └── src/
│       ├── components/
│       │   ├── Dashboard/       # OverviewCards, RevenueChart, LowStockAlert, etc.
│       │   ├── Products/        # ProductModal
│       │   ├── pos/             # CheckoutModal, ReceiptModal
│       │   └── ui/              # shadcn components
│       ├── pages/
│       │   ├── DashboardPage.tsx
│       │   ├── ProductsPage.tsx
│       │   ├── CategoriesPage.tsx
│       │   ├── SupplierPage.tsx
│       │   ├── InventoryPage.tsx
│       │   ├── SalesReportsPage.tsx
│       │   ├── UsersPage.tsx
│       │   └── pos/
│       │       ├── POSPage.tsx
│       │       └── SalesHistoryPage.tsx
│       ├── context/AuthContext.tsx
│       ├── hooks/
│       │   ├── useRole.ts       # isAdmin, canEdit, canDelete, canViewReports
│       │   ├── useSocket.ts     # Socket.io connection lifecycle
│       │   └── pos/useCart.ts
│       ├── types/pos.ts
│       └── services/api.ts
│
└── server/                      # Shared Express backend
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
        │   ├── posController.ts       # emits sale:created
        │   ├── productController.ts
        │   ├── reportsController.ts   # revenue chart with generate_series
        │   ├── supplierController.ts
        │   └── userController.ts
        ├── routes/
        ├── middleware/authMiddleware.ts
        ├── config/database.ts
        └── server.ts                  # Socket.io attached to HTTP server
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

### 3. Frontend

```bash
cd admin-web
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api

npm run dev
# Runs on http://localhost:3001
# POS available at http://localhost:3001/pos
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

### Frontend (`admin-web/.env`)

```bash
VITE_API_URL=http://localhost:5000/api
```

---

## Deployment

### Frontend — Vercel

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Set root directory to `admin-web`
4. Set environment variable: `VITE_API_URL=https://your-railway-url.railway.app/api`
5. Add `vercel.json` for SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Backend — Railway

1. Create a new project at [railway.app](https://railway.app)
2. Add a PostgreSQL service
3. Deploy from GitHub with root directory set to `server`
4. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
5. Pre-deploy command: `npm run build`
6. Start command: `npm run deploy` (runs migrate then start)

---

## Changelog

### v4.0.0 (April 2026)

- Merged POS into STOCKER as a unified single app at `/pos` route
- Real-time sync via Socket.io — admin dashboard and POS update instantly without refresh
- Socket listeners on Dashboard, Inventory, Products, and Sales Reports pages
- POS link added to sidebar (visible to all roles)
- Removed separate pos-web deployment

### v3.0.0 (March 2026)

- Role-based access control (admin / manager / staff)
- User management — role assignment, deactivate / reactivate accounts
- Sales Reports — date filter, summary cards, top products, CSV export
- Revenue chart on dashboard (Recharts, admin and manager only)
- Low stock banner with direct link to inventory
- Full shadcn/ui redesign of admin dashboard
- Migrated admin-web from Create React App to Vite
- Demo login button

### v2.0.0 (February 2026)

- Full POS system
- Monorepo structure
- Sales and sale_items with receipt snapshots
- Automatic inventory sync — POS sales deduct from STOCKER
- Mobile-first POS with tab navigation
- Sequential migration system

### v1.0.0 (February 2026)

- STOCKER inventory management system
- Full CRUD for products, categories, suppliers
- Dashboard with stats
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
