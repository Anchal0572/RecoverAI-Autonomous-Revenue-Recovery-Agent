/**
 * RAGKnowledgeService — Phase 7 Retrieval-Augmented Generation Knowledge System
 * In-memory knowledge base for merchant policies, recovery playbooks,
 * escalation rules, and FAQs. Supports keyword-based retrieval.
 *
 * No external vector DB dependency — fully self-contained for hackathon.
 */

export interface KnowledgeDocument {
  id: string;
  category: 'policies' | 'playbooks' | 'escalation' | 'faqs';
  title: string;
  content: string;
  tags: string[];
  priority: number; // 1 = highest
}

export interface RAGQueryResult {
  query: string;
  results: {
    document: KnowledgeDocument;
    relevanceScore: number;
  }[];
  context: string; // Merged context string for LLM consumption
  totalMatches: number;
}

export class RAGKnowledgeService {
  private documents: KnowledgeDocument[] = [];

  constructor() {
    this.loadKnowledgeBase();
  }

  /**
   * Query the knowledge base
   */
  query(question: string, category?: string, limit: number = 5): RAGQueryResult {
    const queryTerms = this.tokenize(question);

    let candidates = this.documents;
    if (category && ['policies', 'playbooks', 'escalation', 'faqs'].includes(category)) {
      candidates = candidates.filter(d => d.category === category);
    }

    const scored = candidates.map(doc => {
      const score = this.calculateRelevance(queryTerms, doc);
      return { document: doc, relevanceScore: score };
    });

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const results = scored.filter(s => s.relevanceScore > 0).slice(0, limit);

    const context = results
      .map(r => `[${r.document.category.toUpperCase()}] ${r.document.title}:\n${r.document.content}`)
      .join('\n\n---\n\n');

    return {
      query: question,
      results,
      context,
      totalMatches: results.length
    };
  }

  /**
   * List documents by category
   */
  getDocuments(category?: string): KnowledgeDocument[] {
    if (category) {
      return this.documents.filter(d => d.category === category);
    }
    return this.documents;
  }

  /**
   * Get all categories with counts
   */
  getCategories(): { category: string; count: number; description: string }[] {
    const categories = [
      { category: 'policies', description: 'Merchant recovery policies and compliance rules' },
      { category: 'playbooks', description: 'Step-by-step recovery action playbooks' },
      { category: 'escalation', description: 'Escalation rules and approval workflows' },
      { category: 'faqs', description: 'Frequently asked questions and answers' }
    ];
    return categories.map(c => ({
      ...c,
      count: this.documents.filter(d => d.category === c.category).length
    }));
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2 && !STOP_WORDS.has(t));
  }

  private calculateRelevance(queryTerms: string[], doc: KnowledgeDocument): number {
    const docText = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();
    const docTokens = new Set(this.tokenize(docText));

    let matchCount = 0;
    let tagBonus = 0;
    let titleBonus = 0;

    for (const term of queryTerms) {
      if (docTokens.has(term)) matchCount++;
      if (doc.tags.some(t => t.toLowerCase().includes(term))) tagBonus += 0.3;
      if (doc.title.toLowerCase().includes(term)) titleBonus += 0.5;
    }

    if (matchCount === 0) return 0;

    const termCoverage = queryTerms.length > 0 ? matchCount / queryTerms.length : 0;
    const priorityBonus = (5 - doc.priority) * 0.05;

    return Math.min(1, termCoverage + tagBonus + titleBonus + priorityBonus);
  }

  /**
   * Pre-load realistic fintech recovery knowledge
   */
  private loadKnowledgeBase() {
    this.documents = [
      // ═════════════════════════════════════
      // POLICIES
      // ═════════════════════════════════════
      {
        id: 'pol_001',
        category: 'policies',
        title: 'Maximum Retry Policy',
        content: 'Failed payments may be retried up to 3 times within a 7-day recovery window. Each retry must respect the cooldown period (minimum 4 hours between attempts). After 3 retries, the case must be escalated or abandoned. Retry attempts must not exceed the merchant-configured maxRetries value.',
        tags: ['retry', 'limit', 'cooldown', 'max-retries', 'recovery-window'],
        priority: 1
      },
      {
        id: 'pol_002',
        category: 'policies',
        title: 'High-Value Transaction Approval Policy',
        content: 'Transactions exceeding the high-value threshold (default ₹50,000) require human manager approval before any recovery action can be executed. The Finance Manager must review and approve/reject the proposed action within 48 hours. If no action is taken within 48 hours, the case is automatically escalated to the next level.',
        tags: ['high-value', 'approval', 'human-review', 'threshold', 'finance-manager'],
        priority: 1
      },
      {
        id: 'pol_003',
        category: 'policies',
        title: 'Customer Communication Limits',
        content: 'Recovery communications are limited to: maximum 3 emails per day per customer, maximum 2 SMS messages per day per customer. No communications are sent between 9 PM and 9 AM IST. Customers who have opted out of communications must not receive any recovery messages. All communications must include an unsubscribe option.',
        tags: ['email', 'sms', 'communication', 'limit', 'opt-out', 'customer'],
        priority: 2
      },
      {
        id: 'pol_004',
        category: 'policies',
        title: 'Recovery Window Policy',
        content: 'All recovery attempts must be completed within 7 days (168 hours) of the original payment failure. After this window, the case is marked as OVERDUE and no further automated recovery actions are permitted. Manual intervention may still be initiated by the finance team.',
        tags: ['recovery-window', 'time-limit', 'overdue', '7-days', '168-hours'],
        priority: 1
      },
      {
        id: 'pol_005',
        category: 'policies',
        title: 'Agent Mode Configuration',
        content: 'Three agent modes are available: AUTONOMOUS mode allows the agent to execute recovery actions automatically. SUPERVISED mode requires human approval for all actions above ₹10,000. MANUAL mode requires human approval for every action regardless of amount. The mode can be changed at any time in the Policies & Guardrails settings.',
        tags: ['agent-mode', 'autonomous', 'supervised', 'manual', 'configuration'],
        priority: 2
      },
      {
        id: 'pol_006',
        category: 'policies',
        title: 'Refund and Reversal Policy',
        content: 'Refunds are processed within 5-7 business days. Partial refunds are supported for subscription-based payments. Reversed transactions must be audited and logged. No automatic refunds for amounts exceeding ₹1,00,000 without CFO approval.',
        tags: ['refund', 'reversal', 'partial-refund', 'subscription', 'audit'],
        priority: 2
      },

      // ═════════════════════════════════════
      // PLAYBOOKS
      // ═════════════════════════════════════
      {
        id: 'pb_001',
        category: 'playbooks',
        title: 'Card Payment Failure Recovery Playbook',
        content: 'Step 1: Detect failure and classify root cause (card expired, insufficient funds, bank decline). Step 2: If card expired, send payment link with alternate payment methods. Step 3: If insufficient funds, wait 24 hours and retry. Step 4: If bank decline, send email notification with support contact. Step 5: If retry fails, escalate to payment support team. Each step must log an audit event.',
        tags: ['card', 'payment-failure', 'retry', 'payment-link', 'escalation'],
        priority: 1
      },
      {
        id: 'pb_002',
        category: 'playbooks',
        title: 'UPI Payment Failure Recovery Playbook',
        content: 'Step 1: Identify UPI-specific error (VPA invalid, timeout, bank server down). Step 2: For timeouts, auto-retry after 30 minutes. Step 3: For VPA issues, send payment link with alternate VPA entry. Step 4: For bank server issues, wait 2-4 hours and retry. Step 5: If 2 retries fail, send payment link via SMS and email simultaneously.',
        tags: ['upi', 'vpa', 'timeout', 'bank-server', 'payment-link'],
        priority: 1
      },
      {
        id: 'pb_003',
        category: 'playbooks',
        title: 'Subscription Renewal Failure Playbook',
        content: 'Step 1: Detect recurring payment failure. Step 2: Send pre-dunning notification 3 days before next retry. Step 3: Retry payment on day of renewal. Step 4: If retry fails, send payment update link. Step 5: Allow 7-day grace period before service suspension. Step 6: Send final warning 24 hours before suspension. Step 7: Suspend service and send reactivation link.',
        tags: ['subscription', 'renewal', 'dunning', 'grace-period', 'suspension'],
        priority: 1
      },
      {
        id: 'pb_004',
        category: 'playbooks',
        title: 'High-Value Transaction Recovery Playbook',
        content: 'Step 1: Flag transaction for human review (>₹50,000). Step 2: Finance Manager reviews root cause analysis. Step 3: If approved, execute recommended strategy with priority processing. Step 4: Send personalized communication to customer. Step 5: Monitor for 48 hours. Step 6: If not recovered, assign to dedicated recovery specialist.',
        tags: ['high-value', 'human-review', 'finance-manager', 'priority', 'specialist'],
        priority: 1
      },
      {
        id: 'pb_005',
        category: 'playbooks',
        title: 'Checkout Abandonment Recovery Playbook',
        content: 'Step 1: Detect cart/checkout abandonment event. Step 2: Wait 1 hour before first contact. Step 3: Send abandonment recovery email with cart summary. Step 4: If no action in 24 hours, send SMS reminder. Step 5: If no action in 48 hours, send final email with incentive (if enabled). Step 6: Close case after 72 hours if no response.',
        tags: ['checkout', 'abandonment', 'cart', 'email', 'sms', 'incentive'],
        priority: 2
      },

      // ═════════════════════════════════════
      // ESCALATION RULES
      // ═════════════════════════════════════
      {
        id: 'esc_001',
        category: 'escalation',
        title: 'Retry Limit Exceeded Escalation',
        content: 'When a recovery case reaches the maximum retry limit, the case must be escalated to the payment operations team. The escalation notification includes: transaction details, root cause analysis, all previous actions taken, and customer communication history. The ops team has 24 hours to take manual action.',
        tags: ['retry-limit', 'escalation', 'ops-team', 'manual-action'],
        priority: 1
      },
      {
        id: 'esc_002',
        category: 'escalation',
        title: 'High-Value Escalation Workflow',
        content: 'Transactions above the high-value threshold follow this escalation chain: Level 1 — Payment Operations (0-4 hours). Level 2 — Finance Manager (4-24 hours). Level 3 — CFO/VP Finance (24-48 hours). Each escalation level receives a detailed brief including risk score, recovery probability, and recommended action. Auto-escalation occurs if no response within the time window.',
        tags: ['high-value', 'escalation-chain', 'finance-manager', 'cfo', 'auto-escalation'],
        priority: 1
      },
      {
        id: 'esc_003',
        category: 'escalation',
        title: 'Policy Block Escalation',
        content: 'When a recovery action is blocked by merchant policy, the case is flagged for review. The policy team receives notification with: the proposed action, the blocking rule, and the potential revenue impact. If the policy team determines the block is incorrect, they can override it with an audit trail. Policy overrides require Level 2 (Finance Manager) approval.',
        tags: ['policy-block', 'override', 'review', 'audit-trail', 'approval'],
        priority: 2
      },
      {
        id: 'esc_004',
        category: 'escalation',
        title: 'Customer Complaint Escalation',
        content: 'If a customer complains about recovery communications, immediately pause all automated actions for that customer. Flag the case for human review. The support team must respond within 4 hours. All future recovery actions for that customer require explicit approval. Log the complaint in the audit trail.',
        tags: ['complaint', 'pause', 'human-review', 'support-team', 'communications'],
        priority: 1
      },

      // ═════════════════════════════════════
      // FAQs
      // ═════════════════════════════════════
      {
        id: 'faq_001',
        category: 'faqs',
        title: 'What happens when a payment fails?',
        content: 'When a payment fails, RecoverAI automatically: 1) Detects the failure and assesses risk (Detection Agent). 2) Identifies the root cause (Root Cause Agent). 3) Predicts recovery probability (ML Prediction). 4) Selects the optimal recovery strategy (Strategy Agent). 5) Validates against merchant policies (Policy Agent). 6) Executes the approved action (Execution Agent). 7) Monitors the outcome (Monitoring Agent). This entire pipeline runs in under 500ms.',
        tags: ['payment-failure', 'pipeline', 'agents', 'recovery', 'detection'],
        priority: 1
      },
      {
        id: 'faq_002',
        category: 'faqs',
        title: 'How is recovery probability calculated?',
        content: 'Recovery probability is calculated using a Random Forest ML model trained on historical transaction data. Features include: transaction amount, customer lifetime value (LTV), number of past failures, number of past successes, time since failure, and payment method. The model outputs a probability between 0 and 1. When the ML service is unavailable, a heuristic fallback is used based on observable transaction factors.',
        tags: ['recovery-probability', 'ml-model', 'random-forest', 'prediction', 'features'],
        priority: 1
      },
      {
        id: 'faq_003',
        category: 'faqs',
        title: 'What recovery strategies are available?',
        content: 'RecoverAI supports 7 recovery strategies: RETRY (re-attempt the payment), PAYMENT_LINK (send a new payment link), REMINDER (send email/SMS reminder), ESCALATE (escalate to human team), WAIT (delay action for better timing), STOP (cease recovery attempts), PLAN_DOWNGRADE (offer a lower-tier plan for subscription failures). The Strategy Agent selects the best action based on root cause, recovery probability, and merchant policies.',
        tags: ['strategy', 'retry', 'payment-link', 'reminder', 'escalate', 'wait', 'stop'],
        priority: 1
      },
      {
        id: 'faq_004',
        category: 'faqs',
        title: 'How does human approval work?',
        content: 'High-value transactions or those flagged by the Policy Agent require human approval. The Finance Manager sees pending approvals in the Decision Center. They can approve (resume automated recovery) or reject (stop the workflow with a reason). All approval/rejection events are logged in the audit trail. In supervised mode, all actions above ₹10,000 require approval.',
        tags: ['human-approval', 'finance-manager', 'decision-center', 'supervised', 'audit'],
        priority: 2
      },
      {
        id: 'faq_005',
        category: 'faqs',
        title: 'What is Revenue at Risk?',
        content: 'Revenue at Risk is calculated as: transaction amount × (risk score / 100). It represents the estimated monetary impact of a failed payment based on the probability that it will not be recovered. Expected Recovery is calculated as: transaction amount × recovery probability. These metrics help prioritize which transactions to focus recovery efforts on.',
        tags: ['revenue-at-risk', 'expected-recovery', 'risk-score', 'calculation', 'metrics'],
        priority: 2
      },
      {
        id: 'faq_006',
        category: 'faqs',
        title: 'Can I customize recovery policies?',
        content: 'Yes. Navigate to Policies & Guardrails in the sidebar. You can configure: maximum retry attempts, cooldown period between retries, high-value threshold, agent mode (autonomous/supervised/manual), communication channels (email/SMS), and daily communication limits. All policy changes are logged in the audit trail.',
        tags: ['customize', 'policies', 'guardrails', 'settings', 'configuration'],
        priority: 2
      }
    ];
  }
}

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
  'in', 'with', 'to', 'for', 'of', 'not', 'no', 'can', 'had', 'has',
  'was', 'were', 'been', 'being', 'have', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'this', 'that',
  'these', 'those', 'am', 'are', 'what', 'how', 'why', 'when', 'where',
  'who', 'whom', 'its', 'it', 'they', 'them', 'their', 'we', 'our',
  'you', 'your', 'he', 'she', 'his', 'her', 'my', 'me'
]);
