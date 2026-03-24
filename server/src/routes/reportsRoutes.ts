import { Router } from 'express';
import { reportsController } from '../controllers/reportsController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRole('admin', 'manager'));

router.get('/summary', reportsController.getSummary);
router.get('/sales', reportsController.getSales);
router.get('/sales/:id/items', reportsController.getSaleItems);
router.get('/revenue-chart', reportsController.getRevenueChart);

export default router;
