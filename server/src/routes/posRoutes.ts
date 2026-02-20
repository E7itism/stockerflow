import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware'; // reuse existing middleware
import * as posController from '../controllers/posController';

const router = Router();

// All POS routes require authentication
// WHY: Even read-only product browsing needs auth so random
//      internet users can't see your product catalog & prices

router.get('/products', authenticateToken, posController.getProducts);
router.get('/products/:id', authenticateToken, posController.getProductById);
router.post('/sales', authenticateToken, posController.createSale);
router.get('/sales', authenticateToken, posController.getSales);
router.get('/sales/:id', authenticateToken, posController.getSaleById);

export default router;
