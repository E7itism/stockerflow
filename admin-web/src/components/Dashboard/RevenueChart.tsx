import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface DailyRevenue {
  date: string;
  revenue: number;
  transactions: number;
}

interface Props {
  data: DailyRevenue[];
  loading: boolean;
}

const formatPeso = (value: number) =>
  `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
      <p className="text-xs font-medium text-slate-500 mb-1">
        {formatDate(label)}
      </p>
      <p className="text-sm font-bold text-slate-900">
        {formatPeso(payload[0]?.value || 0)}
      </p>
      <p className="text-xs text-slate-400">
        {payload[1]?.value || 0} transactions
      </p>
    </div>
  );
};

export const RevenueChart = ({ data, loading }: Props) => {
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Revenue (Last 30 Days)
            </CardTitle>
            {!loading && hasData && (
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatPeso(totalRevenue)}
              </p>
            )}
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-xl">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900" />
          </div>
        ) : !hasData ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400">
            <TrendingUp className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No sales data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={data}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(val) =>
                  new Date(val).toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                  })
                }
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(val) => `₱${(val / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#0f172a"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#0f172a', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
