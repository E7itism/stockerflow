/**
 * Inventory Value - Big display of total inventory value
 */

import React from 'react';
import { InventoryValue as InventoryValueType } from '../../types/dashboard';

interface Props {
  inventoryValue: InventoryValueType;
}

export const InventoryValue: React.FC<Props> = ({ inventoryValue }) => {
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: inventoryValue.currency,
  }).format(inventoryValue.total_value);

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-8 mb-8 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-sm font-medium mb-2">
            Total Inventory Value
          </p>
          <p className="text-5xl font-bold">{formattedValue}</p>
          <p className="text-blue-100 text-sm mt-2">
            Current stock value across all products
          </p>
        </div>
        <div className="text-6xl opacity-20">💰</div>
      </div>
    </div>
  );
};
