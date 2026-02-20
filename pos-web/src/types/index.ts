// ============================================================
// SHARED TYPES — used across POS components
// ============================================================

/** Product as returned by the API (from STOCKER's products table) */
export interface Product {
  id: number
  sku: string
  name: string
  description: string | null
  category_id: number
  category_name: string   // joined from categories table
  unit_price: string      // PostgreSQL DECIMAL comes as string
  unit_of_measure: string
  current_stock: number   // calculated from inventory_transactions
  reorder_level: number
}

/** One item in the cashier's cart (before sale is created) */
export interface CartItem {
  product_id: number
  product_name: string
  unit_of_measure: string
  unit_price: number
  quantity: number
  subtotal: number        // unit_price * quantity
}

/** Payload sent to POST /api/pos/sales */
export interface CreateSalePayload {
  total_amount: number
  cash_tendered: number
  change_amount: number
  payment_method: 'cash'
  items: {
    product_id: number
    product_name: string
    unit_of_measure: string
    unit_price: number
    quantity: number
    subtotal: number
  }[]
}

/** Sale record returned by the API after creation */
export interface Sale {
  id: number
  cashier_id: number
  cashier_name: string
  total_amount: string
  cash_tendered: string
  change_amount: string
  payment_method: string
  created_at: string
  items: SaleItem[]
}

export interface SaleItem {
  id: number
  sale_id: number
  product_id: number
  product_name: string
  unit_of_measure: string
  unit_price: string
  quantity: number
  subtotal: string
}

/** Auth state stored in localStorage */
export interface AuthUser {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'cashier'
  token: string
}
