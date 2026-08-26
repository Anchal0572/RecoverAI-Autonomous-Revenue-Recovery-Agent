const express = require('express');
const router = express.Router();
const { transactions } = require('../data/mockData');

// AI Recovery Agent pipeline
router.post('/analyze/:txId', (req, res) => {
  const tx = transactions.find(t => t.id === req.params.txId);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });

  // Step 1: Risk Detection
  const riskScore = tx.recoveryScore;
  const riskFactors = [];
  if (tx.retryCount > 1) riskFactors.push('Multiple retry attempts detected');
  if (tx.errorCategory === 'payment_failure') riskFactors.push('Insufficient funds — high churn risk');
  if (tx.errorCategory === 'card_issue') riskFactors.push('Card issue — may need payment method change');
  if (tx.customer.ltv > 50000) riskFactors.push('High-LTV customer — priority recovery');
  if (tx.severity === 'CRITICAL') riskFactors.push('Critical severity — immediate action needed');

  // Step 2: Root Cause Analysis
  const rcaMap = {
    payment_failure: { cause: 'Insufficient account balance', recommendation: 'Retry after 24-48h or offer EMI', confidence: 82 },
    network: { cause: 'Transient network/gateway failure', recommendation: 'Auto-retry immediately', confidence: 91 },
    infrastructure: { cause: 'Payment processor outage', recommendation: 'Retry after system recovery', confidence: 88 },
    card_issue: { cause: 'Card blocked, expired, or invalid', recommendation: 'Prompt alternative payment method', confidence: 79 },
  };
  const rca = rcaMap[tx.errorCategory] || { cause: 'Unknown error', recommendation: 'Manual review required', confidence: 50 };

  // Step 3: Recovery Probability
  let probability = riskScore;
  if (tx.customer.ltv > 100000) probability = Math.min(probability + 10, 95);
  if (tx.retryCount === 0) probability = Math.min(probability + 5, 95);
  if (tx.errorCategory === 'network') probability = Math.min(probability + 15, 95);

  // Step 4: Strategy
  const strategyMap = {
    payment_failure: ['RETRY_PAYMENT', 'EMAIL_REMINDER', 'INVOICE_PAUSE'],
    network: ['RETRY_PAYMENT'],
    infrastructure: ['RETRY_PAYMENT', 'SMS_OTP'],
    card_issue: ['PAYMENT_METHOD_CHANGE', 'EMAIL_REMINDER', 'SMS_OTP'],
  };
  const strategies = strategyMap[tx.errorCategory] || ['EMAIL_REMINDER'];

  // Step 5: Guardrails check
  const guardrails = {
    maxRetries: 3,
    currentRetries: tx.retryCount,
    canRetry: tx.retryCount < 3,
    policyApplied: tx.customer.ltv > 50000 ? 'HIGH_VALUE_CUSTOMER' : 'STANDARD',
    blocked: tx.retryCount >= 3,
  };

  res.json({
    transactionId: tx.id,
    pipeline: {
      riskDetection: { score: riskScore, level: tx.riskLevel, factors: riskFactors },
      rootCauseAnalysis: { ...rca, errorCode: tx.errorCode, category: tx.errorCategory },
      recoveryProbability: { probability, classification: probability > 70 ? 'HIGH' : probability > 50 ? 'MEDIUM' : 'LOW' },
      prioritization: { rank: probability > 70 ? 'P1' : probability > 55 ? 'P2' : 'P3', score: probability },
      recommendedStrategies: strategies,
      guardrails,
    },
    customer: tx.customer,
    amount: tx.amount,
  });
});

// POST execute recovery action
router.post('/execute/:txId', (req, res) => {
  const { action } = req.body;
  const tx = transactions.find(t => t.id === req.params.txId);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });

  const messages = {
    RETRY_PAYMENT: `Auto-retry initiated for ₹${tx.amount.toLocaleString('en-IN')}`,
    EMAIL_REMINDER: `Recovery email sent to ${tx.customer.email}`,
    SMS_OTP: `Payment link sent to ${tx.customer.phone}`,
    PAYMENT_METHOD_CHANGE: `Alternative payment prompt sent to customer`,
    DOWNGRADE_PLAN: `Plan downgrade offer sent`,
    INVOICE_PAUSE: `Invoice paused, follow-up scheduled in 3 days`,
  };

  tx.recoveryStatus = 'IN_PROGRESS';
  tx.updatedAt = new Date().toISOString();

  // Simulate webhook firing back
  setTimeout(() => {
    const success = Math.random() > 0.25;
    tx.recoveryStatus = success ? 'RECOVERED' : 'FAILED';
    tx.status = success ? 'captured' : 'failed';
    if (success) tx.recoveredAt = new Date().toISOString();
  }, 4000);

  res.json({
    message: messages[action] || 'Action initiated',
    action,
    status: 'IN_PROGRESS',
    webhookExpected: true,
    estimatedResolution: '3-5 minutes',
  });
});

module.exports = router;
