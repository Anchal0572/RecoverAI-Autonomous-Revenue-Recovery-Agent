/**
 * Intent Routes — /api/v1/intent
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { detectIntent } from '../controllers/intentController';

const router = Router();

router.use(authMiddleware as any);

router.post('/detect', detectIntent as any);

export default router;
