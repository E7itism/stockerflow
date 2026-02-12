/**
 * API Service - Makes calls to the backend
 */

import axios from 'axios';
import { DashboardData } from '../types/dashboard';

// Base URL for your backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD API
// ═══════════════════════════════════════════════════════════════════
export const dashboardAPI = {
  getStats: async (): Promise<DashboardData> => {
    const response = await api.get<DashboardData>('/dashboard/stats');
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════════════
// PRODUCTS API
// ═══════════════════════════════════════════════════════════════════
export interface ProductInput {
  sku: string;
  name: string;
  description?: string;
  category_id: number;
  supplier_id: number;
  unit_price: number;
  reorder_level: number;
}

export const productsAPI = {
  getAll: async () => {
    const response = await api.get('/products');

    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: ProductInput) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  update: async (id: number, data: Partial<ProductInput>) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════════════
// CATEGORIES API
// ═══════════════════════════════════════════════════════════════════
export interface CategoryInput {
  name: string;
  description?: string;
}

export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data: CategoryInput) => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CategoryInput>) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════════════
// SUPPLIERS API
// ═══════════════════════════════════════════════════════════════════
export interface SupplierInput {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export const suppliersAPI = {
  getAll: async () => {
    const response = await api.get('/suppliers');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  create: async (data: SupplierInput) => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  update: async (id: number, data: Partial<SupplierInput>) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════════════
// INVENTORY API
// ═══════════════════════════════════════════════════════════════════
export interface TransactionInput {
  product_id: number;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  notes?: string;
}

export const inventoryAPI = {
  // Transactions
  getAllTransactions: async () => {
    const response = await api.get('/inventory/transactions');
    return response.data;
  },

  getTransactionById: async (id: number) => {
    const response = await api.get(`/inventory/transactions/${id}`);
    return response.data;
  },

  createTransaction: async (data: TransactionInput) => {
    const response = await api.post('/inventory/transactions', data);
    return response.data;
  },

  deleteTransaction: async (id: number) => {
    const response = await api.delete(`/inventory/transactions/${id}`);
    return response.data;
  },

  // Stock levels
  getProductStock: async (productId: number) => {
    const response = await api.get(`/inventory/products/${productId}/stock`);
    return response.data;
  },

  getAllStock: async () => {
    const response = await api.get('/inventory/stock');
    return response.data;
  },

  getLowStock: async () => {
    const response = await api.get('/inventory/stock/low');
    return response.data;
  },

  // Recent activity
  getRecentTransactions: async (limit: number = 10) => {
    const response = await api.get(
      `/inventory/transactions/recent?limit=${limit}`,
    );
    return response.data;
  },
};

export default api;
