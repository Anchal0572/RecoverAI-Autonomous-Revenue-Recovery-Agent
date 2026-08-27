import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  BrainCircuit,
  BarChart3,
  Clock,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  CreditCard,
  Building2,
  ChevronRight,
  TrendingUp,
  Cpu,
  FileText
} from 'lucide-react';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'failed' | 'ai' | 'action' | 'recovered'>('ai');

  return (
    <div className="landing-container flex flex-col font-sans relative">
      {/* Ambient background glow */}
      <div className="ambient-glow" />

      {/* Navigation Header */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl fixed top-0 w-full z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                RecoverAI
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                Revenue Recovery Infrastructure
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#integrations" className="hover:text-white transition-colors">Razorpay Integration</a>
            <a href="#analytics" className="hover:text-white transition-colors">Metrics</a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/demo-center"
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5"
            >
              Launch System <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mt-20">
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 overflow-hidden grid-pattern">
          <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
            {/* Trust Pill */}
            <div className="hero-badge shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>Razorpay Test Gateway & Webhook Verified • Version 10.0</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              Turn Payment Failures Into <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                Recovered Revenue.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              RecoverAI is an autonomous fintech infrastructure that scores failed payments using ML risk prediction, dispatches multi-channel recovery links, and settles invoices under strict merchant guardrails.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => navigate('/demo-center')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> Open Demo Control Center
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                View Live Executive Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Live System Showcase Preview */}
            <div className="terminal-window max-w-4xl mx-auto text-left shadow-2xl">
              <div className="terminal-header">
                <div className="flex items-center gap-3">
                  <div className="terminal-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                  </div>
                  <span className="text-xs font-mono text-slate-400">recoverai-engine // live-recovery-pipeline</span>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setActiveTab('failed')}
                    className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                      activeTab === 'failed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1. Failure
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                      activeTab === 'ai' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2. AI Diagnosis
                  </button>
                  <button
                    onClick={() => setActiveTab('action')}
                    className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                      activeTab === 'action' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    3. Action Link
                  </button>
                  <button
                    onClick={() => setActiveTab('recovered')}
                    className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                      activeTab === 'recovered' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    4. Capture
                  </button>
                </div>
              </div>

              {/* Showcase Body */}
              <div className="p-6 text-xs space-y-4 font-mono">
                {activeTab === 'failed' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800 pb-2">
                      <span>[EVENT: payment.failed]</span>
                      <span>₹50,000 INR</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-slate-300">
                      <div>
                        <span className="text-slate-500 block">Transaction Reference:</span>
                        <span>pay_demo_8879412</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Error Code:</span>
                        <span className="text-red-400">BANK_DECLINE (Issuer timeout)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Customer:</span>
                        <span>Acme Enterprise (LTV: ₹2,50,000)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Status:</span>
                        <span className="text-amber-400">Recovery Case Initialized</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-indigo-400 font-bold border-b border-slate-800 pb-2">
                      <span>[AGENT: 7-Agent Pipeline Evaluation]</span>
                      <span>Latency: 142ms</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Root Cause</span>
                        <span className="text-slate-200 font-bold">Temporary Timeout</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">ML Recovery Prob</span>
                        <span className="text-emerald-400 font-bold">78% Confidence</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Expected Recovery</span>
                        <span className="text-cyan-400 font-bold">₹39,000</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">Policy Rule</span>
                        <span className="text-emerald-400 font-bold">APPROVED</span>
                      </div>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed pt-1">
                      Reasoning: ML Random Forest model identified high recovery likelihood. Strategy Agent selected PAYMENT_LINK with 24h cooling interval.
                    </p>
                  </div>
                )}

                {activeTab === 'action' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-cyan-400 font-bold border-b border-slate-800 pb-2">
                      <span>[EXECUTION: Payment Link Generated]</span>
                      <span>Gateway: Razorpay Test</span>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300 text-[11px]">https://recoverai.io/demo-payment/case_6a90041</span>
                      <button
                        onClick={() => navigate('/demo-center')}
                        className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-colors"
                      >
                        Open Portal →
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'recovered' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
                      <span>[EVENT: payment.captured]</span>
                      <span>Status: RECOVERED</span>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-300 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Actual Revenue Recovered: ₹50,000</span>
                        <span>Case Closed</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Monitoring Agent verified HMAC signature. Immutable Audit Log event logged. Dashboard KPIs synchronized.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 bg-slate-900/40 border-y border-slate-800">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 space-y-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Built For Modern Fintech</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Engineered For Reliability & Control</h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
                RecoverAI combines machine learning intelligence with merchant-defined guardrails so your finance team stays in complete control.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="human-card p-8 human-card-hover">
                <div className="icon-box icon-box-indigo">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Machine Learning Risk Scoring</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Trained Random Forest Classifier (ROC-AUC 0.86) scores real-time recovery probability using 10 engineered transaction and customer features.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="human-card p-8 human-card-hover">
                <div className="icon-box icon-box-emerald">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">7-Agent Orchestrator</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Specialized agents handle Detection, Root Cause Classification, ML Prediction, Strategy Selection, Policy Checking, Execution, and Monitoring.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="human-card p-8 human-card-hover">
                <div className="icon-box icon-box-amber">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Strict Policy Guardrails</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Merchant-configurable retry limits, cooldown periods, and automatic escalation to Human Approval Queue for high-value transactions ($\ge$ ₹50,000).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Steps Section */}
        <section id="workflow" className="py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16 space-y-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">End-to-End Recovery Lifecycle</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">How RecoverAI Operates</h2>
              <p className="text-slate-400 max-w-xl mx-auto text-sm">
                From failure webhook ingestion to actual revenue capture in 4 streamlined stages.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h4 className="text-sm font-bold text-white">Payment Failure Ingestion</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ingests gateway webhooks, extracts error codes, and initializes an open Recovery Case.
                </p>
              </div>

              <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h4 className="text-sm font-bold text-white">ML Risk & Cause Scoring</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Calculates recovery probability P(recover) and expected recoverable revenue value.
                </p>
              </div>

              <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h4 className="text-sm font-bold text-white">Strategy & Policy Guardrail</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Selects optimal strategy (`RETRY`, `PAYMENT_LINK`, `REMINDER`) and enforces retry thresholds.
                </p>
              </div>

              <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs">
                  04
                </div>
                <h4 className="text-sm font-bold text-white">Execution & Settlement</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dispatches session links, processes capture webhooks, updates actual revenue, and closes case.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Metrics Showcase */}
        <section id="analytics" className="py-20 bg-slate-900/60 border-t border-slate-800">
          <div className="max-w-6xl mx-auto px-6">
            <div className="human-card p-10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-slate-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-black text-white">10,000</div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Transactions Analyzed</div>
                </div>
                <div className="space-y-1 pt-4 md:pt-0">
                  <div className="text-3xl sm:text-4xl font-black text-emerald-400">₹4.60 Cr</div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actual Revenue Recovered</div>
                </div>
                <div className="space-y-1 pt-4 md:pt-0">
                  <div className="text-3xl sm:text-4xl font-black text-indigo-400">39%</div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Recovery Rate</div>
                </div>
                <div className="space-y-1 pt-4 md:pt-0">
                  <div className="text-3xl sm:text-4xl font-black text-cyan-400">&lt; 200ms</div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Agent Execution Latency</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Professional Footer */}
      <footer className="border-t border-slate-800 py-10 bg-slate-950 text-slate-400 text-xs">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">⚡</div>
            <span className="font-bold text-white">RecoverAI Engine</span>
            <span className="text-slate-500">© 2026 Anchal Keshri. Handcrafted for Hackathons.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/demo-center" className="hover:text-white transition-colors">Demo Center</Link>
            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link to="/policies" className="hover:text-white transition-colors">Policies & Guardrails</Link>
            <Link to="/audit" className="hover:text-white transition-colors">Audit Trail</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
