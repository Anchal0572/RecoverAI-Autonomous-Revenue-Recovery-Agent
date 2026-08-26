const express = require('express');
const router = express.Router();
const { transactions, generateTransaction } = require('../data/mockData');

// GET all transactions
router.get('/', (req, res) => {
  const { status, riskLevel, limit = 50, offset = 0 } = req.query;
  let result = [...transactions];
  if (status) result = result.filter(t => t.recoveryStatus === status);
  if (riskLevel) result = result.filter(t => t.riskLevel === riskLevel);
  res.json({
    total: result.length,
    data: result.slice(Number(offset), Number(offset) + Number(limit)),
  });
});

// GET single transaction
router.get('/:id', (req, res) => {
  const tx = transactions.find(t => t.id === req.params.id);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });
  res.json(tx);
});

// POST simulate a new failed transaction (Razorpay webhook simulation)
router.post('/simulate', (req, res) => {
  const newTx = generateTransaction(req.body || {});
  transactions.unshift(newTx);
  res.status(201).json(newTx);
});

// PATCH trigger recovery on a transaction
router.patch('/:id/recover', (req, res) => {
  const tx = transactions.find(t => t.id === req.params.id);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });
  tx.recoveryStatus = 'IN_PROGRESS';
  tx.updatedAt = new Date().toISOString();
  // Simulate async recovery
  setTimeout(() => {
    tx.recoveryStatus = Math.random() > 0.3 ? 'RECOVERED' : 'FAILED';
    tx.status = tx.recoveryStatus === 'RECOVERED' ? 'captured' : 'failed';
    if (tx.recoveryStatus === 'RECOVERED') tx.recoveredAt = new Date().toISOString();
  }, 3000);
  res.json({ message: 'Recovery initiated', transaction: tx });
});

module.exports = router;
