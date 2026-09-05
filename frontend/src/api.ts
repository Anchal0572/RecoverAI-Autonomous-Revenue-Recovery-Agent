const API_BASE = '/api/v1';

const DEFAULT_DEMO_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOWJkZjIyOGM5NTliYWEyZjViOGYxNiIsImVtYWlsIjoiYWRtaW5AY29tcGFueS5jb20iLCJyb2xlIjoiQWRtaW4iLCJtZXJjaGFudElkIjoiNmE5YmRmMjI4Yzk1OWJhYTJmNWI4ZjEyIiwiaWF0IjoxNzg4NjAwMDk4LCJleHAiOjE3ODg2ODY0OTh9.sPj1y29Wv5m-BNNtRdjSQ7U8oZALKehb0jHbOc8b2PQ';

function getHeaders(options: RequestInit = {}) {
  const token = localStorage.getItem('token') || DEFAULT_DEMO_TOKEN;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchTransactions(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/transactions${qs ? '?' + qs : ''}`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function fetchTransaction(id: string) {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function simulateTransaction(data = {}) {
  const res = await fetch(`${API_BASE}/transactions/simulate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function triggerRecovery(id: string) {
  const res = await fetch(`${API_BASE}/transactions/${id}/recover`, {
    method: 'PATCH',
    headers: getHeaders()
  });
  return res.json();
}

export async function fetchAnalyticsSummary() {
  const res = await fetch(`${API_BASE}/dashboard/summary`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function fetchAuditLogs(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/audit-events${qs ? '?' + qs : ''}`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function analyzeTransaction(txId: string) {
  const res = await fetch(`${API_BASE}/agent/analyze/${txId}`, { 
    method: 'POST',
    headers: getHeaders()
  });
  return res.json();
}

export async function executeRecoveryAction(txId: string, action: string) {
  const res = await fetch(`${API_BASE}/agent/execute/${txId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action }),
  });
  return res.json();
}

export async function fetchMonitoringStatus() {
  const res = await fetch(`${API_BASE}/monitoring/status`, {
    headers: getHeaders()
  });
  return res.json();
}

// Auth operations
export async function loginUser(data = {}) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function registerUser(data = {}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchCurrentUser() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getHeaders()
  });
  return res.json();
}

// Policies
export async function fetchPolicies() {
  const res = await fetch(`${API_BASE}/policies`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function updatePolicies(data = {}) {
  const res = await fetch(`${API_BASE}/policies`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

// Database Seeder
export async function seedDemoDatabase() {
  const res = await fetch(`${API_BASE}/seed`, {
    method: 'POST',
    headers: getHeaders()
  });
  return res.json();
}

// ML Model Performance
export async function fetchModelInfo() {
  const res = await fetch(`${API_BASE}/analytics/model-info`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function fetchModelEvaluation() {
  const res = await fetch(`${API_BASE}/analytics/evaluation`, {
    headers: getHeaders()
  });
  return res.json();
}

// ── Agent Pipeline (Phase 4) ──

export async function runAgentPipeline(transactionId: string) {
  const res = await fetch(`${API_BASE}/agent/run/${transactionId}`, {
    method: 'POST',
    headers: getHeaders()
  });
  return res.json();
}

export async function fetchAgentRuns() {
  const res = await fetch(`${API_BASE}/agent/runs`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function fetchAgentRunById(runId: string) {
  const res = await fetch(`${API_BASE}/agent/runs/${runId}`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function fetchAgentStatus() {
  const res = await fetch(`${API_BASE}/agent/status`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function testIndividualAgent(agentName: string, payload = {}) {
  const res = await fetch(`${API_BASE}/agent/test/${agentName}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return res.json();
}

// ── Razorpay Webhook & Integration (Phase 5) ──

export async function fetchWebhookStatus() {
  const res = await fetch(`${API_BASE}/webhooks/status`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function triggerTestWebhook(payload = {}) {
  const res = await fetch(`${API_BASE}/webhooks/trigger-test`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return res.json();
}

// ── Phase 6 Workflow & Human Approval APIs ──

export async function fetchApprovalQueue() {
  const res = await fetch(`${API_BASE}/recovery-cases/approval-queue`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function approveCase(caseId: string, managerName = 'Finance Manager') {
  const res = await fetch(`${API_BASE}/recovery-cases/${caseId}/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ managerName })
  });
  return res.json();
}

export async function rejectCase(caseId: string, managerName = 'Finance Manager', reason = 'Manager rejected action') {
  const res = await fetch(`${API_BASE}/recovery-cases/${caseId}/reject`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ managerName, reason })
  });
  return res.json();
}

export async function fetchRevenueMetrics() {
  const res = await fetch(`${API_BASE}/analytics/revenue-metrics`, {
    headers: getHeaders()
  });
  return res.json();
}

// ── Phase 7 — Advanced Hackathon Feature APIs ──

// Leakage Detection
export async function fetchLeakageAlerts() {
  const res = await fetch(`${API_BASE}/leakage/alerts`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function runLeakageDetection() {
  const res = await fetch(`${API_BASE}/leakage/detect`, {
    method: 'POST',
    headers: getHeaders()
  });
  return res.json();
}

// What-If Simulator
export async function runWhatIfSimulation(params: {
  recoveryProbability?: number;
  retrySuccessRate?: number;
  recoveryWindowDays?: number;
  retryLimit?: number;
  strategy?: string;
}) {
  const res = await fetch(`${API_BASE}/simulator/what-if`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params)
  });
  return res.json();
}

// Strategy Comparison
export async function compareStrategies(strategies: string[]) {
  const res = await fetch(`${API_BASE}/simulator/compare-strategies`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ strategies })
  });
  return res.json();
}

// Customer Segmentation
export async function fetchCustomerSegments() {
  const res = await fetch(`${API_BASE}/segmentation/segments`, {
    headers: getHeaders()
  });
  return res.json();
}

// RAG Knowledge Base
export async function queryKnowledgeBase(query: string, category?: string) {
  const res = await fetch(`${API_BASE}/rag/query`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ query, category })
  });
  return res.json();
}

export async function fetchKnowledgeDocuments(category?: string) {
  const qs = category ? `?category=${category}` : '';
  const res = await fetch(`${API_BASE}/rag/documents${qs}`, {
    headers: getHeaders()
  });
  return res.json();
}

// Command Center
export async function fetchCommandCenterData() {
  const res = await fetch(`${API_BASE}/command-center`, {
    headers: getHeaders()
  });
  return res.json();
}

// Hinglish Intent Detection
export async function detectIntent(message: string) {
  const res = await fetch(`${API_BASE}/intent/detect`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message })
  });
  return res.json();
}

// Phase 10 — Local Demo & Payment Recovery
export async function fetchPaymentConfig() {
  const res = await fetch(`${API_BASE}/config/config`);
  return res.json();
}

export async function fetchRecoveryCase(id: string) {
  const res = await fetch(`${API_BASE}/recovery-cases/${id}`, {
    headers: getHeaders()
  });
  return res.json();
}

export async function createDemoFailedPayment(data = {}) {
  const res = await fetch(`${API_BASE}/demo/create-failed-payment`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function runDemoRecoveryAI(transactionId: string) {
  const res = await fetch(`${API_BASE}/demo/run-recovery-ai/${transactionId}`, {
    method: 'POST',
    headers: getHeaders()
  });
  return res.json();
}

export async function executeDemoRecoveryAction(recoveryCaseId: string) {
  const res = await fetch(`${API_BASE}/demo/execute-recovery/${recoveryCaseId}`, {
    method: 'POST',
    headers: getHeaders()
  });
  return res.json();
}

export async function simulateDemoPaymentSuccess(recoveryCaseId: string) {
  const res = await fetch(`${API_BASE}/demo/simulate-payment-success/${recoveryCaseId}`, {
    method: 'POST',
    headers: getHeaders()
  });
  return res.json();
}

export async function simulateDemoPaymentFailure(recoveryCaseId: string) {
  const res = await fetch(`${API_BASE}/demo/simulate-payment-failure/${recoveryCaseId}`, {
    method: 'POST',
    headers: getHeaders()
  });
  return res.json();
}

export async function runFullRecoveryDemo(data = {}) {
  const res = await fetch(`${API_BASE}/demo/run-full-scenario`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function resetDemoState() {
  const res = await fetch(`${API_BASE}/demo/reset`, {
    method: 'POST',
    headers: getHeaders()
  });
  return res.json();
}


