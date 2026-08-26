import { Router } from 'express';
import { getCases, getCaseDetails, getAgentAnalysis } from '../controllers/case';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getCases as any);
router.get('/:id', getCaseDetails as any);
router.post('/analyze/:id', getAgentAnalysis as any); // Match frontend POST /api/v1/agent/analyze/:txId route mapping

export default router;
