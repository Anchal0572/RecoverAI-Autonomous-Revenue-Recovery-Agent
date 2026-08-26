/**
 * Agent Routes — /api/v1/agent
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { runAgentPipeline, getAgentRuns, getAgentRunById, getAgentStatus, testIndividualAgent } from '../controllers/agentController';

const router = Router();

router.use(authMiddleware as any);

router.post('/run/:transactionId', runAgentPipeline as any);
router.post('/test/:agentName', testIndividualAgent as any);
router.get('/runs', getAgentRuns as any);
router.get('/runs/:id', getAgentRunById as any);
router.get('/status', getAgentStatus as any);

export default router;
