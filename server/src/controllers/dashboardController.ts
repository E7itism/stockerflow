/**
 * dashboardController.ts
 *
 * Aggregates data from multiple models into one dashboard response.
 *
 * ⚠️ IMPORTANT — Response shape is NESTED:
 *   res.inventory_value.total_value   correct
 *   res.total_value                   undefined
 *
 * Frontend must access nested properties correctly.
 * See DashboardPage.tsx for how this is consumed.
 */

import { Request, Response } from 'express';
import dashboardModel from '../models/dashboardModel';
import inventoryModel from '../models/inventoryModel';

class DashboardController {
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const overview = await dashboardModel.getOverviewStats();
      const inventoryValue = await dashboardModel.getInventoryValue();
      const recentActivity = await inventoryModel.getRecentTransactions(10);
      const lowStockProducts = await inventoryModel.getLowStockProducts();
      const topProducts = await dashboardModel.getTopProducts(5);

      /**
       * Nested response structure:
       * {
       *   overview: { total_products, total_categories, total_suppliers, low_stock_count }
       *   inventory_value: { total_value, currency }
       *   recent_activity: [ ...transactions ]
       *   low_stock_products: [ ...products ]
       *   top_products: [ ...products ]
       * }
       */
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
