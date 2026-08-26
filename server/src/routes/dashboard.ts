import { Router } from 'express';
import { getDashboardSummary, getDashboardTrends } from '../controllers/dashboard';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/summary', getDashboardSummary as any);
router.get('/trends', getDashboardTrends as any);

export default router;
