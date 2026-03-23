import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LowStockProduct {
  id?: number;
  product_id?: number;
  sku: string;
  name: string;
  current_stock: number;
  reorder_level: number;
}

interface Props {
  products: LowStockProduct[] | undefined | null;
}

export const LowStockAlert = ({ products }: Props) => {
  const safeProducts = Array.isArray(products) ? products : [];
  if (safeProducts.length === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-100 p-1.5 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <CardTitle className="text-base font-semibold text-red-900">
              Low Stock Alert
            </CardTitle>
          </div>
          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
            {safeProducts.length} {safeProducts.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {safeProducts.map((product, index) => (
            <div
              key={product.id ?? product.product_id ?? index}
              className="bg-white rounded-lg p-3 border border-red-100"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {product.name}
                </p>
                <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200 flex-shrink-0">
                  Low
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mb-3">SKU: {product.sku}</p>
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">In stock </span>
                  <span className="font-bold text-red-600">{product.current_stock}</span>
                </div>
                <div>
                  <span className="text-slate-400">Reorder at </span>
                  <span className="font-medium text-slate-700">{product.reorder_level}</span>
                </div>
              </div>
              <div className="mt-2 w-full bg-red-100 rounded-full h-1.5">
                <div
                  className="bg-red-500 h-1.5 rounded-full"
                  style={{
                    width: `${Math.min((product.current_stock / product.reorder_level) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
