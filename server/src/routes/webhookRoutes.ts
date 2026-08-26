/**
 * Webhook Routes — /api/v1/webhooks
 */
import { Router } from 'express';
import { handleRazorpayWebhook, getWebhookStatus, triggerTestWebhook } from '../controllers/webhookController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public webhook listener endpoint (Signature verified inside controller)
router.post('/razorpay', handleRazorpayWebhook as any);

// Protected status & test trigger endpoints for frontend UI
router.get('/status', authMiddleware as any, getWebhookStatus as any);
router.post('/trigger-test', authMiddleware as any, triggerTestWebhook as any);

export default router;
