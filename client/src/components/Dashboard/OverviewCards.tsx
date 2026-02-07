/**
 * Overview Cards - Shows 4 stat cards at the top
 */

import React from 'react';
import { OverviewStats } from '../../types/dashboard';

interface Props {
  stats: OverviewStats;
}

export const OverviewCards: React.FC<Props> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Products',
      value: stats.total_products,
      icon: '📦',
      color: 'bg-blue-500',
    },
    {
      title: 'Categories',
      value: stats.total_categories,
      icon: '📁',
      color: 'bg-green-500',
    },
    {
      title: 'Suppliers',
      value: stats.total_suppliers,
      icon: '🏢',
      color: 'bg-purple-500',
    },
    {
      title: 'Low Stock Items',
      value: stats.low_stock_count,
      icon: '⚠️',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">{card.title}</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {card.value}
              </p>
            </div>
            <div
              className={`${card.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
