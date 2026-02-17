import { useEffect, useState } from 'react';
import { dashboardAPI, inventoryAPI } from '../services/api';
import { Layout } from '../components/Layout';
import {
  OverviewCards,
  InventoryValue,
  RecentActivity,
  LowStockAlert,
  TopProductsChart,
} from '../components/Dashboard/Index';
import { DashboardData } from '../types/dashboard';

export const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  console.log('dash data', dashboardData);
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
      console.log('stats data: ', statsData);

      setDashboardData(statsData);
      setRecentActivity(recentData.transactions || recentData);
      setLowStockProducts(lowStockData.low_stock_products || lowStockData);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Welcome back! Here's what's happening with your inventory.
          </p>
        </div>

        {/* Overview Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {dashboardData && <OverviewCards stats={dashboardData} />}
        </div>

        {/* Inventory Value - Full Width */}
        {dashboardData && (
          <div className="mb-6 sm:mb-8">
            <InventoryValue
              total_value={dashboardData.inventory_value?.total_value || 0}
              currency={dashboardData.inventory_value?.currency}
            />
          </div>
        )}

        {/* Two Column Layout - Stack on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <RecentActivity transactions={recentActivity} />
          <TopProductsChart products={dashboardData?.top_products || []} />
        </div>

        {/* Low Stock Alert - Full Width */}
        <LowStockAlert products={lowStockProducts} />
      </div>
    </Layout>
  );
};
