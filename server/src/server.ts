/**
 * server.ts
 *
 * Entry point for the Express backend.
 * Sets up middleware, registers all routes, and starts the server.
 *
 * Architecture: Request → CORS → JSON parser → Routes → Controllers → Models → DB
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import supplierRoutes from './routes/supplierRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import posRoutes from './routes/posRoutes';
import reportsRoutes from './routes/reportsRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config(); // Load .env variables into process.env

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * CORS Configuration
 *
 * CORS (Cross-Origin Resource Sharing) controls which domains
 * are allowed to call this API from a browser.
 *
 * Why do we need this?
 * Browsers block requests from one origin (e.g., vercel.app) to a different
 * origin (e.g., railway.app) unless the server explicitly allows it.
 * This is a browser security feature called the Same-Origin Policy.
 *
 * Why a function instead of a simple origin string?
 * A static string like `origin: 'https://stocker.vercel.app'` only allows
 * ONE exact URL. Vercel creates a new preview URL for every deployment
 * (e.g., stocker-abc123.vercel.app). A function lets us allow ALL of them
 * with a pattern check instead of hardcoding every URL.
 *
 * Why allow requests with no origin?
 * - curl / Postman requests have no origin header
 * - Mobile apps have no origin header
 * - Server-to-server requests have no origin header
 * These are not browser requests so CORS doesn't apply to them.
 */
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      // Allow any localhost port (development)
      // Allow any *.vercel.app URL (all Vercel deployments including previews)
      if (
        origin.startsWith('http://localhost') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies and Authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Parse incoming JSON request bodies (req.body)
// Without this, req.body would be undefined
app.use(express.json());

// ─────────────────────────────────────────────
// ROUTES
// Each route file handles one resource
// ─────────────────────────────────────────────
app.use('/api/auth', authRoutes); // POST /api/auth/login, register
app.use('/api/products', productRoutes); // CRUD /api/products
app.use('/api/categories', categoryRoutes); // CRUD /api/categories
app.use('/api/suppliers', supplierRoutes); // CRUD /api/suppliers
app.use('/api/dashboard', dashboardRoutes); // GET  /api/dashboard/stats
app.use('/api/inventory', inventoryRoutes); // CRUD /api/inventory/transactions
app.use('/api/pos', posRoutes); // GET /api/pos/products, POST /api/pos/sales
app.use('/api/reports', reportsRoutes);
app.use('/api/users', userRoutes);

/**
 * Root route — API documentation/discovery.
 * Useful for developers to see all available endpoints
 * without reading the source code.
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to Stocker API',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
      products: {
        create: 'POST /api/products',
        getAll: 'GET /api/products',
        getOne: 'GET /api/products/:id',
        update: 'PUT /api/products/:id',
        delete: 'DELETE /api/products/:id',
      },
      categories: {
        create: 'POST /api/categories',
        getAll: 'GET /api/categories',
        getOne: 'GET /api/categories/:id',
        update: 'PUT /api/categories/:id',
        delete: 'DELETE /api/categories/:id',
      },
      suppliers: {
        create: 'POST /api/suppliers',
        getAll: 'GET /api/suppliers',
        getOne: 'GET /api/suppliers/:id',
        update: 'PUT /api/suppliers/:id',
        delete: 'DELETE /api/suppliers/:id',
      },
      inventory: {
        transactions: 'GET /api/inventory/transactions',
        createTransaction: 'POST /api/inventory/transactions',
        lowStock: 'GET /api/inventory/stock/low',
        recentTransactions: 'GET /api/inventory/transactions/recent',
      },
    },
  });
});

/**
 * Health check — used by Railway/Vercel to verify the server is running.
 * Also checks database connectivity.
 * Monitoring tools call this periodically to detect downtime.
 */
app.get('/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT NOW()'); // Simple query to test DB connection
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
