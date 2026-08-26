import { Router } from 'express';
import { 
  getCases, 
  getCaseDetails, 
  getAgentAnalysis,
  approveCaseController,
  rejectCaseController,
  getApprovalQueueController
} from '../controllers/case';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/approval-queue', getApprovalQueueController as any);
router.get('/', getCases as any);
router.get('/:id', getCaseDetails as any);
router.post('/:id/approve', approveCaseController as any);
router.post('/:id/reject', rejectCaseController as any);
router.post('/analyze/:id', getAgentAnalysis as any);

export default router;
