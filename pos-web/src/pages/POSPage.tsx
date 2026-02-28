/**
 * POSPage.tsx
 *
 * Main cashier screen — designed for all devices and all users including
 * elderly and non-tech-savvy cashiers.
 *
 * Layout:
 *   Mobile  — tab-based: "Products" tab | "Cart" tab
 *   Desktop — split panel: products left, cart right
 *
 * Design principles:
 *   - Large touch targets (minimum 48px)
 *   - Clear labels on everything — no icon-only buttons
 *   - High contrast text
 *   - Obvious feedback on every action
 *   - Cart badge always visible so cashier knows items are added
 *
 * CATEGORY FILTER:
 * Buttons extracted from the loaded product list — no extra API call needed.
 * Works together with the search box: search narrows by name/SKU,
 * category filter narrows by category. Both can be active at once.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import { productAPI } from '../services/api';
import { formatPeso } from '../utils/format';
import type { Product } from '../types';
import toast from 'react-hot-toast';
import CheckoutModal from '../components/cart/Checkoutmodal';
import ReceiptModal from '../components/receipt/ReceiptModal';

type Tab = 'products' | 'cart';

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [showCheckout, setShowCheckout] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<number | null>(null);

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

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoadingProducts(true);
      const data = await productAPI.getAll();
      setProducts(data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  }

  /**
   * categories — derived from the loaded products.
   *
   * WHY useMemo?
   * Products don't change after load. Without memoization, this would
   * recalculate on every render (every keystroke in the search box).
   * useMemo caches the result and only recalculates when `products` changes.
   *
   * WHY 'All' prepended?
   * 'All' is the default state — shows every product regardless of category.
   */
  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(products.map((p) => p.category_name).filter(Boolean)),
    ).sort();
    return ['All', ...unique];
  }, [products]);

  /**
   * filteredProducts — applies both search and category filter together.
   *
   * WHY useMemo instead of useEffect + setState?
   * filteredProducts is derived state — it's always computed from
   * products + search + selectedCategory. Using useMemo avoids the extra
   * render cycle that useState would cause.
   */
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'All' || p.category_name === selectedCategory;

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category_name?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  function handleAddToCart(product: Product) {
    if (product.current_stock <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    addItem(product);
    toast.success(`${product.name} added`, { duration: 1000 });
  }

  function handleSaleComplete(saleId: number) {
    setShowCheckout(false);
    setCompletedSaleId(saleId);
    clearCart();
    setActiveTab('products');
  }

  function handleReceiptClose() {
    setCompletedSaleId(null);
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* ── HEADER ──────────────────────────────────────────── */}
      <header className="bg-green-600 text-white px-4 py-3 flex items-center justify-between shadow-md flex-shrink-0">
        <span className="text-lg font-bold tracking-tight">🧾 STOCKER POS</span>
        <div className="flex items-center gap-2">
          <span className="text-green-100 text-sm hidden sm:block">
            {user?.first_name} {user?.last_name}
          </span>
          <Link
            to="/history"
            className="bg-green-700 hover:bg-green-800 text-white text-sm px-3 py-2 rounded-lg transition-colors"
          >
            History
          </Link>
          <button
            onClick={logout}
            className="bg-green-700 hover:bg-green-800 text-white text-sm px-3 py-2 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── MOBILE TAB BAR (hidden on md+) ──────────────────── */}
      <div className="md:hidden flex bg-white border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-4 text-base font-semibold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'products'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500'
          }`}
        >
          🛍️ Products
        </button>
        <button
          onClick={() => setActiveTab('cart')}
          className={`flex-1 py-4 text-base font-semibold flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'cart'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500'
          }`}
        >
          🛒 Cart
          {totalItems > 0 && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── PRODUCTS PANEL ────────────────────────────────── */}
        <div
          className={`
            flex-1 flex-col overflow-hidden border-r border-gray-200
            ${activeTab === 'products' ? 'flex' : 'hidden'}
            md:flex
          `}
        >
          {/* Search + Category filter */}
          <div className="bg-white border-b border-gray-200">
            {/* Search box */}
            <div className="p-3 pb-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
              />
            </div>

            {/**
             * Category filter buttons
             *
             * WHY horizontal scroll instead of wrapping?
             * On mobile the buttons would push the product grid down and
             * reduce visible products. Horizontal scroll keeps the layout
             * compact and predictable regardless of how many categories exist.
             *
             * Only rendered once products have loaded (categories would be
             * empty and show nothing useful during loading anyway).
             */}
            {!loadingProducts && categories.length > 1 && (
              <div className="flex gap-2 px-3 pb-3 overflow-x-auto scrollbar-hide">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                    {/**
                     * Show product count per category so cashiers know
                     * how many items are in each section before clicking.
                     * 'All' shows total count across all categories.
                     */}
                    <span
                      className={`ml-1.5 text-xs ${
                        selectedCategory === cat
                          ? 'text-green-100'
                          : 'text-gray-400'
                      }`}
                    >
                      {cat === 'All'
                        ? products.length
                        : products.filter((p) => p.category_name === cat)
                            .length}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {loadingProducts ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-lg">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <span className="text-5xl">🔍</span>
                <p className="text-base">
                  {search
                    ? `No products found for "${search}"`
                    : `No products in ${selectedCategory}`}
                </p>
                {/**
                 * Reset button — shown when filters produce empty results.
                 * Gives the cashier a quick escape hatch back to all products.
                 */}
                {(search || selectedCategory !== 'All') && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setSelectedCategory('All');
                    }}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={() => handleAddToCart(product)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Mobile — "View Cart" floating bar when items exist */}
          {items.length > 0 && (
            <div className="md:hidden p-3 bg-white border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setActiveTab('cart')}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl text-lg transition-colors flex items-center justify-center gap-3"
              >
                <span>View Cart</span>
                <span className="bg-white text-green-600 text-sm font-bold px-2.5 py-0.5 rounded-full">
                  {totalItems} items
                </span>
                <span className="ml-auto">{formatPeso(total)}</span>
              </button>
            </div>
          )}
        </div>

        {/* ── CART PANEL ────────────────────────────────────── */}
        <div
          className={`
            w-full md:w-80 xl:w-96 flex-col bg-white overflow-hidden
            ${activeTab === 'cart' ? 'flex' : 'hidden'}
            md:flex
          `}
        >
          {/* Cart header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-lg">
              Cart
              {totalItems > 0 && (
                <span className="ml-2 bg-green-100 text-green-700 text-sm font-bold px-2.5 py-0.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </h2>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-red-500 hover:text-red-700 transition-colors font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 p-8">
                <span className="text-6xl">🛒</span>
                <p className="text-base font-medium text-center">
                  Cart is empty
                </p>
                <p className="text-sm text-center">
                  Tap a product to add it here
                </p>
                <button
                  onClick={() => setActiveTab('products')}
                  className="md:hidden mt-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold"
                >
                  Browse Products
                </button>
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

          {/* Totals + checkout */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-3 flex-shrink-0">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatPeso(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>VAT (12%)</span>
                <span>{formatPeso(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-green-600">{formatPeso(total)}</span>
              </div>
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-colors text-xl"
              >
                Checkout →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ──────────────────────────────────────────── */}
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
      {completedSaleId && (
        <ReceiptModal saleId={completedSaleId} onClose={handleReceiptClose} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ProductCard — large touch target, clear stock status
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
        text-left p-3 rounded-xl border-2 transition-all min-h-[120px] flex flex-col justify-between
        ${
          outOfStock
            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
            : 'border-gray-200 bg-white hover:border-green-400 hover:shadow-md active:scale-95 cursor-pointer'
        }
      `}
    >
      <div>
        <div className="text-xs text-gray-400 mb-1 truncate">
          {product.category_name}
        </div>
        <div className="font-semibold text-gray-800 text-sm leading-tight mb-2 line-clamp-2">
          {product.name}
        </div>
      </div>
      <div>
        <div className="text-green-600 font-bold text-base">
          {formatPeso(product.unit_price)}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">
            {product.unit_of_measure}
          </span>
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
              ? 'No stock'
              : lowStock
                ? `Low: ${product.current_stock}`
                : `${product.current_stock}`}
          </span>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// CartRow — large controls, easy for non-tech-savvy users
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
    <div className="px-4 py-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-base font-semibold text-gray-800 leading-tight">
            {item.product_name}
          </div>
          <div className="text-sm text-gray-400 mt-0.5">
            {formatPeso(item.unit_price)} / {item.unit_of_measure}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-red-400 hover:text-red-600 text-sm font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
        >
          Remove
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onUpdateQty(item.quantity - 1)}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors flex items-center justify-center text-xl"
          >
            −
          </button>
          <span className="w-8 text-center text-lg font-bold text-gray-800">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQty(item.quantity + 1)}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors flex items-center justify-center text-xl"
          >
            +
          </button>
        </div>
        <span className="text-base font-bold text-gray-800">
          {formatPeso(item.subtotal)}
        </span>
      </div>
    </div>
  );
}
