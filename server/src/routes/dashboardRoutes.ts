/**
 * Dashboard Routes
 *
 * Just one endpoint: GET /api/dashboard/stats
 * Returns all dashboard data
 */

import { Router } from 'express';
import dashboardController from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Require login to view dashboard
router.use(authenticateToken);

// GET /api/dashboard/stats - Get all dashboard statistics
router.get('/stats', dashboardController.getStats);

export default router;
