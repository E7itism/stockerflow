/**
 * Dashboard Page - Main page that combines all components
 */

import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';
import { DashboardData } from '../types/dashboard';
import { OverviewCards } from '../components/Dashboard/OverviewCards';
import { InventoryValue } from '../components/Dashboard/InventoryValue';
import { RecentActivity } from '../components/Dashboard/RecentActivity';
import { LowStockAlert } from '../components/Dashboard/LowStockAlert';
import { TopProductsChart } from '../components/Dashboard/TopProductsChart';
import { Navbar } from '../components/Navbar';

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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
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
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Inventory Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Overview of your inventory management system
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OverviewCards stats={data.overview} />
        <InventoryValue inventoryValue={data.inventory_value} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RecentActivity transactions={data.recent_activity} />
          <TopProductsChart products={data.top_products} />
        </div>

        <LowStockAlert products={data.low_stock_products} />
      </div>
    </div>
  );
};
