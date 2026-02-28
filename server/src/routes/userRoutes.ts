/**
 * userRoutes.ts
 *
 * All routes here are admin-only.
 * Middleware chain: authenticateToken → authorizeRole('admin') → controller
 *
 * Base path: /api/users (registered in server.ts)
 */

import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// Lock down the entire router — must be logged in AND be an admin
router.use(authenticateToken);
router.use(authorizeRole('admin'));

/** GET  /api/users           — list all users */
router.get('/', userController.getAll);

/** PUT  /api/users/:id/role  — change a user's role */
router.put('/:id/role', userController.updateRole);

/** PUT  /api/users/:id/status — activate or deactivate a user */
router.put('/:id/status', userController.updateStatus);

export default router;
