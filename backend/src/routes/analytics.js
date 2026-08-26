const express = require('express');
const router = express.Router();
const { transactions, auditLogs } = require('../data/mockData');

// GET analytics summary
router.get('/summary', (req, res) => {
  const total = transactions.length;
  const recovered = transactions.filter(t => t.recoveryStatus === 'RECOVERED').length;
  const inProgress = transactions.filter(t => t.recoveryStatus === 'IN_PROGRESS').length;
  const failed = transactions.filter(t => t.recoveryStatus === 'FAILED').length;
  const pending = transactions.filter(t => t.recoveryStatus === 'PENDING').length;

  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0);
  const recoveredAmount = transactions
    .filter(t => t.recoveryStatus === 'RECOVERED')
    .reduce((s, t) => s + t.amount, 0);

  const avgRecoveryScore = Math.round(
    transactions.reduce((s, t) => s + t.recoveryScore, 0) / total
  );

  // Risk distribution
  const riskDist = {
    HIGH: transactions.filter(t => t.riskLevel === 'HIGH').length,
    MEDIUM: transactions.filter(t => t.riskLevel === 'MEDIUM').length,
    LOW: transactions.filter(t => t.riskLevel === 'LOW').length,
  };

  // Error category distribution
  const errorCats = {};
  transactions.forEach(t => {
    errorCats[t.errorCategory] = (errorCats[t.errorCategory] || 0) + 1;
  });

  // Daily recovery trend (last 7 days)
  const trend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayStr = date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const dayRecovered = Math.floor(Math.random() * 8) + 2;
    const dayFailed = Math.floor(Math.random() * 5) + 1;
    return {
      date: dayStr,
      recovered: dayRecovered,
      failed: dayFailed,
      amount: (dayRecovered * (Math.floor(Math.random() * 10000) + 5000)),
    };
  });

  res.json({
    counts: { total, recovered, inProgress, failed, pending },
    amounts: { total: totalAmount, recovered: recoveredAmount, recovery_rate: Math.round((recoveredAmount / totalAmount) * 100) },
    avgRecoveryScore,
    riskDistribution: riskDist,
    errorCategories: Object.entries(errorCats).map(([name, value]) => ({ name, value })),
    trend,
  });
});

// GET audit logs
router.get('/audit', (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const sorted = [...auditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json({
    total: sorted.length,
    data: sorted.slice(Number(offset), Number(offset) + Number(limit)),
  });
});

module.exports = router;
