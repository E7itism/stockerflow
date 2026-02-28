/**
 * api.ts
 *
 * Central file for ALL API calls in the app.
 * Built on top of axios with automatic auth token injection.
 *
 * Why one file for all API calls?
 * - Single place to change the base URL (dev vs production)
 * - Auth header added once via interceptor, not repeated everywhere
 * - Easy to find any API call in the codebase
 * - Consistent error handling pattern across all requests
 */

import axios from 'axios';
import { DashboardData } from '../types/dashboard';

/**
 * Base URL comes from environment variable.
 *
 * Why use an env variable instead of hardcoding?
 * - Development: http://localhost:5000/api
 * - Production: https://your-api.railway.app/api
 * Setting REACT_APP_API_URL in .env means we never change this file.
 */
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Axios instance with shared config.
 *
 * Why create an instance instead of using axios directly?
 * The instance carries the baseURL and default headers,
 * so every call in this file writes `/products` not the full URL.
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor — automatically attaches JWT token to every request.
 *
 * Why an interceptor instead of adding headers in each function?
 * Without this, every single API call would need:
 *   headers: { Authorization: `Bearer ${token}` }
 * The interceptor runs before every request so we write it once here.
 *
 * Token is read from localStorage on each request (not cached in memory)
 * so it always reflects the latest value after login/logout.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════

export const dashboardAPI = {
  /**
   * Returns a NESTED object — not flat!
   * Access values like:
   *   data.overview.total_products       ✅
   *   data.inventory_value.total_value   ✅
   *   data.total_products                ❌ undefined
   */
  getStats: async (): Promise<DashboardData> => {
    const response = await api.get<DashboardData>('/dashboard/stats');
    return response.data;
  },
};

// ═══════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════

/**
 * What we send TO the API when creating or updating a product.
 * unit_price and reorder_level are always numbers here (never strings).
 * The form uses a separate ProductFormData type that allows strings while typing.
 */
export interface ProductInput {
  sku: string;
  name: string;
  description?: string;
  category_id: number;
  supplier_id: number;
  unit_price: number;
  reorder_level: number;
  unit_of_measure?: string;
}

export const productsAPI = {
  /**
   * Returns products enriched with category_name, supplier_name, current_stock.
   * current_stock is calculated from inventory_transactions in the DB view.
   */
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

  // Partial<ProductInput> means all fields are optional in an update
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
// CATEGORIES
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
// SUPPLIERS
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
// INVENTORY
// ═══════════════════════════════════════════════════════════════════

export interface TransactionInput {
  product_id: number;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  notes?: string;
}

export const inventoryAPI = {
  getAllTransactions: async () => {
    const response = await api.get('/inventory/transactions');
    return response.data;
  },

  getTransactionById: async (id: number) => {
    const response = await api.get(`/inventory/transactions/${id}`);
    return response.data;
  },

  /**
   * Creates a stock movement record.
   * transaction_type effects on stock:
   *   'in'         → adds stock  (+quantity)
   *   'out'        → removes stock (-quantity)
   *   'adjustment' → corrects stock (±quantity)
   *
   * Transactions are permanent — no delete endpoint by design.
   * To correct a mistake, create an opposing transaction instead.
   * This preserves a full audit trail.
   */
  createTransaction: async (data: TransactionInput) => {
    const response = await api.post('/inventory/transactions', data);
    return response.data;
  },

  deleteTransaction: async (id: number) => {
    const response = await api.delete(`/inventory/transactions/${id}`);
    return response.data;
  },

  getProductStock: async (productId: number) => {
    const response = await api.get(`/inventory/products/${productId}/stock`);
    return response.data;
  },

  getAllStock: async () => {
    const response = await api.get('/inventory/stock');
    return response.data;
  },

  /**
   * Returns products where current_stock <= reorder_level.
   * Used by Dashboard (LowStockAlert) and Inventory page.
   * Response shape: { count: number, low_stock_products: [...] }
   */
  getLowStock: async () => {
    const response = await api.get('/inventory/stock/low');
    return response.data;
  },

  getRecentTransactions: async (limit: number = 10) => {
    const response = await api.get(
      `/inventory/transactions/recent?limit=${limit}`,
    );
    return response.data;
  },
};
// ═══════════════════════════════════════════════════════════════════
// SALES REPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Date range params reused across report endpoints.
 * Both are optional — the backend defaults to last 30 days if omitted.
 */
export interface ReportDateRange {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

/** Shape returned by GET /api/reports/summary */
export interface ReportSummary {
  date_range: { from: string; to: string };
  summary: {
    total_revenue: number;
    transaction_count: number;
    avg_transaction_value: number;
  };
  top_products: {
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }[];
}

/** Single sale row returned by GET /api/reports/sales */
export interface SaleRecord {
  id: number;
  cashier_id: number;
  cashier_name: string;
  total_amount: string;
  cash_tendered: string;
  change_amount: string;
  payment_method: string;
  created_at: string;
}

/** Shape returned by GET /api/reports/sales */
export interface SalesListResponse {
  sales: SaleRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

/** Single line item for an expanded sale */
export interface SaleItem {
  product_name: string;
  quantity: number;
  unit_price: string;
  unit_of_measure: string;
  subtotal: string;
}

export const reportsAPI = {
  /**
   * Fetches revenue summary and top products.
   * Called once on page load and whenever the date filter changes.
   */
  getSummary: async (range: ReportDateRange = {}): Promise<ReportSummary> => {
    const params = new URLSearchParams();
    if (range.from) params.append('from', range.from);
    if (range.to) params.append('to', range.to);

    const response = await api.get<ReportSummary>(`/reports/summary?${params}`);
    return response.data;
  },

  /**
   * Fetches paginated sales list.
   * page and limit are optional — backend defaults to page 1, limit 20.
   */
  getSales: async (
    range: ReportDateRange = {},
    page = 1,
    limit = 20,
  ): Promise<SalesListResponse> => {
    const params = new URLSearchParams();
    if (range.from) params.append('from', range.from);
    if (range.to) params.append('to', range.to);
    params.append('page', String(page));
    params.append('limit', String(limit));

    const response = await api.get<SalesListResponse>(
      `/reports/sales?${params}`,
    );
    return response.data;
  },

  /**
   * Fetches line items for one sale.
   * Only called when the user expands a row — not preloaded.
   */
  getSaleItems: async (saleId: number): Promise<SaleItem[]> => {
    const response = await api.get<{ items: SaleItem[] }>(
      `/reports/sales/${saleId}/items`,
    );
    return response.data.items;
  },
};

export default api;
