# RevPulse — Autonomous Revenue Engine
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/Build-Passing-emerald.svg)](https://github.com/Anchal0572/RevPulse-Autonomous-Revenue-Engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)

> **RevPulse** is an enterprise-grade autonomous fintech system that detects failed payment transactions, analyzes root causes, predicts recovery probabilities using machine learning, and executes policy-governed recovery actions without manual intervention.

---

## 📑 Table of Contents
1. [Problem Statement](#-problem-statement)
2. [Solution Overview](#-solution-overview)
3. [System Architecture](#-system-architecture)
4. [7-Agent AI Pipeline](#-7-agent-ai-pipeline)
5. [Machine Learning Engine](#-machine-learning-engine)
6. [Razorpay Integration & Webhooks](#-razorpay-integration--webhooks)
7. [Recovery Workflow & Stopping Rules](#-recovery-workflow--stopping-rules)
8. [Policies & Guardrails](#-policies--guardrails)
9. [Advanced Features (Phase 7 & 8)](#-advanced-features)
10. [Testing & Quality Assurance](#-testing--quality-assurance)
11. [3–5 Minute Judge Demo Script](#-judge-demo-script)
12. [Local Setup & Run Instructions](#-local-setup--run-instructions)
13. [Environment Variables](#-environment-variables)
14. [Known Limitations & Roadmap](#-known-limitations--roadmap)
15. [Author & Acknowledgments](#-author--acknowledgments)

---

## 🚨 Problem Statement

Online merchants lose **2% to 7% of gross revenue** annually to payment failures and checkout abandonment:
- **Dumb retries cause customer friction**: Retrying payments blindly triggers issuer fraud alerts and card blocks.
- **Manual intervention doesn't scale**: Finance teams cannot review thousands of failed transactions in real time.
- **Lack of root-cause intelligence**: Temporary network timeouts require immediate retries, while expired cards need new payment links and insufficient funds require delayed dunning schedules.
- **No policy guardrails**: Autonomous scripts risk over-messaging customers or executing unauthorized recovery actions on high-value transactions.

---

## 💡 Solution Overview

RecoverAI replaces manual dunning and static retry schedules with an **agentic AI pipeline** that:
1. **Detects & Quantifies Risk**: Instantly scores revenue at risk based on transaction amount, frequency, and customer LTV.
2. **Diagnoses Root Cause**: Classifies errors across 7 failure taxonomy categories with calibrated confidence scores.
3. **Predicts Recovery with ML**: A trained Random Forest model predicts real-time probability of recovery ($P_{\text{recover}} \in [0, 1]$).
4. **Selects Optimal Strategy**: Dynamically picks from 7 recovery actions (`RETRY`, `PAYMENT_LINK`, `REMINDER`, `ESCALATE`, `WAIT`, `STOP`, `PLAN_DOWNGRADE`).
5. **Enforces Merchant Guardrails**: Evaluates retry limits, cooldown intervals, and high-value thresholds before execution.
6. **Executes & Monitors**: Dispatches payment links via Razorpay API or automated smart retries, listens to webhooks, and halts upon successful capture.

---

## 🏛️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Razorpay Gateway /       │
                                  │     Webhook Event Source      │
                                  └──────────────┬────────────────┘
                                                 │ payment.failed / captured
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 RecoverAI Backend (Node.js/TS)                             │
│                                                                                             │
│  ┌────────────────────┐    ┌──────────────────────────────────────────────────────────────┐ │
│  │   Auth & Security  │    │                7-Agent Orchestrator Pipeline                 │ │
│  │  • JWT Auth        │    │                                                              │ │
│  │  • Rate Limiting   │    │  [1. DetectionAgent]    ──► Scores Risk & Revenue at Risk    │ │
│  │  • Helmet Headers  │    │  [2. RootCauseAgent]    ──► Classifies Failure Taxonomy      │ │
│  │  • Webhook HMAC    │    │  [3. MLPrediction]      ──► Calls Python ML Service (0.86)   │ │
│  └────────────────────┘    │  [4. StrategyAgent]     ──► Selects Optimal Recovery Action  │ │
│                            │  [5. PolicyAgent]       ──► Enforces Merchant Guardrails     │ │
│  ┌────────────────────┐    │  [6. ExecutionAgent]    ──► Dispatches Razorpay/Payment Link │ │
│  │  Database Layer    │    │  [7. MonitoringAgent]   ──► Observes Outcome & Stopping Rules│ │
│  │  • MongoDB Mongoose│    │  [8. EvaluationAgent]   ──► Computes Recovery ROI & Metrics  │ │
│  │  • Compound Indexes│    └──────────────────────────────────────────────────────────────┘ │
│  │  • In-Memory Server│                                                                     │
│  └────────────────────┘                                                                     │
└────────────────────────────────────────┬────────────────────────────┬───────────────────────┘
                                         │                            │
                                         ▼                            ▼
                      ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
                      │    FastAPI ML Prediction Engine │   │   React 18 / Vite Frontend      │
                      │  • RandomForestClassifier       │   │  • AI Command Center            │
                      │  • ROC-AUC: 0.86, 10 Features   │   │  • Risk & Model Analytics       │
                      │  • Port 8000 (Fast inference)   │   │  • Strategy Simulator & What-If │
                      └─────────────────────────────────┘   │  • RAG Knowledge System         │
                                                            │  • Human Approval Queue         │
                                                            └─────────────────────────────────┘
```

---

## 🤖 7-Agent AI Pipeline

| Agent | Responsibility | Core Output / Decision Metric |
|---|---|---|
| **1. Revenue Detection Agent** | Evaluates failed transactions in <10ms and assigns risk scores | `riskScore` (0-100), `revenueAtRisk` (₹), `riskLevel` (`LOW`/`MEDIUM`/`HIGH`) |
| **2. Root Cause Agent** | Classifies failure taxonomy from gateway error codes and history | `cause` (e.g., `insufficient_funds`, `card_expired`, `gateway_timeout`), `confidence` |
| **3. ML Prediction Service** | Computes recovery likelihood using 10 engineered features | `recovery_probability` (0.00 to 1.00), `expected_recovery` (₹) |
| **4. Strategy Agent** | Selects optimal intervention based on cause, probability, and risk | Action: `RETRY`, `PAYMENT_LINK`, `REMINDER`, `ESCALATE`, `WAIT`, `STOP` |
| **5. Policy Agent** | Validates action against merchant guardrails and triggers human approval | `approved: boolean`, `requiresHumanApproval: boolean` |
| **6. Execution Agent** | Executes recovery action via Razorpay API or payment link dispatcher | `success: boolean`, `payUrl`, `transactionId`, duration in ms |
| **7. Monitoring Agent** | Tracks outcome, updates case lifecycle, and halts workflow upon capture | `caseStatus` (`RECOVERED`, `IN_PROGRESS`, `STOPPED`, `ABANDONED`) |
| **8. Evaluation Agent** | Computes ROI, recovery efficiency, and empirical strategy benchmark | `recoveryRate`, `totalRecovered`, `agentEfficiency` |

---

## 🧠 Machine Learning Engine

- **Model**: `RandomForestClassifier` (Scikit-Learn) with calibrated probability outputs.
- **Accuracy Metric**: ROC-AUC **0.86**, Precision **0.84**, Recall **0.81**.
- **Engineered Feature Vector (10 Features)**:
  1. `amount` — Transaction amount in INR.
  2. `ltv` — Customer lifetime value.
  3. `failures_count` — Historical failed payments for customer.
  4. `successes_count` — Historical successful payments.
  5. `recovered_count` — Previous recoveries.
  6. `hours_since_last_failure` — Recency of failure.
  7. `success_rate` — Historical success fraction.
  8. `recovery_fraction` — Recovery ratio.
  9. `payment_method_encoded` — Card (0), UPI (1), Netbanking (2), Wallet (3), EMI (4).
  10. `is_high_value` — Boolean flag for amounts $\ge$ ₹50,000.
- **Fail-Safe Heuristic**: If the Python service is offline, the backend orchestrator transparently executes a calibrated heuristic algorithm without interrupting recovery.

---

## 💳 Razorpay Integration & Webhooks

- **Dual-Mode Adapter Pattern**:
  - `RazorpayAdapter`: Real test-mode API integration using `rzp_test_` keys.
  - `RazorpayMockAdapter`: Fully functional simulation adapter used when offline or in sandbox mode.
- **HMAC-SHA256 Signature Verification**: All incoming webhooks (`payment.failed`, `payment.captured`, `payment.authorized`) are cryptographically verified against `RAZORPAY_WEBHOOK_SECRET`.
- **Idempotency**: Webhook events are tracked in `WebhookEvent` collection to guarantee at-most-once processing.

---

## 🛑 Recovery Workflow & Stopping Rules

To prevent runaway loops, customer fatigue, and unnecessary fees, the recovery engine strictly evaluates **5 Stopping Rules**:
1. **Captured Rule**: If payment is already captured, stop immediately and mark `RECOVERED`.
2. **Rejection Rule**: If a human manager rejects the approval request, stop immediately and mark `REJECTED`.
3. **Policy Block Rule**: If merchant guardrails prohibit the action, mark `POLICY_BLOCKED`.
4. **Retry Limit Rule**: If retry count $\ge$ `maxRetries` (default: 3), mark `STOPPED`.
5. **Window Rule**: If elapsed time $>$ `recoveryWindowHours` (default: 168h / 7 days), mark `OVERDUE`.

---

## 🛡️ Policies & Guardrails

Merchants customize their recovery guardrails directly in the UI:
- **Maximum Retry Limit**: 1 to 5 attempts per case.
- **Retry Cooldown**: Minimum hours between consecutive attempts (default: 24h).
- **High-Value Approval Threshold**: Transactions $\ge$ ₹50,000 automatically route to the **Decision Center** for Finance Manager sign-off.
- **Agent Autonomy Modes**:
  - `AUTONOMOUS`: Full autonomous execution for allowed actions.
  - `SUPERVISED`: Automatic below threshold; human sign-off above threshold.
  - `MANUAL`: Every action requires explicit human confirmation.

---

## 🚀 Advanced Features

### 1. Revenue Leakage Detection (Feature 1)
Identifies anomalies: success rate drops (>15%), failure spikes (>2x baseline), abandonment surges, recovery deterioration, and high-value failure clusters.

### 2. Strategy Simulator & What-If Engine (Feature 2)
Interactive slider simulation allowing merchants to project expected revenue, ROI, and recovery rates before adjusting live policies.

### 3. Strategy Comparison Benchmark (Feature 3)
Side-by-side empirical performance comparison across recovery strategies (`RETRY`, `PAYMENT_LINK`, `REMINDER`, `ESCALATE`) with sample-size confidence warnings.

### 4. Customer Segmentation (Feature 4)
Dynamic segmentation into **High Value**, **Likely to Recover**, **At Risk**, **Low Probability**, and **Needs Human Review** cohorts.

### 5. RAG Knowledge Base (Feature 5)
In-memory retrieval-augmented knowledge system indexing merchant policies, step-by-step recovery playbooks, escalation matrices, and FAQs.

### 6. AI Command Center (Feature 6)
Real-time operations center showing agent health, live case throughput, policy blocks, and instant AI decision feeds.

### 7. Hinglish Multilingual Intent Detection (Feature 7)
Classifies customer responses in English, Hindi, and Hinglish (e.g., *"Payment abhi nahi, baad mein karunga"* $\rightarrow$ `PAY_LATER`).

---

## 🧪 Testing & Quality Assurance

### Automated Test Results (100% Passing)
```bash
# Backend Test Suite (Jest)
PASS src/tests/auth.test.ts (3 tests)
PASS src/tests/razorpay.test.ts (7 tests)
PASS src/tests/phase7.test.ts (35 tests)
PASS src/tests/workflow.test.ts (7 tests)
PASS src/tests/agents.test.ts (18 tests)
PASS src/tests/phase8_hardening.test.ts (17 tests)

Test Suites: 6 passed, 6 total
Tests:       87 passed, 87 total

# ML Service Test Suite (Pytest)
tests/test_ml.py ...... (6 passed)
```

---

## 🎬 3–5 Minute Judge Demo Script

1. **The Hook (0:00 - 0:45)**:
   - *"Merchants lose 5% of their revenue to failed transactions. Today, dunning is either manual or dumb. RecoverAI makes revenue recovery intelligent and autonomous."*
2. **Dashboard Overview (0:45 - 1:30)**:
   - Open `http://localhost:5173/dashboard`.
   - Show dynamic calculation: **10,000 Transactions Analyzed**, **Revenue at Risk (₹7.18 Cr)**, **Actually Recovered (₹4.60 Cr)**, **39% Recovery Rate**.
3. **AI Command Center & Leakage Detection (1:30 - 2:15)**:
   - Navigate to `/command-center` and `/leakage-detection`.
   - Show real-time agent statuses and click **"Run Detection Scan"** to show anomaly detection in action.
4. **The 7-Agent Recovery Pipeline in Action (2:15 - 3:30)**:
   - Navigate to `/agent-control`.
   - Select a failed transaction and click **"Run Pipeline"**.
   - Walk through the execution trace: `DetectionAgent` $\rightarrow$ `RootCauseAgent` $\rightarrow$ `MLPredictionService` (FastAPI) $\rightarrow$ `StrategyAgent` $\rightarrow$ `PolicyAgent` $\rightarrow$ `ExecutionAgent` $\rightarrow$ `MonitoringAgent` in **<200ms**.
5. **Human-in-the-Loop & Audit Trail (3:30 - 4:30)**:
   - Show `/decision-center` for high-value manager approval.
   - Open `/audit` to demonstrate the immutable compliance timeline.
   - Demonstrate the **What-If Simulator** (`/simulator`) and **RAG Knowledge Base** (`/knowledge-base`).

---

## 🏃 Local Setup & Run Instructions

### Prerequisites
- **Node.js**: v18+ or v20+
- **Python**: 3.10+ (for ML service)
- **Git**

### Step 1: Clone Repository
```bash
git clone https://github.com/Anchal0572/RecoverAI-Autonomous-Revenue-Recovery-Agent.git
cd RecoverAI-Autonomous-Revenue-Recovery-Agent
```

### Step 2: Start Backend Server
```bash
cd server
npm install
npm run dev
# Running on http://localhost:3001
```

### Step 3: Start Python ML Service
```bash
cd ../ml-service
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
pip install -r requirements.txt
python run.py
# Running on http://127.0.0.1:8000
```

### Step 4: Start Frontend
```bash
cd ../frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 🔑 Environment Variables

### Backend (`server/.env`)
```env
PORT=3001
MONGO_URI=mongodb://127.0.0.1:27017/recoverai
JWT_SECRET=super_secret_recoverai_key_2026
JWT_EXPIRES_IN=24h
NODE_ENV=development
RAZORPAY_KEY_ID=rzp_test_MOCK99887766
RAZORPAY_KEY_SECRET=mock_secret_key_12345
RAZORPAY_WEBHOOK_SECRET=webhook_secret_key_12345
```

---

## 🔮 Known Limitations & Roadmap

1. **Vector Database Integration**: Currently, RAG Knowledge Base uses fast in-memory keyword/tag scoring. Future release will integrate Pinecone/Weaviate for dense embedding search.
2. **Multi-Gateway Routing**: Currently integrated with Razorpay; future roadmap includes Stripe, Adyen, and Cashfree smart-routing.
3. **Continuous Model Retraining**: Auto-triggering Random Forest retraining pipelines from verified `AuditEvent` capture outcomes.

---

## 👩‍💻 Author & Acknowledgments

- **Lead Developer**: Anchal Keshri
- **Project**: RecoverAI — Autonomous Revenue Recovery Agent
- Built with ❤️ for the Hackathon.
