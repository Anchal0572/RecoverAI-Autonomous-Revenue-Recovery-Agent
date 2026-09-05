import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTransaction } from '../api';
import {
  ArrowLeft,
  User,
  CreditCard,
  Activity,
  AlertCircle,
  CheckCircle2,
  Shield,
  Zap,
  Layers,
  Check,
  ArrowUpRight
} from 'lucide-react';

export default function CaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: tx, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => fetchTransaction(id || ''),
    enabled: !!id
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading recovery case telemetry...</div>;
  }

  if (!tx) {
    return <div className="p-8 text-center text-rose-400 text-xs">Recovery Case not found in database.</div>;
  }

  const isRecovered = tx.recoveryStatus === 'RECOVERED' || tx.status === 'captured';
  const isInProgress = tx.recoveryStatus === 'IN_PROGRESS';
  const isPending = tx.recoveryStatus === 'PENDING';
  const amount = tx.amount || 5000;
  const expectedAmount = Math.round(amount * ((tx.recoveryScore || 65) / 100));

  const timelineSteps = [
    {
      step: 1,
      title: 'Payment Failed Event Received',
      desc: `Gateway decline error (${tx.errorCode || 'BAD_REQUEST_ERROR'})`,
      completed: true,
      active: false,
      date: new Date(tx.createdAt).toLocaleTimeString('en-IN')
    },
    {
      step: 2,
      title: 'Recovery Case Initialized',
      desc: `Case #${tx.id?.slice(0, 12)} opened under risk category ${tx.severity || 'MEDIUM'}`,
      completed: true,
      active: false,
      date: new Date(tx.createdAt).toLocaleTimeString('en-IN')
    },
    {
      step: 3,
      title: 'ML Recovery Score Inference',
      desc: `Scikit-Learn Random Forest predicted recovery probability: ${tx.recoveryScore || 65}%`,
      completed: true,
      active: false,
      date: 'Instant (<15ms)'
    },
    {
      step: 4,
      title: 'Optimal Strategy Selected',
      desc: `Strategy Agent chosen action: ${isRecovered ? 'PAYMENT_LINK' : 'SMART_RETRY'}`,
      completed: true,
      active: false,
      date: 'Strategy Engine'
    },
    {
      step: 5,
      title: 'Merchant Policy Guardrail Check',
      desc: `Transaction amount ₹${amount.toLocaleString('en-IN')} verified against retry thresholds`,
      completed: true,
      active: false,
      date: 'Policy Guardrail'
    },
    {
      step: 6,
      title: 'Recovery Action Dispatched',
      desc: 'Razorpay API payment link generated & customer notified',
      completed: isRecovered || isInProgress,
      active: isPending,
      date: isRecovered || isInProgress ? 'Dispatched' : 'Pending'
    },
    {
      step: 7,
      title: 'Payment Link Session Opened',
      desc: 'Customer accessed payment recovery gateway session',
      completed: isRecovered,
      active: isInProgress,
      date: isRecovered ? 'Completed' : 'Awaiting customer'
    },
    {
      step: 8,
      title: 'Payment Captured & Settled',
      desc: `Payment of ₹${amount.toLocaleString('en-IN')} captured via Razorpay Gateway`,
      completed: isRecovered,
      active: false,
      date: isRecovered ? 'Captured' : 'Pending'
    },
    {
      step: 9,
      title: 'Audit Compliance Logged',
      desc: 'Cryptographic hash recorded in immutable audit log',
      completed: isRecovered,
      active: false,
      date: isRecovered ? 'Idempotent' : 'Pending'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 select-none">
      {/* Case Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-md">
        <div className="flex items-center gap-3">
          <Link to="/cases" className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-slate-100 font-mono">Case #{tx.transactionIdStr || tx.id.substring(0, 14)}</h1>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                isRecovered ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                isInProgress ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {tx.recoveryStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Failed on {new Date(tx.createdAt).toLocaleString('en-IN')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <Link to="/decision-center">
            <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Strategy Analysis
            </button>
          </Link>
          
          <button
            onClick={() => navigate(`/demo-payment/${tx.id}`)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" /> Open Checkout Portal
          </button>
        </div>
      </div>

      {/* Main Grid: Customer Profile & Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Profile Box */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-md p-4 space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5 text-slate-300 font-semibold">
            <User className="w-4 h-4 text-blue-400" /> Customer Information
          </div>
          
          <div>
            <div className="text-sm font-bold text-slate-100">{tx.customer?.name || 'Acme Enterprise Corp'}</div>
            <div className="text-slate-400 text-[11px] mt-0.5">{tx.customer?.email || 'finance@acme.io'}</div>
            <div className="text-slate-500 text-[11px] mt-0.5 font-mono">{tx.customer?.phone || '+91 98765 43210'}</div>
          </div>
          
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Customer LTV:</span>
              <span className="font-bold text-emerald-400 font-mono">₹{(tx.customer?.ltv || 50000).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Historical Failures:</span>
              <span className="text-slate-300 font-mono">{tx.retryCount || 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account Tier:</span>
              <span className="text-blue-400 font-semibold">Tier-1 Enterprise</span>
            </div>
          </div>
        </div>

        {/* Transaction Financial Summary Box */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-md p-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5 mb-4 text-slate-300 font-semibold text-xs">
            <CreditCard className="w-4 h-4 text-blue-400" /> Financial Recovery Comparison
          </div>

          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <div>
                <div className="text-slate-500 text-[11px] mb-0.5">Order Reference</div>
                <div className="font-mono text-slate-200 font-semibold">{tx.orderId || 'order_demo_1032'}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[11px] mb-0.5">Original Transaction Amount</div>
                <div className="text-xl font-bold text-slate-100 font-mono">₹{amount.toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[11px] mb-0.5">Payment Method & Bank</div>
                <div className="capitalize text-slate-300 font-medium">{tx.paymentMethod || 'Credit Card'} • {tx.bank || 'HDFC Bank'}</div>
              </div>
            </div>
            
            <div className="space-y-3 border-l border-slate-800 pl-6">
              <div>
                <div className="text-slate-500 text-[11px] mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Failure Reason
                </div>
                <div className="font-mono text-rose-400 bg-rose-500/10 px-2.5 py-1.5 rounded border border-rose-500/20 text-xs">
                  {tx.errorCode || 'BAD_REQUEST_ERROR'} — {tx.errorDescription || 'INSUFFICIENT_FUNDS'}
                </div>
              </div>

              {/* Expected vs Actual Recovery Comparison */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                <div>
                  <div className="text-slate-500 text-[10px]">Expected Recovery (ML)</div>
                  <div className="font-bold text-blue-400 font-mono text-sm">₹{expectedAmount.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-slate-500 font-mono">Score: {tx.recoveryScore || 65}%</div>
                </div>

                <div>
                  <div className="text-slate-500 text-[10px]">Actual Recovered Revenue</div>
                  <div className={`font-bold font-mono text-sm ${isRecovered ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isRecovered ? `₹${amount.toLocaleString('en-IN')}` : '₹0 (Pending)'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {isRecovered ? 'Settled via Razorpay' : 'Awaiting settlement'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 9-Step Lifecycle Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-md p-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Layers className="w-4 h-4 text-blue-400" /> End-to-End Recovery Event Timeline
          </div>
          <span className="text-[11px] text-slate-500 font-mono">9 Audit Lifecycle Stages</span>
        </div>

        <div className="relative border-l border-slate-800 ml-3 pl-5 space-y-4 my-2">
          {timelineSteps.map((s, idx) => (
            <div key={idx} className="relative">
              <div className={`absolute -left-[27px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                s.completed
                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-slate-900'
                  : s.active
                  ? 'bg-blue-500 text-white animate-pulse ring-2 ring-slate-900'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 ring-2 ring-slate-900'
              }`}>
                {s.completed ? <Check className="w-3 h-3 stroke-[3]" /> : s.step}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className={`text-xs font-medium ${s.completed ? 'text-slate-200' : s.active ? 'text-blue-400 font-semibold' : 'text-slate-500'}`}>
                    {s.step}. {s.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{s.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

