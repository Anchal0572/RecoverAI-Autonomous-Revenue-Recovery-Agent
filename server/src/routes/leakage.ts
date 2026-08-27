/**
 * Leakage Routes — /api/v1/leakage
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getLeakageAlerts, runLeakageDetection } from '../controllers/leakageController';

const router = Router();

router.use(authMiddleware as any);

router.get('/alerts', getLeakageAlerts as any);
router.post('/detect', runLeakageDetection as any);

export default router;
