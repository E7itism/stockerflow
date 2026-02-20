interface TopProduct {
  product_id?: number;
  id?: number;
  product_name: string;
  sku: string;
  transaction_count: number;
  current_stock?: number;
}

interface Props {
  products: TopProduct[];
}

export const TopProductsChart = ({ products }: Props) => {
  const maxCount = Math.max(...products.map((p) => p.transaction_count), 1);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
        Top Products
      </h2>
      {products.length === 0 ? (
        <p className="text-gray-500 text-center py-8 text-sm sm:text-base">
          No product data
        </p>
      ) : (
        <div className="space-y-4">
          {products.slice(0, 5).map((product, index) => {
            const percentage = (product.transaction_count / maxCount) * 100;
            return (
              <div key={product.product_id || product.id || index}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-gray-500">{product.sku}</p>
                  </div>
                  <div className="text-xs font-medium text-gray-600 flex-shrink-0">
                    {product.transaction_count} txns
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
