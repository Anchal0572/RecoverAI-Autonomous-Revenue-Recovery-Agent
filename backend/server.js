const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Routes
const transactionsRouter = require('./src/routes/transactions');
const analyticsRouter = require('./src/routes/analytics');
const agentRouter = require('./src/routes/agent');
const monitoringRouter = require('./src/routes/monitoring');

app.use('/api/transactions', transactionsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/agent', agentRouter);
app.use('/api/monitoring', monitoringRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', service: 'RecoverAI Backend' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 RecoverAI Backend running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET  /api/transactions`);
  console.log(`   GET  /api/analytics/summary`);
  console.log(`   POST /api/agent/analyze/:txId`);
  console.log(`   GET  /api/monitoring/status`);
});

module.exports = app;
