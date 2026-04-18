import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, inventoryAPI, reportsAPI } from '../services/api';
import { Layout } from '../components/Layout';
import {
  OverviewCards,
  RecentActivity,
  LowStockAlert,
  TopProductsChart,
} from '../components/Dashboard/Index';
import { RevenueChart } from '../components/Dashboard/RevenueChart';
import { useSocket } from '../hooks/useSocket';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardData } from '../types/dashboard';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Plus, ArrowRight, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const formatPeso = (value: number, currency = 'PHP') =>
  value.toLocaleString('en-US', { style: 'currency', currency });

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatDate = () =>
  new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// ─────────────────────────────────────────────
// SKELETON COMPONENTS — match exact layout
// ─────────────────────────────────────────────

const OverviewCardsSkeleton = () => (
  <>
    {[...Array(4)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-11 w-11 rounded-xl flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    ))}
  </>
);

const InventoryValueSkeleton = () => (
  <Card className="bg-slate-900 border-slate-900 overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-40 bg-slate-700" />
          <Skeleton className="h-10 w-48 bg-slate-700" />
          <Skeleton className="h-3 w-56 bg-slate-700" />
        </div>
        <Skeleton className="h-16 w-16 rounded-xl bg-slate-800 flex-shrink-0" />
      </div>
    </CardContent>
  </Card>
);

const RecentActivitySkeleton = () => (
  <Card>
    <CardContent className="p-5 space-y-4">
      <Skeleton className="h-5 w-32" />
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0"
        >
          <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </CardContent>
  </Card>
);

const TopProductsSkeleton = () => (
  <Card>
    <CardContent className="p-5 space-y-4">
      <Skeleton className="h-5 w-28" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-3 w-20 ml-auto" />
        </div>
      ))}
    </CardContent>
  </Card>
);

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { canViewReports } = useRole();
  const navigate = useNavigate();

  const fetchStats = useCallback(async () => {
    try {
      const [statsData, recentData, lowStockData] = await Promise.all([
        dashboardAPI.getStats(),
        inventoryAPI.getRecentTransactions(10),
        inventoryAPI.getLowStock(),
      ]);
      setDashboardData(statsData);
      setRecentActivity(recentData.transactions || recentData);
      setLowStockProducts(lowStockData.low_stock_products || lowStockData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    }
  }, []);

  const fetchChart = useCallback(async () => {
    if (!canViewReports) return;
    try {
      setChartLoading(true);
      const chart = await reportsAPI.getRevenueChart(30);
      setRevenueData(chart);
    } catch {
      // non-critical
    } finally {
      setChartLoading(false);
    }
  }, [canViewReports]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await fetchStats();
    setLoading(false);
    await fetchChart();
  }, [fetchStats, fetchChart]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useSocket({
    'sale:created': (data) => {
      toast.success(`New sale — ₱${Number(data.total_amount).toFixed(2)}`, {
        icon: '🧾',
      });
      fetchStats();
      if (canViewReports) fetchChart();
    },
    'stock:updated': () => {
      fetchStats();
    },
  });

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchDashboardData}>
              Retry
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const lowStockCount = Array.isArray(lowStockProducts)
    ? lowStockProducts.length
    : 0;

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* ── Greeting + Quick actions ─────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-slate-900">
                  {getGreeting()}, {user?.first_name} 👋
                </h1>
                <p className="text-sm text-slate-500 mt-1">{formatDate()}</p>
              </>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => navigate('/products')}
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 gap-2"
            >
              <Plus className="w-4 h-4" /> Add Product
            </Button>
            <Button
              onClick={() => navigate('/inventory')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Add Transaction
            </Button>
          </div>
        </div>

        {/* ── Low stock banner ─────────────────────────────── */}
        {!loading && lowStockCount > 0 && (
          <button
            onClick={() => navigate('/inventory')}
            className="w-full text-left"
          >
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between hover:bg-red-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-1.5 rounded-lg flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    {lowStockCount}{' '}
                    {lowStockCount === 1 ? 'product needs' : 'products need'}{' '}
                    restocking
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    Click to view inventory and add stock
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-red-400 flex-shrink-0" />
            </div>
          </button>
        )}

        {/* ── Overview cards ───────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <OverviewCardsSkeleton />
          ) : (
            dashboardData && <OverviewCards stats={dashboardData} />
          )}
        </div>

        {/* ── Revenue chart ────────────────────────────────── */}
        {canViewReports && (
          <RevenueChart data={revenueData} loading={chartLoading} />
        )}

        {/* ── Inventory value banner ────────────────────────── */}
        {loading ? (
          <InventoryValueSkeleton />
        ) : (
          dashboardData && (
            <Card className="bg-slate-900 border-slate-900 text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                      Total Inventory Value
                    </p>
                    <p className="text-3xl sm:text-4xl font-bold mt-2 text-white">
                      {formatPeso(
                        dashboardData.inventory_value?.total_value || 0,
                        dashboardData.inventory_value?.currency,
                      )}
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                      Across all products currently in stock
                    </p>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-xl flex-shrink-0">
                    <TrendingUp className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* ── Recent activity + Top products ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <>
              <RecentActivitySkeleton />
              <TopProductsSkeleton />
            </>
          ) : (
            <>
              <RecentActivity transactions={recentActivity} />
              <TopProductsChart products={dashboardData?.top_products || []} />
            </>
          )}
        </div>

        {/* ── Low stock detail ─────────────────────────────── */}
        {!loading && <LowStockAlert products={lowStockProducts} />}
      </div>
    </Layout>
  );
};
