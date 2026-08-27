import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTransaction, executeDemoRecoveryAction } from '../api';
import {
  ArrowLeft,
  User,
  CreditCard,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Shield,
  Zap,
  Send,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  Check
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export default function CaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [executing, setExecuting] = useState(false);

  const { data: tx, isLoading, refetch } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => fetchTransaction(id || ''),
    enabled: !!id
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400 animate-pulse">Loading case details...</div>;
  }

  if (!tx) {
    return <div className="p-8 text-center text-danger">Case not found.</div>;
  }

  const isRecovered = tx.recoveryStatus === 'RECOVERED' || tx.status === 'captured';
  const isInProgress = tx.recoveryStatus === 'IN_PROGRESS';
  const isPending = tx.recoveryStatus === 'PENDING';
  const amount = tx.amount || 5000;

  // Build 10-Step Timeline Stages
  const timelineSteps = [
    {
      step: 1,
      title: 'Payment Failed',
      desc: `Bank decline error (${tx.errorCode || 'BAD_REQUEST_ERROR'})`,
      completed: true,
      active: false,
      date: new Date(tx.createdAt).toLocaleTimeString('en-IN')
    },
    {
      step: 2,
      title: 'Recovery Case Created',
      desc: `Case #${tx.id?.slice(0, 10)} opened with priority ${tx.severity || 'MEDIUM'}`,
      completed: true,
      active: false,
      date: new Date(tx.createdAt).toLocaleTimeString('en-IN')
    },
    {
      step: 3,
      title: 'ML Probability Prediction',
      desc: `Scored recovery probability: ${tx.recoveryScore || 65}%`,
      completed: true,
      active: false,
      date: 'Instant (<15ms)'
    },
    {
      step: 4,
      title: 'AI Strategy Selected',
      desc: `Strategy Agent recommended: ${tx.recoveryStatus === 'RECOVERED' ? 'RETRY / PAYMENT_LINK' : 'PAYMENT_LINK'}`,
      completed: true,
      active: false,
      date: 'Agent v5.0'
    },
    {
      step: 5,
      title: 'Policy Guardrail Evaluated',
      desc: `Amount ₹${amount.toLocaleString('en-IN')} approved under merchant risk rules`,
      completed: true,
      active: false,
      date: 'Policy Engine'
    },
    {
      step: 6,
      title: 'Recovery Action Dispatched',
      desc: 'Payment link generated & dispatched via Payment Provider',
      completed: isRecovered || isInProgress,
      active: isPending,
      date: isRecovered || isInProgress ? 'Dispatched' : 'Pending'
    },
    {
      step: 7,
      title: 'Payment Portal Session',
      desc: 'Customer checkout session opened',
      completed: isRecovered,
      active: isInProgress,
      date: isRecovered ? 'Completed' : 'Awaiting customer'
    },
    {
      step: 8,
      title: 'Payment Captured',
      desc: `Payment of ₹${amount.toLocaleString('en-IN')} verified by gateway`,
      completed: isRecovered,
      active: false,
      date: isRecovered ? 'Verified' : 'Pending'
    },
    {
      step: 9,
      title: 'Webhook Event Processed',
      desc: 'payment.captured signature verified and idempotently logged',
      completed: isRecovered,
      active: false,
      date: isRecovered ? 'Idempotent' : 'Pending'
    },
    {
      step: 10,
      title: 'Revenue Recovered & Case Closed',
      desc: `₹${amount.toLocaleString('en-IN')} credited to Actual Recovered Revenue`,
      completed: isRecovered,
      active: false,
      date: isRecovered ? 'CLOSED (RECOVERED)' : 'Incomplete'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border">
        <div className="flex items-center gap-4">
          <Link to="/cases" className="p-2 hover:bg-surfaceHover rounded-lg text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">Case: {tx.transactionIdStr || tx.id.substring(0, 14)}</h1>
              <Badge variant={
                isRecovered ? 'success' :
                isInProgress ? 'warning' :
                tx.recoveryStatus === 'FAILED' ? 'danger' : 'secondary'
              }>
                {tx.recoveryStatus}
              </Badge>
            </div>
            <p className="text-xs text-gray-400 mt-1">Failed on {new Date(tx.createdAt).toLocaleString('en-IN')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/decision-center">
            <Button variant="outline" className="gap-1.5 text-xs">
              <Activity className="w-4 h-4" /> AI Analysis
            </Button>
          </Link>
          
          <button
            onClick={() => navigate(`/demo-payment/${tx.id}`)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" /> Open Payment Portal
          </button>
        </div>
      </div>

      {/* Main Grid: Customer & Transaction Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card className="md:col-span-1 bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-gray-300">
              <User className="w-4 h-4 text-primary" /> Customer Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <div className="text-base font-bold text-white">{tx.customer?.name || 'Enterprise Customer'}</div>
              <div className="text-gray-400 mt-0.5">{tx.customer?.email || 'customer@enterprise.io'}</div>
              <div className="text-gray-500 mt-0.5">{tx.customer?.phone || '+919876543210'}</div>
            </div>
            
            <div className="pt-4 border-t border-border space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Customer LTV:</span>
                <span className="font-bold text-emerald-400">₹{(tx.customer?.ltv || 50000).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Historical Failures:</span>
                <span className="text-gray-300">{tx.retryCount || 1}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card className="md:col-span-2 bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-gray-300">
              <CreditCard className="w-4 h-4 text-primary" /> Transaction & Recovery Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <div>
                  <div className="text-gray-500 mb-0.5">Order Reference</div>
                  <div className="font-mono text-gray-200">{tx.orderId || 'order_demo_1234'}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-0.5">Transaction Amount</div>
                  <div className="text-xl font-bold text-white">₹{amount.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-0.5">Payment Method</div>
                  <div className="capitalize text-gray-200">{tx.paymentMethod || 'card'} • {tx.bank || 'HDFC'}</div>
                </div>
              </div>
              
              <div className="space-y-3 border-l border-border pl-6">
                <div>
                  <div className="text-gray-500 mb-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-danger" /> Failure Reason
                  </div>
                  <div className="font-medium text-danger bg-danger/10 p-2 rounded border border-danger/20">
                    {tx.errorCode || 'BAD_REQUEST_ERROR'} — {tx.errorDescription || 'BANK_DECLINE'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 mb-0.5">ML Recovery Probability</div>
                  <div className="font-bold text-emerald-400">{tx.recoveryScore || 65}%</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-0.5">Expected Recovery</div>
                  <div className="font-semibold text-cyan-400">₹{Math.round(amount * ((tx.recoveryScore || 65) / 100)).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 10-Step Database-Driven Recovery Timeline */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2 text-gray-200">
              <Layers className="w-4 h-4 text-primary" /> End-to-End Recovery Event Timeline
            </CardTitle>
            <span className="text-xs text-gray-500 font-mono">10 Lifecycle Stages</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative border-l-2 border-border/80 ml-4 pl-6 space-y-6 my-2">
            {timelineSteps.map((s, idx) => (
              <div key={idx} className="relative group">
                {/* Node icon */}
                <div className={`absolute -left-[33px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s.completed
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-4 ring-surface'
                    : s.active
                    ? 'bg-primary text-white animate-pulse ring-4 ring-surface'
                    : 'bg-surfaceHover text-gray-500 border border-border ring-4 ring-surface'
                }`}>
                  {s.completed ? <Check className="w-3.5 h-3.5" /> : s.step}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <h4 className={`text-xs font-semibold ${s.completed ? 'text-white' : s.active ? 'text-primary' : 'text-gray-400'}`}>
                      {s.step}. {s.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">{s.desc}</p>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">{s.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
