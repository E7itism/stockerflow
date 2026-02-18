# 🏪 STOCKER - Inventory Management System

> A full-stack inventory management system built for small businesses and sari-sari stores in the Philippines.

![STOCKER Dashboard](screenshots/dashboard)

## 🌐 Live Demo

**→ [View Live App ] https://stockerflow-8fodof5ml-e7itisms-projects.vercel.app/**

| Test Account | Credentials      |
| ------------ | ---------------- |
| Email        | demo@stocker.com |
| Password     | demo123          |

---

## 📸 Screenshots

### Dashboard

![Dashboard](screenshots/dashboard)

### Products (Desktop)

![Products Desktop](screenshots/products)

### Products (Mobile)

![Products Mobile](screenshots/products-mobile)

### Inventory Transactions

![Inventory](screenshots/inventory)

---

## ✨ Features

- 📊 **Real-time Dashboard** — Overview cards, inventory value, low stock alerts
- 📦 **Product Management** — Full CRUD with search and filters
- 📁 **Categories & Suppliers** — Organize your inventory
- 📈 **Inventory Tracking** — Stock in, stock out, adjustments
- ⚠️ **Low Stock Alerts** — Get notified when stock is running low
- 🔐 **Authentication** — JWT-based login and registration
- 📱 **Mobile Responsive** — Works on any device
- 🇵🇭 **Philippine-ready** — Built with sari-sari stores in mind

---

## 🛠️ Tech Stack

### Frontend

| Tech         | Purpose      |
| ------------ | ------------ |
| React 18     | UI Framework |
| TypeScript   | Type Safety  |
| Tailwind CSS | Styling      |
| React Router | Navigation   |
| Axios        | API Calls    |
| Recharts     | Charts       |

### Backend

| Tech       | Purpose          |
| ---------- | ---------------- |
| Node.js    | Runtime          |
| Express.js | Web Framework    |
| PostgreSQL | Database         |
| JWT        | Authentication   |
| bcrypt     | Password Hashing |

### Deployment

| Service | Purpose            |
| ------- | ------------------ |
| Vercel  | Frontend Hosting   |
| Railway | Backend + Database |

---

## 🏃 Quick Start

### Prerequisites

- Node.js 16+
- PostgreSQL 14+
- npm

### 1. Clone the repo

```bash
git clone https://github.com/E7itism/stockerflow.git
cd stocker
```

### 2. Setup Backend

```bash
cd server
npm install

# Copy environment file
cp .env.example .env
# Fill in your DATABASE_URL and JWT_SECRET in .env

# Run database migrations
npm run migrate

# Start server
npm start
# Server runs on http://localhost:5000
```

### 3. Setup Frontend

```bash
cd client
npm install

# Copy environment file
cp .env.example .env
# Add REACT_APP_API_URL=http://localhost:5000/api

# Start app
npm start
# App opens at http://localhost:3000
```

### 4. Login with demo account

```
Email: demo@stocker.com
Password: demo123
```

---

## ⚙️ Environment Variables

### Backend (`server/.env`)

```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/stocker
JWT_SECRET=your-secret-key-here-change-this
CORS_ORIGIN=http://localhost:3000
```

### Frontend (`client/.env`)

```bash
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📁 Project Structure

```
stocker/
├── client/                   # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Dashboard/    # Dashboard widgets
│   │   │   ├── Layout.tsx    # Main layout wrapper
│   │   │   ├── Navbar.tsx    # Top navigation
│   │   │   └── Sidebar.tsx   # Side navigation
│   │   ├── pages/            # Page components
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProductsPage.tsx
│   │   │   ├── CategoriesPage.tsx
│   │   │   ├── SuppliersPage.tsx
│   │   │   ├── InventoryPage.tsx
│   │   │   └── LoginPage.tsx
│   │   ├── services/
│   │   │   └── api.ts        # All API calls
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   └── types/
│   │       └── dashboard.ts
│   └── package.json
│
└── server/                   # Node.js Backend
    ├── src/
    │   ├── controllers/      # Request handlers
    │   ├── models/           # Database queries
    │   ├── routes/           # API routes
    │   ├── middleware/       # Auth middleware
    │   └── config/
    │       └── database.ts
    ├── database/
    │   └── init.sql          # Database schema
    └── package.json
```

---

## 🔌 API Reference

Full API documentation available in [`API_DOCS.md`](./docs/API_DOCS.md)

### Authentication

```
POST   /api/auth/register     Register new user
POST   /api/auth/login        Login (returns JWT token)
GET    /api/auth/me           Get current user
```

### Products

```
GET    /api/products          Get all products with stock levels
GET    /api/products/:id      Get single product
POST   /api/products          Create product
PUT    /api/products/:id      Update product
DELETE /api/products/:id      Delete product
```

### Categories

```
GET    /api/categories        Get all categories
POST   /api/categories        Create category
PUT    /api/categories/:id    Update category
DELETE /api/categories/:id    Delete category
```

### Suppliers

```
GET    /api/suppliers         Get all suppliers
POST   /api/suppliers         Create supplier
PUT    /api/suppliers/:id     Update supplier
DELETE /api/suppliers/:id     Delete supplier
```

### Inventory

```
GET    /api/inventory/transactions              All transactions
POST   /api/inventory/transactions              Create transaction
GET    /api/inventory/transactions/recent       Recent activity
GET    /api/inventory/stock/low                 Low stock products
GET    /api/inventory/products/:id/stock        Get product stock level
```

### Dashboard

```
GET    /api/dashboard/stats   Get all dashboard data
```

---

## 🗄️ Database Schema

```sql
users (
  id, email, password_hash, first_name, last_name,
  role ['admin'|'manager'|'staff'], created_at, updated_at
)

categories (
  id, name UNIQUE, description, created_at
)

suppliers (
  id, name, contact_person, email, phone, address, created_at
)

products (
  id, sku UNIQUE, name, description,
  category_id → categories(id),
  supplier_id → suppliers(id),
  unit_price DECIMAL(10,2), reorder_level DEFAULT 10,
  created_at, updated_at
)

inventory_transactions (
  id, product_id → products(id),
  transaction_type ['in'|'out'|'adjustment'],
  quantity, user_id → users(id), notes, created_at
)

-- VIEW: current_stock
-- Calculates stock by summing all transactions per product
```

**Key Design Decision:** Stock is calculated, not stored. Current stock = SUM of all transactions for a product. This ensures data integrity and provides a complete audit trail.

---

## 🚀 Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Framework: **Create React App**
4. Root directory: `client`
5. Environment variable: `REACT_APP_API_URL=https://your-railway-url.railway.app/api`
6. Deploy

### Backend → Railway

1. Create new project in [railway.app](https://railway.app)
2. Add PostgreSQL database service
3. Deploy from GitHub repo
4. Root directory: `server`
5. Environment variables:
   - `DATABASE_URL` (auto-filled by Railway)
   - `JWT_SECRET` (generate a random string)
   - `CORS_ORIGIN=https://your-vercel-url.vercel.app`
   - `NODE_ENV=production`
6. Deploy

---

## 🧪 Testing

### Test the deployed app:

1. Visit your Vercel URL
2. Login with: `demo@stocker.com` / `demo123`
3. Test all pages: Dashboard, Products, Categories, Suppliers, Inventory
4. Try mobile view (F12 → phone icon)
5. Check browser console for errors (F12)

---

## 📋 Changelog

### v1.0.0 (February 2026)

- ✅ Initial release
- ✅ Full CRUD for products, categories, suppliers
- ✅ Inventory transaction tracking (in/out/adjustment)
- ✅ Dashboard with real-time stats and charts
- ✅ Low stock alerts
- ✅ Mobile responsive design
- ✅ JWT Authentication with bcrypt password hashing
- ✅ Professional code documentation
- ✅ Complete API documentation

---

## 💡 Key Features Explained

### Stock Calculation

Stock is calculated dynamically from all transactions:

- `type='in'` → adds stock
- `type='out'` → removes stock
- `type='adjustment'` → manual correction

This approach ensures accurate stock levels and complete audit trail.

### Low Stock Alerts

Products with `current_stock <= reorder_level` appear in the dashboard alert card, helping you stay ahead of shortages.

### Mobile Responsive

- **Desktop:** Full table views with all columns
- **Mobile:** Card-based views with touch-friendly buttons
- **Tablet:** Optimized layouts for cashier/inventory management

---

## 👨‍💻 Author

**YOUR-NAME-HERE**

- GitHub: ELIEZER GAUDIEL : https://github.com/E7itism
- LinkedIn: ELIEZER GAUDIEL : www.linkedin.com/in/esgaudiel
- Location: Philippines

---

## 📜 License

MIT License — feel free to use this project for learning or as a portfolio piece.

---

## 🙏 Acknowledgments

Built as a portfolio project to demonstrate full-stack development skills including:

- React + TypeScript frontend development
- Node.js + Express backend architecture
- PostgreSQL database design
- JWT authentication implementation
- RESTful API design
- Mobile-responsive UI/UX
- Professional code documentation

---

⭐ **If this project helped you, please give it a star!**

---

## 📧 Questions?

Found a bug? Have a question? Open an issue or reach out on LinkedIn.
