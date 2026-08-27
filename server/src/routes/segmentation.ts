/**
 * Segmentation Routes — /api/v1/analytics/segments
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getCustomerSegments } from '../controllers/segmentationController';

const router = Router();

router.use(authMiddleware as any);

router.get('/segments', getCustomerSegments as any);

export default router;
