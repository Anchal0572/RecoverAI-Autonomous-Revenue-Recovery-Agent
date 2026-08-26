const express = require('express');
const router = express.Router();
const { transactions } = require('../data/mockData');

// GET monitoring status
router.get('/status', (req, res) => {
  const inProgress = transactions.filter(t => t.recoveryStatus === 'IN_PROGRESS');
  const recentRecovered = transactions
    .filter(t => t.recoveryStatus === 'RECOVERED' && t.recoveredAt)
    .sort((a, b) => new Date(b.recoveredAt) - new Date(a.recoveredAt))
    .slice(0, 5);

  const criticalPending = transactions
    .filter(t => t.recoveryStatus === 'PENDING' && t.severity === 'CRITICAL')
    .slice(0, 5);

  res.json({
    agentStatus: 'ACTIVE',
    monitoringVersion: '1.4.2',
    lastHeartbeat: new Date().toISOString(),
    activeRecoveries: inProgress.length,
    recentRecoveries: recentRecovered,
    criticalAlerts: criticalPending,
    metrics: {
      successRate: 72,
      avgRecoveryTimeMin: 4.2,
      totalRecoveredToday: Math.floor(Math.random() * 10) + 5,
      revenueRecoveredToday: Math.floor(Math.random() * 200000) + 50000,
    },
  });
});

// POST simulate webhook from Razorpay
router.post('/webhook', (req, res) => {
  const { event, payload } = req.body;
  // Simulate processing
  console.log(`[Webhook] Event: ${event}`, payload);
  res.json({ status: 'received', event, processed: true });
});

module.exports = router;
