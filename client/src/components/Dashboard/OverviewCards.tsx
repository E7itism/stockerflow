/**
 * Overview Cards - REACT 19 COMPATIBLE
 */

import React from 'react';

interface Props {
  stats: {
    total_products: number;
    total_categories: number;
    total_suppliers: number;
    low_stock_count: number;
  };
}

export const OverviewCards = ({ stats }: Props) => {
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
    <>
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium uppercase">
                {card.title}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2">
                {card.value}
              </p>
            </div>
            <div
              className={`${card.color} w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0`}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
