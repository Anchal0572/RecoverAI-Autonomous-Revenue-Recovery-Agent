/**
 * Simulator Routes — /api/v1/simulator
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { runWhatIfSimulation } from '../controllers/simulatorController';
import { compareStrategies } from '../controllers/strategyComparisonController';

const router = Router();

router.use(authMiddleware as any);

router.post('/what-if', runWhatIfSimulation as any);
router.post('/compare-strategies', compareStrategies as any);

export default router;
