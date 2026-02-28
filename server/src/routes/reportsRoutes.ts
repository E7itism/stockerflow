/**
 * reportsRoutes.ts
 *
 * Route definitions for the sales reports feature.
 * All routes require authentication (authMiddleware).
 *
 * Base path: /api/reports  (registered in server.ts)
 */

import { Router } from 'express';
import { reportsController } from '../controllers/reportsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// All reports endpoints require a valid JWT — cashier data is sensitive
router.use(authenticateToken);

/**
 * GET /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns revenue totals + top 5 selling products for the date range.
 */
router.get('/summary', reportsController.getSummary);

/**
 * GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20
 * Returns paginated list of sales transactions.
 */
router.get('/sales', reportsController.getSales);

/**
 * GET /api/reports/sales/:id/items
 * Returns line items for a single sale (lazy-loaded when row is expanded).
 */
router.get('/sales/:id/items', reportsController.getSaleItems);

export default router;
