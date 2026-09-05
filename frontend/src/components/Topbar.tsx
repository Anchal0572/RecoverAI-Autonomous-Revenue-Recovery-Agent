import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Settings, LogOut, ChevronDown, Shield, UserCircle, CheckCircle2, AlertTriangle, Info, Zap } from 'lucide-react';
import { fetchPaymentConfig } from '../api';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Executive Dashboard',
  '/demo-center': 'Demo Control Center',
  '/command-center': 'Command Console',
  '/analytics': 'Revenue Risk Analytics',
  '/leakage-detection': 'Revenue Leakage Alerts',
  '/customer-segments': 'Customer Segmentation',
  '/model-performance': 'ML Engine Analytics',
  '/cases': 'Recovery Cases',
  '/decision-center': 'Strategy Operations',
  '/simulator': 'What-If Simulator',
  '/strategy-comparison': 'Strategy Benchmark',
  '/knowledge-base': 'RAG Knowledge KB',
  '/agent-control': 'Automation Rules',
  '/policies': 'Policies & Guardrails',
  '/audit': 'Audit Trail',
  '/integrations': 'Razorpay Integration',
  '/settings': 'Settings',
};

const pageSubtitles: Record<string, string> = {
  '/dashboard': 'Real-time overview of revenue recovered, active risk, and recovery metrics',
  '/demo-center': 'Interactive recovery simulator & gateway checkout testing',
  '/command-center': 'Real-time payment recovery workflow operations',
  '/analytics': 'Risk distribution & recoverable revenue insights',
  '/leakage-detection': 'Payment failure anomaly detection & alerts',
  '/customer-segments': 'Targeted customer risk profiles and cohorts',
  '/model-performance': 'Machine learning prediction accuracy & benchmark',
  '/cases': 'Active revenue recovery pipeline cases',
  '/decision-center': 'Automated strategy selection & execution history',
  '/simulator': 'Scenario testing & expected recovery modeling',
  '/strategy-comparison': 'Empirical strategy benchmark performance',
  '/knowledge-base': 'Merchant policy & recovery playbook search engine',
  '/agent-control': 'Automation engine status & rule controls',
  '/policies': 'Merchant thresholds & human approval guardrails',
  '/audit': 'Immutable cryptographic compliance event logs',
  '/integrations': 'Payment gateway connections & webhook status',
  '/settings': 'Account & merchant configuration',
};

const NOTIFICATIONS = [
  { id: '1', type: 'success', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Payment Recovered', desc: '₹33,616 recovered via RETRY_PAYMENT', time: '2m ago' },
  { id: '2', type: 'warning', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', title: 'High Risk Failure', desc: 'High-value failure: ₹75,000 — pay_7p7iyapt', time: '8m ago' },
  { id: '3', type: 'success', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', title: 'Payment Link Claimed', desc: '₹25,895 recovered via PAYMENT_LINK', time: '14m ago' },
  { id: '4', type: 'info', icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', title: 'ML Model Inference', desc: 'RevPulse model score: 86% ROC-AUC', time: '1h ago' },
];

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || 'RevPulse';
  const subtitle = pageSubtitles[location.pathname] || 'Autonomous Revenue Recovery Platform';

  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);

  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const unreadCount = NOTIFICATIONS.filter(n => !readIds.includes(n.id)).length;

  const handleMarkAllRead = () => setReadIds(NOTIFICATIONS.map(n => n.id));

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const storedUser = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch { return null; }
  })();

  const displayName = storedUser?.name || storedUser?.email?.split('@')[0] || 'Admin';
  const displayEmail = storedUser?.email || 'admin@revpulse.io';
  const initials = displayName.slice(0, 2).toUpperCase();

  const [paymentMode, setPaymentMode] = useState<'demo' | 'razorpay_test'>('demo');

  useEffect(() => {
    fetchPaymentConfig()
      .then(cfg => {
        if (cfg?.paymentMode) setPaymentMode(cfg.paymentMode);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-14 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-40 select-none">
      {/* Left: Page Title & Breadcrumb Subtitle */}
      <div className="flex flex-col justify-center">
        <h1 className="text-sm font-semibold text-slate-100 leading-tight">{title}</h1>
        <span className="text-[11px] text-slate-400 font-normal">{subtitle}</span>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3">
        {/* Payment Environment Badge */}
        <button
          onClick={() => navigate('/demo-center')}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
            paymentMode === 'demo'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
          }`}
          title="Click to open Demo Control Center"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          <span>{paymentMode === 'demo' ? 'DEMO MODE' : 'RAZORPAY TEST'}</span>
        </button>

        {/* Demo Center Quick Link */}
        <button
          id="topbar-demo-center-btn"
          onClick={() => navigate('/demo-center')}
          className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-colors"
        >
          <Zap className="w-3.5 h-3.5" /> Launch Demo
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={bellRef}>
          <button
            id="topbar-notifications"
            onClick={() => { setBellOpen(v => !v); setUserOpen(false); }}
            className="relative p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#0d1322]" />
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-80 bg-slate-900 border border-slate-800 rounded-md shadow-xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-900/90">
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">System Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-[10px] text-slate-400">{unreadCount} unread alerts</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {NOTIFICATIONS.map(n => {
                  const isRead = readIds.includes(n.id);
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => setReadIds(prev => [...prev, n.id])}
                      className={`flex gap-3 px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-slate-800/50 ${!isRead ? 'bg-blue-500/5' : ''}`}
                    >
                      <div className={`mt-0.5 w-6 h-6 rounded flex-shrink-0 flex items-center justify-center ${n.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${n.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-slate-200 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-500 whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{n.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-3.5 py-2 border-t border-slate-800 text-center bg-slate-950/40">
                <button
                  onClick={() => { navigate('/audit'); setBellOpen(false); }}
                  className="text-xs text-blue-400 hover:underline font-medium"
                >
                  View Audit Trail →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-800" />

        {/* User Profile Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            id="topbar-user-menu"
            onClick={() => { setUserOpen(v => !v); setBellOpen(false); }}
            className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-slate-800/80 transition-colors"
          >
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold select-none">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-xs font-medium text-slate-200 leading-none">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">Merchant Admin</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${userOpen ? 'rotate-180' : ''}`} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-slate-900 border border-slate-800 rounded-md shadow-xl overflow-hidden z-50">
              <div className="px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/40">
                <p className="text-xs font-semibold text-slate-200 truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{displayEmail}</p>
              </div>

              <div className="py-1 text-xs">
                <button
                  id="user-menu-profile"
                  onClick={() => { navigate('/settings'); setUserOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <UserCircle className="w-4 h-4 text-slate-400" />
                  Account Settings
                </button>
                <button
                  id="user-menu-policies"
                  onClick={() => { navigate('/policies'); setUserOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Shield className="w-4 h-4 text-slate-400" />
                  Policies & Guardrails
                </button>
              </div>

              <div className="border-t border-slate-800 py-1 text-xs">
                <button
                  id="user-menu-logout"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

