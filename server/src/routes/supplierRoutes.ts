import { Router } from 'express';
import supplierController from '../controllers/supplierController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Supplier CRUD routes
router.post('/', supplierController.create);
router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getOne);
router.put('/:id', supplierController.update);
router.delete('/:id', supplierController.delete);

export default router;
