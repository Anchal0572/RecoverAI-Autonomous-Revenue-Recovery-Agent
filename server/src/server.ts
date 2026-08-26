import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';

// Import routers
import authRouter from './routes/auth';
import dashboardRouter from './routes/dashboard';
import transactionRouter from './routes/transaction';
import caseRouter from './routes/case';
import policyRouter from './routes/policy';
import auditRouter from './routes/audit';
import analyticsRouter from './routes/analytics';
import seedRouter from './routes/seed';

// Import controllers for standalone endpoints
import { getMonitoringStatus } from './controllers/monitoring';
import { getAgentAnalysis } from './controllers/case';
import { authMiddleware } from './middleware/authMiddleware';

dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 150,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// API Endpoints v1
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/transactions', transactionRouter);
app.use('/api/v1/recovery-cases', caseRouter);
app.use('/api/v1/policies', policyRouter);
app.use('/api/v1/audit-events', auditRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/seed', seedRouter);

// Standalone v1 routes matching frontend client expectations
app.get('/api/v1/monitoring/status', authMiddleware as any, getMonitoringStatus as any);
app.post('/api/v1/agent/analyze/:id', authMiddleware as any, getAgentAnalysis as any);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0', service: 'RecoverAI Enterprise TS Server' });
});

// Global Error Handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`\n🚀 RecoverAI TS Backend running on http://localhost:${PORT}`);
    console.log('📊 Connected and serving production fintech routes.');
  });
}

export default app;
