/**
 * Low Stock Alert - Shows products running low
 */

import React from 'react';
import { LowStockProduct } from '../../types/dashboard';

interface Props {
  products: LowStockProduct[];
}

export const LowStockAlert: React.FC<Props> = ({ products }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Low Stock Alert</h2>
        {products.length > 0 && (
          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
            {products.length} items
          </span>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-green-600 font-medium">
            ✅ All products well-stocked!
          </p>
          <p className="text-gray-500 text-sm mt-1">No items need reordering</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  SKU
                </th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">
                  Product
                </th>
                <th className="text-right py-3 px-4 text-gray-600 font-medium">
                  Current Stock
                </th>
                <th className="text-right py-3 px-4 text-gray-600 font-medium">
                  Reorder At
                </th>
                <th className="text-center py-3 px-4 text-gray-600 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.product_id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-gray-600">{product.sku}</td>
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {product.name}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-semibold ${
                        product.current_stock === 0
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {product.current_stock}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {product.reorder_level}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        product.current_stock === 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {product.current_stock === 0
                        ? 'Out of Stock'
                        : 'Low Stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
