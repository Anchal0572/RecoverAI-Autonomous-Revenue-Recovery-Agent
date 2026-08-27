/**
 * Leakage Controller — Revenue Leakage Detection API handlers
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { LeakageDetectionService } from '../services/LeakageDetectionService';

const leakageService = new LeakageDetectionService();

/**
 * GET /api/v1/leakage/alerts
 * Returns current leakage alerts for the merchant
 */
export async function getLeakageAlerts(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const alerts = await leakageService.detectLeakages(req.user.merchantId);

    return res.json({
      alerts,
      totalAlerts: alerts.length,
      criticalCount: alerts.filter(a => a.severity === 'CRITICAL').length,
      highCount: alerts.filter(a => a.severity === 'HIGH').length,
      scanTimestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching leakage alerts:', error);
    return res.status(500).json({ error: 'Failed to fetch leakage alerts.' });
  }
}

/**
 * POST /api/v1/leakage/detect
 * Trigger a fresh leakage detection scan
 */
export async function runLeakageDetection(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const alerts = await leakageService.detectLeakages(req.user.merchantId);

    return res.json({
      status: 'SCAN_COMPLETE',
      alerts,
      totalAlerts: alerts.length,
      criticalCount: alerts.filter(a => a.severity === 'CRITICAL').length,
      highCount: alerts.filter(a => a.severity === 'HIGH').length,
      mediumCount: alerts.filter(a => a.severity === 'MEDIUM').length,
      lowCount: alerts.filter(a => a.severity === 'LOW').length,
      scanTimestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error running leakage detection:', error);
    return res.status(500).json({ error: 'Leakage detection scan failed.' });
  }
}
