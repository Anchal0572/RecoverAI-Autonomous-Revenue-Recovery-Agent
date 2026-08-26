import mongoose, { Schema } from 'mongoose';
import { Customer } from '../models/Customer';
import { Transaction } from '../models/Transaction';
import { RecoveryCase } from '../models/RecoveryCase';
import { AgentDecision } from '../models/AgentDecision';
import { AuditEvent } from '../models/AuditEvent';
import { RecoveryAction } from '../models/RecoveryAction';

// A simple LCG Seeded Random utility for reproducible mock data
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  choose<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Aarush', 'Priya', 'Anjali', 'Neha', 'Riya', 'Kavya', 'Meera', 'Pooja', 'Sneha', 'Rahul', 'Amit', 'Vikram', 'Deepak'];
const LAST_NAMES = ['Sharma', 'Verma', 'Singh', 'Nair', 'Patel', 'Reddy', 'Nambiar', 'Malhotra', 'Gupta', 'Iyer', 'Joshi', 'Choudhury', 'Mehta', 'Kumar', 'Rao', 'Shah', 'Dubey', 'Sen', 'Pillai', 'Roy'];
const ERROR_DESCRIPTIONS = [
  { code: 'BAD_REQUEST_ERROR', description: 'Insufficient funds in customer account', category: 'payment_failure', severity: 'HIGH' },
  { code: 'GATEWAY_ERROR', description: 'Bank gateway server timeout', category: 'network', severity: 'MEDIUM' },
  { code: 'SERVER_ERROR', description: 'Payment processing network failure', category: 'infrastructure', severity: 'CRITICAL' },
  { code: 'BAD_REQUEST_ERROR', description: 'Card has expired', category: 'card_issue', severity: 'HIGH' },
  { code: 'BAD_REQUEST_ERROR', description: 'Card blocked by card issuer bank', category: 'card_issue', severity: 'HIGH' },
  { code: 'GATEWAY_ERROR', description: 'Network packet drop during authentication', category: 'network', severity: 'LOW' },
  { code: 'BAD_REQUEST_ERROR', description: 'Incorrect card credentials entered', category: 'card_issue', severity: 'MEDIUM' },
  { code: 'SERVER_ERROR', description: 'Payment gateway API error response', category: 'infrastructure', severity: 'HIGH' },
];
const PAYMENT_METHODS = ['card', 'upi', 'netbanking', 'wallet', 'emi'];
const BANKS = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank', 'Yes Bank', 'IDFC First Bank'];
const STRATEGIES_POOL = [
  ['RETRY_PAYMENT'],
  ['EMAIL_REMINDER', 'RETRY_PAYMENT'],
  ['SMS_OTP', 'EMAIL_REMINDER', 'RETRY_PAYMENT'],
  ['DOWNGRADE_PLAN', 'EMAIL_REMINDER'],
  ['PAYMENT_METHOD_CHANGE', 'EMAIL_REMINDER'],
  ['INVOICE_PAUSE', 'EMAIL_REMINDER']
];

export async function seedDatabase(merchantId: mongoose.Types.ObjectId, clearAll = true) {
  console.log(`🚀 Starting database seeding for merchant ${merchantId}...`);
  const rng = new SeededRandom(42); // Seed 42 for reproducible metrics

  if (clearAll) {
    console.log('🧹 Clearing existing data...');
    await Customer.deleteMany({ merchantId });
    await Transaction.deleteMany({ merchantId });
    await RecoveryCase.deleteMany({ merchantId });
    await AgentDecision.deleteMany({ merchantId });
    await AuditEvent.deleteMany({ merchantId });
    await RecoveryAction.deleteMany({ merchantId });
  }

  // 1. Create a pool of 200 customers
  console.log('👥 Generating 200 customers...');
  const customerDocs: any[] = [];
  for (let i = 0; i < 200; i++) {
    const firstName = rng.choose(FIRST_NAMES);
    const lastName = rng.choose(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${rng.nextInt(10, 99)}@gmail.com`;
    const phone = `+91-${rng.nextInt(7000000000, 9999999999)}`;
    customerDocs.push({
      merchantId,
      customerIdStr: `cust_${String(i + 1).padStart(3, '0')}`,
      name,
      email,
      phone,
      ltv: 0 // Will accumulate from transaction totals
    });
  }
  const customers = await Customer.insertMany(customerDocs);

  // 2. Generate 10,000 transactions over the last 30 days
  console.log('💳 Generating 10,000 transactions...');
  const transactionDocs: any[] = [];
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  // Track customer failed payment counts to tag isRecurringFailure and isRepeatedFailure
  const customerStatsMap = new Map<string, { totalFailed: number }>();

  for (let i = 0; i < 10000; i++) {
    const customer = rng.choose(customers);
    const method = rng.choose(PAYMENT_METHODS);
    const bank = rng.choose(BANKS);
    const amount = rng.nextInt(250, 85000); // 250 to 85,000 INR
    const txTime = rng.nextInt(thirtyDaysAgo, now);

    // Determine status: 72% captured (successful), 28% failed
    const isSuccess = rng.next() > 0.28;
    const status = isSuccess ? 'captured' : 'failed';
    const txIdStr = `pay_${Math.abs(Math.sin(i) * 100000000).toString(36).substring(0, 14)}`;
    const orderId = `order_${Math.abs(Math.cos(i) * 100000000).toString(36).substring(0, 14)}`;

    let errorCode, errorDescription, errorCategory, severity;
    let recoveryStatus: any = 'PENDING';
    let recoveryScore = 0;
    let riskLevel: any = 'LOW';
    let recoveredAt: Date | undefined;

    const stats = customerStatsMap.get(customer.id) || { totalFailed: 0 };

    if (!isSuccess) {
      stats.totalFailed += 1;
      customerStatsMap.set(customer.id, stats);

      const err = rng.choose(ERROR_DESCRIPTIONS);
      errorCode = err.code;
      errorDescription = err.description;
      errorCategory = err.category;
      severity = err.severity;

      // Classify recovery status distribution
      const roll = rng.next();
      if (roll < 0.10) {
        recoveryStatus = 'PENDING';
      } else if (roll < 0.30) {
        recoveryStatus = 'IN_PROGRESS';
      } else if (roll < 0.70) {
        recoveryStatus = 'RECOVERED';
        recoveredAt = new Date(txTime + rng.nextInt(600000, 172800000)); // recovered in 10m to 48h
      } else if (roll < 0.85) {
        recoveryStatus = 'FAILED';
      } else if (roll < 0.92) {
        recoveryStatus = 'ABANDONED';
      } else {
        recoveryStatus = 'OVERDUE';
      }

      recoveryScore = rng.nextInt(35, 95);
      riskLevel = recoveryScore > 75 ? 'HIGH' : recoveryScore > 55 ? 'MEDIUM' : 'LOW';
    }

    const isRecurringFailure = !isSuccess && stats.totalFailed > 1;
    const isRepeatedFailure = !isSuccess && rng.next() > 0.5; // repeated card attempts
    const isHighValue = amount >= 50000;

    transactionDocs.push({
      merchantId,
      customerId: customer._id,
      transactionIdStr: txIdStr,
      orderId,
      amount,
      currency: 'INR',
      status,
      errorCode,
      errorDescription,
      errorCategory,
      severity,
      paymentMethod: method,
      bank,
      retryCount: isSuccess ? 0 : rng.nextInt(0, 3),
      recoveryScore,
      riskLevel,
      recoveryStatus: isSuccess ? 'RECOVERED' : recoveryStatus,
      isRecurringFailure,
      isRepeatedFailure,
      isHighValue,
      recoveredAt: isSuccess ? new Date(txTime) : recoveredAt,
      createdAt: new Date(txTime),
      updatedAt: new Date(txTime)
    });
  }

  // Batch insert transactions in chunks of 2,000
  console.log('💾 Writing transactions to MongoDB...');
  const chunkSize = 2000;
  for (let i = 0; i < transactionDocs.length; i += chunkSize) {
    const chunk = transactionDocs.slice(i, i + chunkSize);
    await Transaction.insertMany(chunk);
    console.log(`   Written ${Math.min(i + chunkSize, transactionDocs.length)}/10,000...`);
  }

  // 3. Accumulate Customer LTVs and save
  console.log('📈 Calculating customer LTV values...');
  const allTx = await Transaction.find({ merchantId });
  const ltvMap = new Map<string, number>();
  allTx.forEach(tx => {
    if (tx.status === 'captured' || tx.recoveryStatus === 'RECOVERED') {
      const current = ltvMap.get(tx.customerId.toString()) || 0;
      ltvMap.set(tx.customerId.toString(), current + tx.amount);
    }
  });

  const updatePromises = customers.map(cust => {
    const ltv = ltvMap.get(cust._id.toString()) || 0;
    return Customer.findByIdAndUpdate(cust._id, { ltv });
  });
  await Promise.all(updatePromises);

  // 4. Create RecoveryCases, AgentDecisions, and AuditEvents for failed transactions
  const failedTx = allTx.filter(t => t.status === 'failed');
  console.log(`📂 Creating cases & decisions for ${failedTx.length} failed transactions...`);

  const caseDocs: any[] = [];
  const decisionDocs: any[] = [];
  const auditDocs: any[] = [];

  // Phase 6 Required Dataset Explicit Structuring (40+ Cases)
  // 10 Successful, 10 Failed, 10 Policy-Blocked, 10 Human Approval (5 Pending, 3 Approved, 2 Rejected)
  const explicitCategories: Array<{
    status: any;
    humanApprovalStatus?: any;
    humanApprovedBy?: string;
    stoppingReason?: string;
  }> = [];

  for (let i = 0; i < 10; i++) explicitCategories.push({ status: 'RECOVERED' });
  for (let i = 0; i < 10; i++) explicitCategories.push({ status: 'FAILED' });
  for (let i = 0; i < 10; i++) explicitCategories.push({ status: 'POLICY_BLOCKED', stoppingReason: 'Merchant policy prohibits retry beyond limit' });
  for (let i = 0; i < 5; i++) explicitCategories.push({ status: 'REQUIRES_APPROVAL', humanApprovalStatus: 'PENDING' });
  for (let i = 0; i < 3; i++) explicitCategories.push({ status: 'IN_PROGRESS', humanApprovalStatus: 'APPROVED', humanApprovedBy: 'Senior Finance Manager' });
  for (let i = 0; i < 2; i++) explicitCategories.push({ status: 'REJECTED', humanApprovalStatus: 'REJECTED', humanApprovedBy: 'Compliance Lead', stoppingReason: 'High risk fraud flag' });

  const seedCasesLimit = Math.min(failedTx.length, 1000); 
  for (let i = 0; i < seedCasesLimit; i++) {
    const tx = failedTx[i];
    const strategies = rng.choose(STRATEGIES_POOL);
    const cat = explicitCategories[i] || { status: tx.recoveryStatus };

    const score = tx.recoveryScore || 70;
    const prob = score / 100;
    const revenueAtRisk = Math.round(tx.amount * (score / 100));
    const expectedRecovery = Math.round(tx.amount * prob);
    const actualRecovery = cat.status === 'RECOVERED' ? tx.amount : 0;

    const recoveryCase = {
      merchantId,
      transactionId: tx._id,
      customerId: tx.customerId,
      recoveryScore: score,
      riskLevel: tx.riskLevel,
      status: cat.status,
      humanApprovalStatus: cat.humanApprovalStatus || 'NOT_REQUIRED',
      humanApprovedBy: cat.humanApprovedBy,
      humanApprovedAt: cat.humanApprovalStatus === 'APPROVED' ? new Date(tx.createdAt.getTime() + 3600000) : undefined,
      stoppingReason: cat.stoppingReason,
      currentStep: strategies[0],
      revenueAtRisk,
      expectedRecovery,
      actualRecovery,
      recommendedStrategies: strategies,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt
    };
    caseDocs.push(recoveryCase);
  }

  const savedCases = await RecoveryCase.insertMany(caseDocs);

  // Match cases to decisions and audits
  for (let i = 0; i < savedCases.length; i++) {
    const c = savedCases[i];
    const tx = failedTx[i];
    const strategies = c.recommendedStrategies;

    const decision = {
      merchantId,
      transactionId: tx._id,
      rootCauseAnalysis: {
        errorCode: tx.errorCode || 'UNKNOWN_ERROR',
        cause: tx.errorDescription || 'System payment error',
        confidence: rng.nextInt(65, 98)
      },
      recoveryProbability: {
        probability: tx.recoveryScore,
        classification: tx.riskLevel
      },
      prioritization: {
        score: tx.recoveryScore,
        rank: tx.riskLevel
      },
      recommendedStrategies: strategies,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt
    };
    decisionDocs.push(decision);

    // Create 10 sequential workflow audit timeline events for each case
    const txTime = tx.createdAt.getTime();
    auditDocs.push(
      { merchantId, transactionId: tx.transactionIdStr, customerId: tx.customerId, actionType: 'PAYMENT_FAILED', details: `Payment of ₹${tx.amount.toLocaleString('en-IN')} failed. Reason: ${tx.errorDescription}`, agentId: 'SystemWatcher-v6.0', timestamp: new Date(txTime) },
      { merchantId, transactionId: tx.transactionIdStr, customerId: tx.customerId, actionType: 'RISK_DETECTED', details: `Revenue Risk Agent assigned risk score ${tx.recoveryScore}/100 (${tx.riskLevel})`, agentId: 'DetectionAgent-v6.0', timestamp: new Date(txTime + 1000) },
      { merchantId, transactionId: tx.transactionIdStr, customerId: tx.customerId, actionType: 'ROOT_CAUSE_IDENTIFIED', details: `Root Cause Agent classified failure as '${tx.errorCategory}' (85% confidence)`, agentId: 'RootCauseAgent-v6.0', timestamp: new Date(txTime + 2000) },
      { merchantId, transactionId: tx.transactionIdStr, customerId: tx.customerId, actionType: 'PROBABILITY_CALCULATED', details: `ML Model computed recovery probability: ${tx.recoveryScore}%`, agentId: 'PredictionAgent-v6.0', timestamp: new Date(txTime + 3000) },
      { merchantId, transactionId: tx.transactionIdStr, customerId: tx.customerId, actionType: 'STRATEGY_SELECTED', details: `Strategy Agent selected primary action '${strategies[0]}'`, agentId: 'StrategyAgent-v6.0', timestamp: new Date(txTime + 4000) },
      { merchantId, transactionId: tx.transactionIdStr, customerId: tx.customerId, actionType: 'POLICY_APPROVED', details: `Policy Agent validated rules. Approved: ${c.status !== 'POLICY_BLOCKED'}`, agentId: 'PolicyAgent-v6.0', timestamp: new Date(txTime + 5000) }
    );

    if (c.humanApprovalStatus === 'PENDING') {
      auditDocs.push({ merchantId, transactionId: tx.transactionIdStr, customerId: tx.customerId, actionType: 'HUMAN_APPROVAL_REQUESTED', details: `High-value amount ₹${tx.amount.toLocaleString('en-IN')} requires Finance Manager approval.`, agentId: 'PolicyAgent-v6.0', timestamp: new Date(txTime + 6000) });
    } else if (c.humanApprovalStatus === 'APPROVED') {
      auditDocs.push({ merchantId, transactionId: tx.transactionIdStr, customerId: tx.customerId, actionType: 'HUMAN_APPROVED', details: `Approved by ${c.humanApprovedBy}. Action resumed.`, agentId: 'HumanManager-v6.0', timestamp: new Date(txTime + 3600000) });
    } else if (c.status === 'RECOVERED') {
      auditDocs.push(
        { merchantId, transactionId: tx.transactionIdStr, customerId: tx.customerId, actionType: 'ACTION_EXECUTED', details: `Execution Agent dispatched recovery link / retry for ₹${tx.amount.toLocaleString('en-IN')}`, agentId: 'ExecutionAgent-v6.0', timestamp: new Date(txTime + 7000) },
        { merchantId, transactionId: tx.transactionIdStr, customerId: tx.customerId, actionType: 'PAYMENT_CAPTURED', details: `Monitoring Agent verified payment capture of ₹${tx.amount.toLocaleString('en-IN')}. Workflow completed successfully!`, agentId: 'MonitoringAgent-v6.0', timestamp: new Date(txTime + 14400000) }
      );
    }
  }

  await AgentDecision.insertMany(decisionDocs);
  await AuditEvent.insertMany(auditDocs);

  console.log('✅ Seeding completed successfully with 40+ structured Phase 6 cases!');
}
