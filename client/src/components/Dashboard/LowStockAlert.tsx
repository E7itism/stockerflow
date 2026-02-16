/**
 * Low Stock Alert - REACT 19 COMPATIBLE
 */

import React from 'react';

interface LowStockProduct {
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
  const safeProducts = Array.isArray(products) ? products : [];

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

      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {safeProducts.map((product, index) => (
          <ProductCard
            key={product.id || product.product_id || index}
            product={product}
          />
        ))}
      </div>

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
          <span className="text-sm font-bold text-red-600">
            {product.current_stock}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Reorder:</span>
          <span className="text-sm font-medium text-gray-700">
            {product.reorder_level}
          </span>
        </div>
      </div>
    </div>
  );
};
