import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
const router = Router();
// Public routes (no authentication required)
router.post('/register', authController.register);
router.post('/login', authController.login);
// Protected routes (authentication required)
router.get('/me', authenticateToken, authController.getCurrentUser);
export default router;
