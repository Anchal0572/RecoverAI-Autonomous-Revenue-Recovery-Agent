import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Lock,
  Layers,
  CreditCard,
  Building2,
  ChevronRight,
  TrendingUp,
  Cpu,
  FileText,
  Shield,
  ArrowUpRight
} from 'lucide-react';
import './Landing.css';
import BrandLogo from '../components/BrandLogo';

export default function Landing() {
  const [activeStep, setActiveStep] = useState<'failed' | 'ai' | 'action' | 'recovered'>('ai');

  return (
    <div className="landing-container flex flex-col font-sans relative">
      {/* Background Accent */}
      <div className="ambient-glow" />

      {/* Navigation Header */}
      <header className="h-16 border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <BrandLogo size="md" badgeText="FINTECH ENGINE" />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Platform Capabilities</a>
            <a href="#workflow" className="hover:text-white transition-colors">Recovery Engine</a>
            <a href="#integrations" className="hover:text-white transition-colors">Razorpay Gateway</a>
            <a href="#security" className="hover:text-white transition-colors">Security & Guardrails</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/demo-center"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors flex items-center gap-1.5"
            >
              Launch Demo Center <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mt-16">
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 grid-pattern">
          <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
            {/* Trust Pill */}
            <div className="hero-badge">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Razorpay Test Gateway Integration Verified • Autonomous Policy Engine</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              Recover Failed Payments.<br />
              Protect Revenue at Scale.
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
              RevPulse diagnoses transaction failures, scores recovery likelihood with ML models, and executes policy-governed recovery actions without manual finance overhead.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
              <Link
                to="/demo-center"
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                Launch Demo System <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm rounded-md transition-colors flex items-center justify-center gap-2"
              >
                View Executive Dashboard
              </Link>
            </div>

            {/* Process Flow Component (No oversized glowing graphics) */}
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-lg p-5 text-left shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Live Recovery Engine Flow</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Response Time: &lt;180ms</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveStep('failed')}
                  className={`p-3 rounded border text-left transition-colors ${
                    activeStep === 'failed'
                      ? 'bg-rose-500/10 border-rose-500/40 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="text-[10px] font-bold text-rose-400 uppercase mb-1">Step 1 • Event</div>
                  <div className="text-xs font-semibold text-slate-200">Failed Payment</div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">payment.failed (₹25,000)</div>
                </button>

                <button
                  onClick={() => setActiveStep('ai')}
                  className={`p-3 rounded border text-left transition-colors ${
                    activeStep === 'ai'
                      ? 'bg-blue-500/10 border-blue-500/40 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="text-[10px] font-bold text-blue-400 uppercase mb-1">Step 2 • Diagnosis</div>
                  <div className="text-xs font-semibold text-slate-200">ML Scoring</div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">Score: 84% • Card Expired</div>
                </button>

                <button
                  onClick={() => setActiveStep('action')}
                  className={`p-3 rounded border text-left transition-colors ${
                    activeStep === 'action'
                      ? 'bg-amber-500/10 border-amber-500/40 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="text-[10px] font-bold text-amber-400 uppercase mb-1">Step 3 • Strategy</div>
                  <div className="text-xs font-semibold text-slate-200">Recovery Action</div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">Dispatched Payment Link</div>
                </button>

                <button
                  onClick={() => setActiveStep('recovered')}
                  className={`p-3 rounded border text-left transition-colors ${
                    activeStep === 'recovered'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Step 4 • Settlement</div>
                  <div className="text-xs font-semibold text-slate-200">Revenue Recovered</div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">Captured: ₹25,000</div>
                </button>
              </div>

              {/* Step Detail Box */}
              <div className="mt-4 p-3 bg-slate-950/80 border border-slate-800 rounded text-xs text-slate-300 font-mono">
                {activeStep === 'failed' && (
                  <div>
                    <span className="text-rose-400 font-semibold">[EVENT_RECEIVED]</span> Razorpay webhook payment.failed detected for transaction <code className="text-slate-100">pay_7p7iyapt</code>. Cause: INSUFFICIENT_FUNDS. Risk Score: 68/100.
                  </div>
                )}
                {activeStep === 'ai' && (
                  <div>
                    <span className="text-blue-400 font-semibold">[ML_PREDICTION]</span> Scikit-Learn Random Forest evaluated 10 transaction features. Predicted Recovery Likelihood: <span className="text-emerald-400 font-bold">84%</span>.
                  </div>
                )}
                {activeStep === 'action' && (
                  <div>
                    <span className="text-amber-400 font-semibold">[POLICY_CHECK]</span> Verified 24-hr retry limit and merchant threshold. Selected action: <span className="text-amber-300 font-semibold">PAYMENT_LINK</span> via Razorpay API.
                  </div>
                )}
                {activeStep === 'recovered' && (
                  <div>
                    <span className="text-emerald-400 font-semibold">[SETTLED]</span> Razorpay webhook payment.captured received. Case #1032 resolved. Net revenue saved: <span className="text-emerald-400 font-bold">₹25,000</span>.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Real Business Problem Section */}
        <section className="py-16 border-t border-slate-800 bg-[#0d1322]/60">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-2xl mb-10">
              <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">The Revenue Leakage Problem</h2>
              <h3 className="text-2xl font-bold text-white tracking-tight">Merchants lose 2% to 7% of gross revenue to unhandled payment failures</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-rose-400 font-bold text-lg mb-1">Dumb Retries</div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  Blindly retrying failed payments causes card blocks and triggers bank fraud protection rules, resulting in permanent customer churn.
                </div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-amber-400 font-bold text-lg mb-1">Manual Overhead</div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  Finance teams spend hundreds of hours manually reviewing failed charges, reaching out via email, and sending payment links.
                </div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="text-blue-400 font-bold text-lg mb-1">No Policy Controls</div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  Static scripts lack guardrails for high-value transactions, risking over-messaging tier-1 customers or giving unauthorized discounts.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Platform Capabilities */}
        <section id="features" className="py-16 border-t border-slate-800">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Core Platform Capabilities</h2>
              <h3 className="text-2xl font-bold text-white tracking-tight">Enterprise financial control for recovery operations</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded flex items-center justify-center mb-3">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1.5">ML Recovery Likelihood Engine</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Scikit-Learn Random Forest classifier trained on 10 failure features predicts recovery probability (P_recover) in under 50ms.
                </p>
              </div>

              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1.5">Policy & Guardrail Engine</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enforces merchant-configured retry limits, cooldown intervals, and high-value human approval thresholds before dispatching recovery.
                </p>
              </div>

              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded flex items-center justify-center mb-3">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1.5">Razorpay Gateway Integration</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Deep integration with Razorpay Webhooks and APIs for automated payment link creation, smart retries, and instant settlement tracking.
                </p>
              </div>

              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="w-8 h-8 bg-slate-500/10 border border-slate-500/20 text-slate-300 rounded flex items-center justify-center mb-3">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1.5">7 Failure Taxonomy Categories</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Classifies failure causes: Insufficient Funds, Expired Card, Network Timeout, Authentication Failure, Gateway Error, Blocked Card, Fraud Suspect.
                </p>
              </div>

              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded flex items-center justify-center mb-3">
                  <Cpu className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1.5">What-If Recovery Simulator</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Model financial recovery scenarios by tweaking volume, average transaction size, failure rates, and retry policies before live deployment.
                </p>
              </div>

              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded flex items-center justify-center mb-3">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1.5">Immutable Audit Trail</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cryptographically logs every AI decision, policy block, human approval, and gateway event for financial audit compliance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Razorpay Integration & Security */}
        <section id="integrations" className="py-16 border-t border-slate-800 bg-[#0d1322]/60">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Razorpay Gateway Ready</div>
                <h3 className="text-2xl font-bold text-white tracking-tight mb-4">Plug into existing Razorpay test & production webhooks</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  RevPulse connects directly via standard webhooks (`payment.failed`, `payment.captured`). Receive instant alerts, generate payment links via Razorpay API, and track recovery rates without altering checkout code.
                </p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>HMAC-SHA256 signature verification on all incoming webhooks</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Razorpay API payment link generation with automated expiry</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Test mode & live gateway toggle in settings</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span>Gateway Integration Config</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">TEST MODE</span>
                </div>
                <div className="space-y-3 font-mono text-xs text-slate-300">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-500">Gateway:</span>
                    <span className="text-slate-200 font-semibold">Razorpay API v1</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-500">Key ID:</span>
                    <span className="text-slate-200">rzp_test_••••••••1032</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                    <span className="text-slate-500">Webhook Secret:</span>
                    <span className="text-slate-200">whsec_••••••••4921</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-slate-500">Webhook Endpoint:</span>
                    <span className="text-blue-400 truncate">/api/v1/webhooks/razorpay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Footer Section */}
        <section className="py-16 border-t border-slate-800">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to test RevPulse on your payment data?</h2>
            <p className="text-xs text-slate-400 mb-8 max-w-xl mx-auto">
              Launch the interactive Demo Control Center to generate failed transactions, execute recovery actions, and inspect live agent traces.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/demo-center"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center gap-2"
              >
                Launch Demo Center <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 transition-colors"
              >
                Explore Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 bg-slate-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" showSubtitle={false} showBadge={false} />
            <span className="text-slate-400">• Enterprise Fintech Platform</span>
          </div>
          <div>
            <span>© 2026 RevPulse Inc. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
