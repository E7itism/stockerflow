/**
 * DashboardPage.tsx
 *
 * The main overview screen users see after login.
 * Fetches all summary data in one go and distributes it to child components.
 *
 * Layout (responsive):
 * - Overview cards:  1 col (mobile) → 2 col (sm) → 4 col (lg)
 * - Bottom section: 1 col (mobile) → 2 col (lg)
 */

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Fetches all dashboard data in parallel using Promise.all.
   *
   * Why 3 separate API calls instead of one?
   * - dashboardAPI.getStats() → overview numbers and top products
   * - inventoryAPI.getRecentTransactions() → activity feed (separate concern)
   * - inventoryAPI.getLowStock() → alert section (separate concern)
   *
   * Why Promise.all?
   * Running them in parallel cuts load time by ~2/3 vs sequential awaits.
   * If any one fails, the whole fetch fails together (caught in one catch block).
   *
   * ⚠️ IMPORTANT: Dashboard API returns a NESTED structure:
   *   statsData.inventory_value.total_value  ✅
   *   statsData.total_value                  ❌ undefined
   */
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

      // Handle both possible response shapes from the transactions endpoint
      setRecentActivity(recentData.transactions || recentData);

      // low_stock_products is the correct property name (with underscore)
      // Using just lowStockData would set the whole response object, not the array
      setLowStockProducts(lowStockData.low_stock_products || lowStockData);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Show full-screen spinner while loading (not inline)
  // because the whole page depends on this data
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
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Welcome back! Here's what's happening with your inventory.
          </p>
        </div>

        {/* 
          Overview Cards — responsive grid
          grid-cols-1 → sm:grid-cols-2 → lg:grid-cols-4
          Each OverviewCard reads from dashboardData.overview.*
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {dashboardData && <OverviewCards stats={dashboardData} />}
        </div>

        {/* 
          Inventory Value — full width banner
          Reads from dashboardData.inventory_value.total_value (nested!)
          Falls back to 0 if undefined to avoid NaN display
        */}
        {dashboardData && (
          <div className="mb-6 sm:mb-8">
            <InventoryValue
              total_value={dashboardData.inventory_value?.total_value || 0}
              currency={dashboardData.inventory_value?.currency}
            />
          </div>
        )}

        {/* 
          Two-column section — stacks to 1 col on mobile
          RecentActivity shows last 10 transactions
          TopProductsChart shows bar chart of top products by stock
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <RecentActivity transactions={recentActivity} />
          <TopProductsChart products={dashboardData?.top_products || []} />
        </div>

        {/* 
          LowStockAlert — full width, only renders if there are low stock items
          Products with current_stock <= reorder_level appear here
        */}
        <LowStockAlert products={lowStockProducts} />
      </div>
    </Layout>
  );
};
