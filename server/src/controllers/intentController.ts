/**
 * Intent Controller — Hinglish Intent Detection API handler
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { HinglishIntentService } from '../services/HinglishIntentService';

const intentService = new HinglishIntentService();

/**
 * POST /api/v1/intent/detect
 * Detect intent from customer message (supports English, Hindi, Hinglish)
 */
export async function detectIntent(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message string is required.' });
    }

    const result = intentService.detect(message);

    return res.json({
      intent: result.intent,
      confidence: result.confidence,
      language: result.language,
      originalMessage: result.originalMessage,
      matchedPatterns: result.matchedPatterns,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error detecting intent:', error);
    return res.status(500).json({ error: 'Intent detection failed.' });
  }
}
