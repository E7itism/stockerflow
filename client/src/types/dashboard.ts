/**
 * TypeScript Types for Dashboard
 */

export interface OverviewStats {
  total_products: number;
  total_categories: number;
  total_suppliers: number;
  low_stock_count: number;
}

export interface InventoryValue {
  total_value: number;
  currency: string;
}

export interface RecentTransaction {
  id: number;
  product_id: number;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  user_id: number;
  notes?: string;
  created_at: string;
  sku: string;
  product_name: string;
  user_name: string;
}

export interface LowStockProduct {
  product_id: number;
  sku: string;
  name: string;
  current_stock: number;
  reorder_level: number;
  is_low_stock: boolean;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  sku: string;
  transaction_count: number;
}

/**
 * DashboardData - Main interface for dashboard stats
 *
 * UPDATED: Changed from nested to FLAT structure to match backend response
 *
 * Backend returns:
 * {
 *   total_products: 50,
 *   total_categories: 10,
 *   total_suppliers: 8,
 *   low_stock_count: 3,
 *   total_inventory_value: 25000,
 *   top_products: [...]
 * }
 */
export interface DashboardData extends OverviewStats {
  // Extends OverviewStats (includes total_products, total_categories, total_suppliers, low_stock_count)

  // Additional properties
  inventory_value: { total_value: number; currency: string };

  top_products: TopProduct[];
}
