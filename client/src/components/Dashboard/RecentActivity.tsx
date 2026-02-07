/**
 * Recent Activity - Shows last 10 transactions
 */

import React from 'react';
import { RecentTransaction } from '../../types/dashboard';

interface Props {
  transactions: RecentTransaction[];
}

export const RecentActivity: React.FC<Props> = ({ transactions }) => {
  const getTransactionStyle = (type: string) => {
    switch (type) {
      case 'in':
        return {
          icon: '📥',
          color: 'text-green-600',
          bg: 'bg-green-50',
          label: 'Stock In',
        };
      case 'out':
        return {
          icon: '📤',
          color: 'text-red-600',
          bg: 'bg-red-50',
          label: 'Stock Out',
        };
      case 'adjustment':
        return {
          icon: '🔧',
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          label: 'Adjustment',
        };
      default:
        return {
          icon: '📦',
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          label: 'Unknown',
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>

      {transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const style = getTransactionStyle(transaction.transaction_type);

            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`${style.bg} w-10 h-10 rounded-full flex items-center justify-center text-xl`}
                  >
                    {style.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {transaction.product_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {style.label} • {transaction.quantity} units •{' '}
                      {transaction.user_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
