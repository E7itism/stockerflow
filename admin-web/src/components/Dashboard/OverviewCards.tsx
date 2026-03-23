import { Package, FolderOpen, Truck, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  stats: {
    total_products: number;
    total_categories: number;
    total_suppliers: number;
    low_stock_count: number;
  };
}

const cards = [
  {
    title: 'Total Products',
    key: 'total_products' as const,
    icon: Package,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    title: 'Categories',
    key: 'total_categories' as const,
    icon: FolderOpen,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    title: 'Suppliers',
    key: 'total_suppliers' as const,
    icon: Truck,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    title: 'Low Stock Items',
    key: 'low_stock_count' as const,
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
];

export const OverviewCards = ({ stats }: Props) => (
  <>
    {cards.map((card) => {
      const Icon = card.icon;
      return (
        <Card key={card.key} className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats[card.key]}
                </p>
              </div>
              <div className={`${card.bg} p-3 rounded-xl flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      );
    })}
  </>
);
