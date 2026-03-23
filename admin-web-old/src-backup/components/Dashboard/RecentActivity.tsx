interface Transaction {
  id: number;
  product_name: string;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  created_at: string;
}

interface Props {
  transactions: Transaction[];
}

export const RecentActivity = ({ transactions }: Props) => {
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'in':
        return { icon: '📥', label: 'Stock In', color: 'text-green-600' };
      case 'out':
        return { icon: '📤', label: 'Stock Out', color: 'text-red-600' };
      case 'adjustment':
        return { icon: '🔧', label: 'Adjustment', color: 'text-yellow-600' };
      default:
        return { icon: '📦', label: 'Unknown', color: 'text-gray-600' };
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
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
        Recent Activity
      </h2>
      {transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-8 text-sm sm:text-base">
          No recent activity
        </p>
      ) : (
        <div className="space-y-3">
          {transactions.slice(0, 5).map((transaction) => {
            const typeInfo = getTypeInfo(transaction.transaction_type);
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {transaction.product_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {typeInfo.icon} {typeInfo.label}
                    </span>
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      • {formatDate(transaction.created_at)}
                    </span>
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold flex-shrink-0 ${typeInfo.color}`}
                >
                  {transaction.transaction_type === 'out' ? '-' : '+'}
                  {transaction.quantity}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
