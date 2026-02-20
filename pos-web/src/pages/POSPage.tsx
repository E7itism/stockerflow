/**
 * POSPage.tsx
 *
 * Main cashier screen. Split into two panels:
 *   Left  — product browser (search + grid)
 *   Right — cart + checkout
 *
 * Layout is optimized for tablets (touch targets, large text).
 * All cart logic lives in useCart hook — this component only handles
 * UI state like search query and checkout modal visibility.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import { productAPI } from '../services/api';
import { formatPeso } from '../utils/format';
import type { Product } from '../types';
import toast from 'react-hot-toast';
import ReceiptModal from '../components/receipt/ReceiptModal.tsx';
import CheckoutModal from '../components/cart/Checkoutmodal.tsx';

export default function POSPage() {
  // ── Product state ────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ── Modal state ──────────────────────────────────────────────
  const [showCheckout, setShowCheckout] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<number | null>(null);

  // ── Hooks ────────────────────────────────────────────────────
  const { user, logout } = useAuth();
  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    total,
    tax,
    subtotal,
  } = useCart();

  // ── Load products on mount ───────────────────────────────────
  useEffect(() => {
    loadProducts();
  }, []);

  // ── Filter products when search changes ──────────────────────
  // WHY client-side filtering instead of API call on every keystroke?
  // We already have all products loaded. Filtering locally is instant
  // and avoids hammering the server on every keypress.
  useEffect(() => {
    if (!search.trim()) {
      setFilteredProducts(products);
      return;
    }
    const q = search.toLowerCase();
    setFilteredProducts(
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category_name.toLowerCase().includes(q),
      ),
    );
  }, [search, products]);

  async function loadProducts() {
    try {
      setLoadingProducts(true);
      const data = await productAPI.getAll();
      setProducts(data);
      setFilteredProducts(data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  }

  // Called after a successful sale — shows receipt
  function handleSaleComplete(saleId: number) {
    setShowCheckout(false);
    setCompletedSaleId(saleId);
    clearCart();
  }

  // Called when receipt is closed — ready for next customer
  function handleReceiptClose() {
    setCompletedSaleId(null);
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* ── TOP NAV ─────────────────────────────────────────── */}
      <header className="bg-green-600 text-white px-6 py-3 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">
            🧾 STOCKER POS
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-green-100 text-sm">
            {user?.first_name} {user?.last_name}
          </span>
          <button
            onClick={logout}
            className="bg-green-700 hover:bg-green-800 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANEL — Product Browser ─────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
          {/* Search bar */}
          <div className="p-4 bg-white border-b border-gray-200">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, or category..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingProducts ? (
              // Loading state
              <div className="flex items-center justify-center h-full text-gray-400">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <span className="text-4xl">🔍</span>
                <p>No products found for "{search}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={() => {
                      // Prevent adding out-of-stock items
                      if (product.current_stock <= 0) {
                        toast.error(`${product.name} is out of stock`);
                        return;
                      }
                      addItem(product);
                      toast.success(`${product.name} added`, {
                        duration: 1000,
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL — Cart ───────────────────────────── */}
        <div className="w-80 xl:w-96 flex flex-col bg-white overflow-hidden">
          {/* Cart header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              Cart
              {items.length > 0 && (
                <span className="ml-2 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              )}
            </h2>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-8">
                <span className="text-4xl">🛒</span>
                <p className="text-sm text-center">
                  Tap a product to add it to the cart
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <CartRow
                    key={item.product_id}
                    item={item}
                    onUpdateQty={(qty) => updateQuantity(item.product_id, qty)}
                    onRemove={() => removeItem(item.product_id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Cart totals + checkout */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-2">
              {/* Subtotal */}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatPeso(subtotal)}</span>
              </div>

              {/* VAT */}
              <div className="flex justify-between text-sm text-gray-600">
                <span>VAT (12%)</span>
                <span>{formatPeso(tax)}</span>
              </div>

              {/* Total */}
              <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-green-600">{formatPeso(total)}</span>
              </div>

              {/* Checkout button */}
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors mt-2 text-lg"
              >
                Checkout →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ──────────────────────────────────────────── */}

      {/* Checkout modal — cash tendered + confirm sale */}
      {showCheckout && (
        <CheckoutModal
          items={items}
          total={total}
          tax={tax}
          subtotal={subtotal}
          onConfirm={handleSaleComplete}
          onCancel={() => setShowCheckout(false)}
        />
      )}

      {/* Receipt modal — shown after sale is created */}
      {completedSaleId && (
        <ReceiptModal saleId={completedSaleId} onClose={handleReceiptClose} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ProductCard — one card in the product grid
// ─────────────────────────────────────────────────────────────
interface ProductCardProps {
  product: Product;
  onAdd: () => void;
}

function ProductCard({ product, onAdd }: ProductCardProps) {
  const outOfStock = product.current_stock <= 0;
  const lowStock =
    product.current_stock > 0 && product.current_stock <= product.reorder_level;

  return (
    <button
      onClick={onAdd}
      disabled={outOfStock}
      className={`
        text-left p-3 rounded-xl border-2 transition-all
        ${
          outOfStock
            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
            : 'border-gray-200 bg-white hover:border-green-400 hover:shadow-md active:scale-95 cursor-pointer'
        }
      `}
    >
      {/* Category badge */}
      <div className="text-xs text-gray-400 mb-1 truncate">
        {product.category_name}
      </div>

      {/* Product name */}
      <div className="font-semibold text-gray-800 text-sm leading-tight mb-2 line-clamp-2">
        {product.name}
      </div>

      {/* Price */}
      <div className="text-green-600 font-bold text-base">
        {formatPeso(product.unit_price)}
      </div>

      {/* Unit + stock */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-400">{product.unit_of_measure}</span>
        <span
          className={`text-xs font-medium ${
            outOfStock
              ? 'text-red-500'
              : lowStock
                ? 'text-amber-500'
                : 'text-gray-400'
          }`}
        >
          {outOfStock
            ? 'Out of stock'
            : lowStock
              ? `Low: ${product.current_stock}`
              : `${product.current_stock} in stock`}
        </span>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// CartRow — one line item in the cart panel
// ─────────────────────────────────────────────────────────────
interface CartRowProps {
  item: {
    product_name: string;
    unit_of_measure: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
  };
  onUpdateQty: (qty: number) => void;
  onRemove: () => void;
}

function CartRow({ item, onUpdateQty, onRemove }: CartRowProps) {
  return (
    <div className="px-4 py-3 flex flex-col gap-1">
      {/* Product name + remove button */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-gray-800 leading-tight">
            {item.product_name}
          </div>
          <div className="text-xs text-gray-400">
            {formatPeso(item.unit_price)} / {item.unit_of_measure}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Quantity controls + subtotal */}
      <div className="flex items-center justify-between">
        {/* Qty stepper */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQty(item.quantity - 1)}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors flex items-center justify-center text-sm"
          >
            −
          </button>
          <span className="w-6 text-center text-sm font-semibold text-gray-800">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQty(item.quantity + 1)}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors flex items-center justify-center text-sm"
          >
            +
          </button>
        </div>

        {/* Subtotal */}
        <span className="text-sm font-semibold text-gray-800">
          {formatPeso(item.subtotal)}
        </span>
      </div>
    </div>
  );
}
