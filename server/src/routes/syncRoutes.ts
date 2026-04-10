import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { pullChanges, pushChanges } from '../controllers/syncController';

const router = Router();

// Local-first sync endpoints
router.get('/pull', authenticateToken, pullChanges);
router.post('/push', authenticateToken, pushChanges);

export default router;
