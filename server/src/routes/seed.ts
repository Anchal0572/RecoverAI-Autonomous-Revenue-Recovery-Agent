import { Router, Response } from 'express';
import { seedDatabase } from '../services/seed';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { Types } from 'mongoose';

const router = Router();

router.use(authMiddleware as any);

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const merchantId = new Types.ObjectId(req.user.merchantId);
    
    await seedDatabase(merchantId, true);
    
    return res.json({ message: 'Database seeded successfully with 10,000 mock transactions!' });
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return res.status(500).json({ error: error.message || 'Seeding failed' });
  }
});

export default router;
