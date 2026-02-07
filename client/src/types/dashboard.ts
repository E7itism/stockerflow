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

export interface DashboardData {
  overview: OverviewStats;
  inventory_value: InventoryValue;
  recent_activity: RecentTransaction[];
  low_stock_products: LowStockProduct[];
  top_products: TopProduct[];
}
