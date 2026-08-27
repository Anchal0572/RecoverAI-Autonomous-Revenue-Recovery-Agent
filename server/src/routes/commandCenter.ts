/**
 * Command Center Routes — /api/v1/command-center
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getCommandCenterData } from '../controllers/commandCenterController';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getCommandCenterData as any);

export default router;
