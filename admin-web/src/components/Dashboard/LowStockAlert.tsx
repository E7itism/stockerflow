/**
 * LowStockAlert.tsx
 *
 * Displays a warning card for products that have fallen at or below their reorder level.
 * Renders nothing if there are no low stock items (returns null).
 *
 * Used in: DashboardPage (full width, bottom of page)
 */

interface LowStockProduct {
  // id or product_id — API may return either depending on the endpoint
  id?: number;
  product_id?: number;
  sku: string;
  name: string;
  current_stock: number;
  reorder_level: number;
}

interface Props {
  products: LowStockProduct[] | undefined | null;
}

export const LowStockAlert = ({ products }: Props) => {
  /**
   * Defensive check — products prop can arrive as undefined, null, or an array.
   * This happens because the dashboard fetches data async and passes it down
   * before it's ready. Using Array.isArray prevents a runtime crash.
   */
  const safeProducts = Array.isArray(products) ? products : [];

  // No low stock items — don't render anything, not even an empty card
  if (safeProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">⚠️</span>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-red-900">
            Low Stock Alert
          </h2>
          <p className="text-xs sm:text-sm text-red-700 mt-1">
            {safeProducts.length}{' '}
            {safeProducts.length === 1 ? 'item needs' : 'items need'} reordering
          </p>
        </div>
      </div>

      {/* Desktop: grid layout */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {safeProducts.map((product, index) => (
          <ProductCard
            // Use id or product_id — API returns different shapes from different endpoints
            key={product.id || product.product_id || index}
            product={product}
          />
        ))}
      </div>

      {/* Mobile: stacked list */}
      <div className="sm:hidden space-y-3">
        {safeProducts.map((product, index) => (
          <ProductCard
            key={product.id || product.product_id || index}
            product={product}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * ProductCard — individual low stock item.
 * Shows current stock vs reorder level so the user knows how urgent it is.
 */
const ProductCard = ({ product }: { product: LowStockProduct }) => {
  return (
    <div className="bg-white rounded-lg p-3 sm:p-4 border border-red-200">
      <p className="font-medium text-gray-900 text-sm sm:text-base truncate mb-2">
        {product.name}
      </p>
      <p className="text-xs text-gray-500 mb-3">SKU: {product.sku}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Stock:</span>
          {/* Red text to emphasize the low number */}
          <span className="text-sm font-bold text-red-600">
            {product.current_stock}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Reorder at:</span>
          <span className="text-sm font-medium text-gray-700">
            {product.reorder_level}
          </span>
        </div>
      </div>
    </div>
  );
};
