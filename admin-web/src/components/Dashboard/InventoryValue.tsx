import { TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  total_value: number;
  currency?: string;
}

export const InventoryValue = ({ total_value, currency = 'PHP' }: Props) => (
  <Card className="bg-slate-900 border-slate-900 text-white overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            Total Inventory Value
          </p>
          <p className="text-4xl font-bold mt-2 text-white">
            {total_value.toLocaleString('en-US', {
              style: 'currency',
              currency,
            })}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Across all products in stock
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl flex-shrink-0">
          <TrendingUp className="w-8 h-8 text-emerald-400" />
        </div>
      </div>
    </CardContent>
  </Card>
);
