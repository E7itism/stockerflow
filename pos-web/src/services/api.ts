import axios from 'axios';
import type { CreateSalePayload, Sale, Product, AuthUser } from '../types';

// Base URL from environment variable — set in .env file
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor ──────────────────────────────────────
// Automatically attaches JWT token to every request
// WHY: Avoids repeating token logic in every API call
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('pos_user');
  if (raw) {
    const user: AuthUser = JSON.parse(raw);
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// ── Response interceptor ─────────────────────────────────────
// Handles 401 globally — logs user out if token expires
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────
export const authAPI = {
  /** Login — same endpoint as STOCKER (shared backend) */
  login: async (email: string, password: string): Promise<AuthUser> => {
    const res = await api.post('/auth/login', { email, password });
    return { ...res.data.user, token: res.data.token }; // ← merge token in
  },
};

// ─────────────────────────────────────────────────────────────
// PRODUCTS  (read-only from POS perspective)
// ─────────────────────────────────────────────────────────────
export const productAPI = {
  /** Get all products with current stock — for the product browser */
  getAll: async (): Promise<Product[]> => {
    const res = await api.get('/pos/products');
    return res.data.products;
  },

  /** Search products by name or SKU */
  search: async (query: string): Promise<Product[]> => {
    const res = await api.get('/pos/products', { params: { search: query } });
    return res.data.products;
  },
};

// ─────────────────────────────────────────────────────────────
// SALES
// ─────────────────────────────────────────────────────────────
export const salesAPI = {
  /** Create a sale + auto-generate inventory_transactions */
  create: async (payload: CreateSalePayload): Promise<Sale> => {
    const res = await api.post('/pos/sales', payload);
    return res.data.sale;
  },

  /** Get sale by ID — for receipt display after checkout */
  getById: async (id: number): Promise<Sale> => {
    const res = await api.get(`/pos/sales/${id}`);
    return res.data.sale;
  },

  /** Sales history — today's sales for the cashier dashboard */
  getHistory: async (params?: {
    from?: string;
    to?: string;
  }): Promise<Sale[]> => {
    const res = await api.get('/pos/sales', { params });
    return res.data.sales;
  },
};
