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
