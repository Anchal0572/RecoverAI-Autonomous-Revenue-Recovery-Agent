import { Router } from 'express';
import { getTransactions, getTransactionById, simulateWebhook, manualRecovery } from '../controllers/transaction';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getTransactions as any);
router.post('/simulate', simulateWebhook as any);
router.get('/:id', getTransactionById as any);
router.patch('/:id/recover', manualRecovery as any);

export default router;
