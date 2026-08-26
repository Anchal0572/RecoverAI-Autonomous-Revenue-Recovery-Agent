import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getAuditLogs as any);

export default router;
