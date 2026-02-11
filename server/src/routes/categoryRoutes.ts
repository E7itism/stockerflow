import { Router } from 'express';
import categoryController from '../controllers/categoryController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Category CRUD routes
router.post('/', categoryController.create);
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getOne);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.delete);

export default router;
