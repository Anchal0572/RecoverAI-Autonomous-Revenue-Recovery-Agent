/**
 * Demo Routes — /api/v1/demo
 */
import { Router } from 'express';
import {
  getPaymentModeConfig,
  createDemoFailedPayment,
  runDemoRecoveryAI,
  executeDemoRecoveryAction,
  simulateDemoPaymentSuccess,
  simulateDemoPaymentFailure,
  runFullRecoveryDemo,
  resetDemoState
} from '../controllers/demoController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public config endpoint
router.get('/config', getPaymentModeConfig as any);

// Protected recovery workflow demo endpoints
router.use(authMiddleware as any);

router.post('/create-failed-payment', createDemoFailedPayment as any);
router.post('/run-recovery-ai/:transactionId', runDemoRecoveryAI as any);
router.post('/execute-recovery/:recoveryCaseId', executeDemoRecoveryAction as any);
router.post('/simulate-payment-success/:recoveryCaseId', simulateDemoPaymentSuccess as any);
router.post('/simulate-payment-failure/:recoveryCaseId', simulateDemoPaymentFailure as any);
router.post('/run-full-scenario', runFullRecoveryDemo as any);
router.post('/reset', resetDemoState as any);

export default router;
