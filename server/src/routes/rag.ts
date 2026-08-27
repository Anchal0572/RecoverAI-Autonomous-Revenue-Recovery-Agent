/**
 * RAG Routes — /api/v1/rag
 */
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { queryKnowledge, listDocuments } from '../controllers/ragController';

const router = Router();

router.use(authMiddleware as any);

router.post('/query', queryKnowledge as any);
router.get('/documents', listDocuments as any);

export default router;
