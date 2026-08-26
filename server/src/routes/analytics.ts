import { Router } from 'express';
import { 
  getRevenueRiskAnalytics, 
  getRecoveryAnalytics, 
  getModelPerformanceInfo, 
  getModelPerformanceEvaluation 
} from '../controllers/analytics';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/revenue-risk', getRevenueRiskAnalytics as any);
router.get('/recovery', getRecoveryAnalytics as any);
router.get('/model-info', getModelPerformanceInfo as any);
router.get('/evaluation', getModelPerformanceEvaluation as any);

export default router;
