/**
 * Dashboard Controller - Handles dashboard API requests
 *
 * What this does:
 * - Gets all dashboard data from models
 * - Combines it into one response
 * - Sends it back to the frontend
 */

import { Request, Response } from 'express';
import dashboardModel from '../models/dashboardModel';
import inventoryModel from '../models/inventoryModel';

class DashboardController {
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      // Get all the data we need
      const overview = await dashboardModel.getOverviewStats();
      const inventoryValue = await dashboardModel.getInventoryValue();
      const recentActivity = await inventoryModel.getRecentTransactions(10);
      const lowStockProducts = await inventoryModel.getLowStockProducts();
      const topProducts = await dashboardModel.getTopProducts(5);

      // Send it all back as JSON
      res.status(200).json({
        overview,
        inventory_value: inventoryValue,
        recent_activity: recentActivity,
        low_stock_products: lowStockProducts,
        top_products: topProducts,
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new DashboardController();
