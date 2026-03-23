import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, inventoryAPI } from '../services/api';
import { Layout } from '../components/Layout';
import {
  OverviewCards,
  RecentActivity,
  LowStockAlert,
  TopProductsChart,
} from '../components/Dashboard/Index';
import type { DashboardData } from '../types/dashboard';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Plus, ArrowRight, AlertTriangle } from 'lucide-react';

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

export const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900" />
        </div>
      </Layout>
    );
  }

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
        {/* ── Greeting ─────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {getGreeting()}, {user?.first_name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{formatDate()}</p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => navigate('/products')}
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
            <Button
              onClick={() => navigate('/inventory')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* ── Low stock warning banner (prominent, near top) ── */}
        {lowStockCount > 0 && (
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
          {dashboardData && <OverviewCards stats={dashboardData} />}
        </div>

        {/* ── Inventory value ──────────────────────────────── */}
        {dashboardData && (
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
        )}

        {/* ── Recent activity + Top products ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity transactions={recentActivity} />
          <TopProductsChart products={dashboardData?.top_products || []} />
        </div>

        {/* ── Low stock detail cards ────────────────────────── */}
        <LowStockAlert products={lowStockProducts} />
      </div>
    </Layout>
  );
};
