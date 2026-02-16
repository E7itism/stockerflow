/**
 * Inventory Value - REACT 19 COMPATIBLE
 */

import React from 'react';

interface Props {
  total_value: number;
  currency?: string;
}

export const InventoryValue = ({
  total_value,
  currency,
}: Props): JSX.Element => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 sm:p-8">
      <div className="flex items-center justify-between text-white">
        <div>
          <p className="text-sm sm:text-base opacity-90 font-medium">
            Total Inventory Value
          </p>
          <p className="text-3xl sm:text-4xl font-bold mt-2">
            {total_value.toLocaleString('en-US', {
              style: 'currency',
              currency,
            })}
          </p>
        </div>
        <div className="text-4xl sm:text-5xl flex-shrink-0">💰</div>
      </div>
    </div>
  );
};
