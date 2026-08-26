const { v4: uuidv4 } = require('uuid');

const CUSTOMERS = [
  { id: 'cust_001', name: 'Priya Sharma', email: 'priya@techcorp.in', phone: '+91-9876543210', ltv: 48500 },
  { id: 'cust_002', name: 'Rahul Verma', email: 'rahul@startup.io', phone: '+91-9123456789', ltv: 125000 },
  { id: 'cust_003', name: 'Anjali Singh', email: 'anjali@enterprise.com', phone: '+91-8765432109', ltv: 75000 },
  { id: 'cust_004', name: 'Vikram Nair', email: 'vikram@freelance.dev', phone: '+91-7654321098', ltv: 22000 },
  { id: 'cust_005', name: 'Meera Patel', email: 'meera@ecommerce.in', phone: '+91-6543210987', ltv: 95000 },
  { id: 'cust_006', name: 'Arjun Reddy', email: 'arjun@saas.co', phone: '+91-9988776655', ltv: 180000 },
  { id: 'cust_007', name: 'Kavya Nambiar', email: 'kavya@fintech.io', phone: '+91-8877665544', ltv: 56000 },
  { id: 'cust_008', name: 'Dev Malhotra', email: 'dev@agritech.in', phone: '+91-7766554433', ltv: 34000 },
];

const ERROR_CODES = [
  { code: 'BAD_REQUEST_ERROR', description: 'Insufficient funds in account', category: 'payment_failure', severity: 'HIGH' },
  { code: 'GATEWAY_ERROR', description: 'Bank gateway timeout', category: 'network', severity: 'MEDIUM' },
  { code: 'SERVER_ERROR', description: 'Payment processor down', category: 'infrastructure', severity: 'CRITICAL' },
  { code: 'BAD_REQUEST_ERROR', description: 'Card expired', category: 'card_issue', severity: 'HIGH' },
  { code: 'BAD_REQUEST_ERROR', description: 'Card blocked by issuer', category: 'card_issue', severity: 'HIGH' },
  { code: 'GATEWAY_ERROR', description: 'Network connectivity issue', category: 'network', severity: 'LOW' },
  { code: 'BAD_REQUEST_ERROR', description: 'Invalid card number', category: 'card_issue', severity: 'MEDIUM' },
  { code: 'SERVER_ERROR', description: 'Razorpay server error', category: 'infrastructure', severity: 'HIGH' },
];

const PAYMENT_METHODS = ['card', 'upi', 'netbanking', 'wallet', 'emi'];
const BANKS = ['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak', 'Yes Bank', 'IDFC'];

function generateTransaction(overrides = {}) {
  const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
  const error = ERROR_CODES[Math.floor(Math.random() * ERROR_CODES.length)];
  const amount = Math.floor(Math.random() * 50000) + 500;
  const now = Date.now();
  const createdAt = now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);
  const recoveryScore = Math.floor(Math.random() * 40) + 45; // 45-85

  return {
    id: `pay_${uuidv4().replace(/-/g, '').substring(0, 14)}`,
    orderId: `order_${uuidv4().replace(/-/g, '').substring(0, 14)}`,
    customer,
    amount,
    currency: 'INR',
    status: 'failed',
    errorCode: error.code,
    errorDescription: error.description,
    errorCategory: error.category,
    severity: error.severity,
    paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
    bank: BANKS[Math.floor(Math.random() * BANKS.length)],
    retryCount: Math.floor(Math.random() * 3),
    recoveryScore,
    riskLevel: recoveryScore > 70 ? 'HIGH' : recoveryScore > 55 ? 'MEDIUM' : 'LOW',
    recoveryStatus: 'PENDING',
    createdAt: new Date(createdAt).toISOString(),
    updatedAt: new Date(now).toISOString(),
    ...overrides,
  };
}

// Pre-generated mock transactions
const transactions = Array.from({ length: 40 }, () => generateTransaction());

// Some recovered ones
transactions.slice(0, 10).forEach(t => {
  t.recoveryStatus = 'RECOVERED';
  t.status = 'captured';
  t.recoveredAt = new Date(Date.now() - Math.floor(Math.random() * 2 * 24 * 60 * 60 * 1000)).toISOString();
});

// Some in progress
transactions.slice(10, 18).forEach(t => {
  t.recoveryStatus = 'IN_PROGRESS';
});

const recoveryActions = [
  { id: uuidv4(), type: 'RETRY_PAYMENT', label: 'Auto-retry payment', description: 'Retry the failed payment automatically after a backoff delay' },
  { id: uuidv4(), type: 'EMAIL_REMINDER', label: 'Email reminder', description: 'Send a personalized email reminder to the customer' },
  { id: uuidv4(), type: 'SMS_OTP', label: 'SMS with payment link', description: 'Send a secure payment link via SMS' },
  { id: uuidv4(), type: 'DOWNGRADE_PLAN', label: 'Offer plan downgrade', description: 'Suggest a lower-tier plan to retain the customer' },
  { id: uuidv4(), type: 'PAYMENT_METHOD_CHANGE', label: 'Switch payment method', description: 'Prompt customer to use an alternate payment method' },
  { id: uuidv4(), type: 'INVOICE_PAUSE', label: 'Pause & remind later', description: 'Pause invoice and send a follow-up after 3 days' },
];

const auditLogs = [];
for (let i = 0; i < 50; i++) {
  const t = transactions[Math.floor(Math.random() * transactions.length)];
  const action = recoveryActions[Math.floor(Math.random() * recoveryActions.length)];
  auditLogs.push({
    id: uuidv4(),
    transactionId: t.id,
    customerId: t.customer.id,
    customerName: t.customer.name,
    action: action.type,
    actionLabel: action.label,
    amount: t.amount,
    result: Math.random() > 0.3 ? 'SUCCESS' : 'FAILED',
    timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
    agentVersion: '1.4.2',
    policyApplied: Math.random() > 0.5 ? 'MAX_RETRY_3' : 'EMAIL_FIRST',
  });
}

module.exports = { transactions, recoveryActions, auditLogs, generateTransaction };
