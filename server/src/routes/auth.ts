import { Router } from 'express';
import { register, login, me } from '../controllers/auth';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware as any, me as any);

export default router;
