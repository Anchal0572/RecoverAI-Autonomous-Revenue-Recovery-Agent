const API_BASE = '/api/v1';

function getHeaders(options: RequestInit = {}) {
  const token = localStorage.getItem('token');
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
