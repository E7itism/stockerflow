import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TopProduct {
  product_id?: number;
  id?: number;
  product_name: string;
  sku: string;
  transaction_count: number;
  current_stock?: number;
}

interface Props {
  products: TopProduct[];
}

export const TopProductsChart = ({ products }: Props) => {
  const maxCount = Math.max(...products.map((p) => p.transaction_count), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Top Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No product data</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.slice(0, 5).map((product, index) => {
              const percentage = (product.transaction_count / maxCount) * 100;
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={product.product_id ?? product.id ?? index}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm flex-shrink-0">
                        {medals[index] ?? `${index + 1}.`}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {product.product_name}
                        </p>
                        <p className="text-xs text-slate-400">{product.sku}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 flex-shrink-0 ml-2">
                      {product.transaction_count} Transactions
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-slate-900 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
