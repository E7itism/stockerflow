/**
 * Top Products Chart - Bar chart of most active products
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TopProduct } from '../../types/dashboard';

interface Props {
  products: TopProduct[];
}

export const TopProductsChart: React.FC<Props> = ({ products }) => {
  const chartData = products.map((product) => ({
    name: product.product_name,
    transactions: product.transaction_count,
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Top Products by Activity
      </h2>

      {products.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No transaction data available
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
              formatter={(value?: number) => [
                `${value} transactions`,
                'Activity',
              ]}
            />
            <Bar dataKey="transactions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
