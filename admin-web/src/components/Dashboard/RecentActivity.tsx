import {
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

const typeConfig = {
  in: {
    icon: ArrowDownToLine,
    label: 'Stock In',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    quantity: 'text-emerald-600',
    prefix: '+',
  },
  out: {
    icon: ArrowUpFromLine,
    label: 'Stock Out',
    badge: 'bg-red-50 text-red-700 border-red-200',
    quantity: 'text-red-600',
    prefix: '-',
  },
  adjustment: {
    icon: SlidersHorizontal,
    label: 'Adjustment',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    quantity: 'text-amber-600',
    prefix: '',
  },
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const RecentActivity = ({ transactions }: Props) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base font-semibold text-slate-900">
        Recent Activity
      </CardTitle>
    </CardHeader>
    <CardContent>
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <Package className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-1">
          {transactions.slice(0, 8).map((transaction) => {
            const config =
              typeConfig[transaction.transaction_type] ?? typeConfig.adjustment;
            const Icon = config.icon;
            return (
              <div
                key={transaction.id}
                className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {transaction.product_name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDate(transaction.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-xs ${config.badge}`}
                  >
                    {config.label}
                  </Badge>
                  <span className={`text-sm font-bold ${config.quantity}`}>
                    {config.prefix}
                    {transaction.quantity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardContent>
  </Card>
);
