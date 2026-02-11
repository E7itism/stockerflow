import { Router } from 'express';
import productController from '../controllers/productController';
import { authenticateToken } from '../middleware/authMiddleware';
const router = Router();
// All product routes require authentication
router.use(authenticateToken);
// Product CRUD routes
router.post('/', productController.create);
router.get('/', productController.getAll);
router.get('/:id', productController.getOne);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);
export default router;
