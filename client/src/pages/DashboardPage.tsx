/**
 * Dashboard Page - UPDATED to use Layout
 *
 * CHANGES:
 * - Removed <Navbar /> (now in Layout)
 * - Removed min-h-screen and bg-gray-50 wrapper (now in Layout)
 * - Just returns the content
 */

import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';
import { DashboardData } from '../types/dashboard';
import { OverviewCards } from '../components/Dashboard/OverviewCards';
import { InventoryValue } from '../components/Dashboard/InventoryValue';
import { RecentActivity } from '../components/Dashboard/RecentActivity';
import { LowStockAlert } from '../components/Dashboard/LowStockAlert';
import { TopProductsChart } from '../components/Dashboard/TopProductsChart';
import { Layout } from '../components/Layout';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await dashboardAPI.getStats();
      setData(dashboardData);
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
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-600 text-xl font-semibold">⚠️ Error</p>
            <p className="text-gray-600 mt-2">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-600">No data available</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your inventory management system
          </p>
        </div>

        {/* Dashboard Content */}
        <OverviewCards stats={data.overview} />
        <InventoryValue inventoryValue={data.inventory_value} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RecentActivity transactions={data.recent_activity} />
          <TopProductsChart products={data.top_products} />
        </div>

        <LowStockAlert products={data.low_stock_products} />
      </div>
    </Layout>
  );
};
