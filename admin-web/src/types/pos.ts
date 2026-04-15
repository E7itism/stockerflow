// ─────────────────────────────────────────────
// POS Types — shared across POS components
// ─────────────────────────────────────────────

export interface POSProduct {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category_id: number;
  category_name: string;
  unit_price: string; // PostgreSQL DECIMAL comes as string
  unit_of_measure: string;
  current_stock: number; // calculated from inventory_transactions
  reorder_level: number;
}

export interface CartItem {
  product_id: number;
  product_name: string;
  unit_of_measure: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface CreateSalePayload {
  total_amount: number;
  cash_tendered: number;
  change_amount: number;
  payment_method: 'cash';
  items: {
    product_id: number;
    product_name: string;
    unit_of_measure: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }[];
}

export interface POSSale {
  id: number;
  cashier_id: number;
  cashier_name: string;
  total_amount: string;
  cash_tendered: string;
  change_amount: string;
  payment_method: string;
  created_at: string;
  items: POSSaleItem[];
}

export interface POSSaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  unit_of_measure: string;
  unit_price: string;
  quantity: number;
  subtotal: string;
}
