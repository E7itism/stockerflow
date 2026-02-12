import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import supplierRoutes from './routes/supplierRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root route
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
    },
  });
});

// Health check route
app.get('/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
