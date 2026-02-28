/**
 * reportsRoutes.ts
 *
 * Route definitions for the sales reports feature.
 *
 * MIDDLEWARE CHAIN:
 * authMiddleware → authorizeRole → controller
 *
 * WHY enforce roles on the backend even though the frontend already does it?
 * Frontend role checks are UX conveniences — they can be bypassed by anyone
 * who knows the API URL and has a valid token. The backend is the real
 * security layer. Both must exist for proper protection.
 *
 * Base path: /api/reports (registered in server.ts)
 */

import { Router } from 'express';
import { reportsController } from '../controllers/reportsController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

/**
 * Apply authentication to all routes first.
 * No valid JWT = 401 before role check even runs.
 */
router.use(authenticateToken);

/**
 * Apply role restriction to all routes in this file.
 * Valid JWT but wrong role = 403 Forbidden.
 *
 * WHY use router.use() instead of adding to each route individually?
 * All report endpoints have the same role requirement (admin + manager).
 * Applying it once at the router level is DRY and ensures we never
 * accidentally forget to add it to a new endpoint in this file.
 */
router.use(authorizeRole('admin', 'manager'));

router.get('/summary', reportsController.getSummary);
router.get('/sales', reportsController.getSales);
router.get('/sales/:id/items', reportsController.getSaleItems);

export default router;
