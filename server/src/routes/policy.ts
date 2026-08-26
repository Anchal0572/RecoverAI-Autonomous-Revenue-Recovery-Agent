import { Router } from 'express';
import { getPolicy, updatePolicy } from '../controllers/policy';
import { authMiddleware, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware as any);

router.get('/', getPolicy as any);
// Only Admin and Finance Manager roles can modify policies
router.put('/', authorizeRoles('Admin', 'Finance Manager') as any, updatePolicy as any);

export default router;
