import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
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

dotenv.config();

const app = express();
const httpServer = createServer(app); // wrap Express in an HTTP server so Socket.io can attach
const PORT = process.env.PORT || 5000;

/**
 * Socket.io server
 *
 * WHY attach to httpServer instead of app?
 * Socket.io uses the WebSocket protocol which needs a raw HTTP server
 * to upgrade the connection. Express alone only handles HTTP requests.
 *
 * We export io so controllers can emit events from anywhere.
 */
export const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        origin.startsWith('http://localhost') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    if (!origin) return callback(null, true);
    if (
      origin.startsWith('http://localhost') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Stocker API', socket: 'enabled' });
});

app.get('/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Use httpServer.listen instead of app.listen so Socket.io works
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io ready`);
});

export default app;
