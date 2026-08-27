import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Settings, LogOut, ChevronDown, Shield, UserCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/command-center': 'AI Command Center',
  '/analytics': 'Revenue Risk Analytics',
  '/leakage-detection': 'Revenue Leakage Detection',
  '/customer-segments': 'Customer Segmentation',
  '/model-performance': 'ML Engine Performance',
  '/cases': 'Recovery Cases',
  '/decision-center': 'AI Decision Center',
  '/simulator': 'Recovery Simulator',
  '/strategy-comparison': 'Strategy Comparison',
  '/knowledge-base': 'RAG Knowledge Base',
  '/agent-control': 'Agent Control Center',
  '/policies': 'Policies & Guardrails',
  '/audit': 'Audit Trail',
  '/integrations': 'Razorpay Integration',
  '/settings': 'Settings',
};

const pageSubtitles: Record<string, string> = {
  '/dashboard': 'Overview of your revenue recovery',
  '/command-center': 'Real-time AI operations overview',
  '/analytics': 'Risk distribution & recovery insights',
  '/leakage-detection': 'Anomaly detection & leak alerts',
  '/customer-segments': 'Targeted recovery segment profiles',
  '/model-performance': 'Autonomous Revenue Recovery',
  '/cases': 'Active recovery pipeline',
  '/decision-center': 'Autonomous Decisions',
  '/simulator': 'Test failure scenarios & what-if analysis',
  '/strategy-comparison': 'Empirical strategy benchmark',
  '/knowledge-base': 'Policy & playbook search engine',
  '/agent-control': 'Agent status & configuration',
  '/policies': 'Risk thresholds & guardrails',
  '/audit': 'Autonomous Revenue Recovery',
  '/integrations': 'Payment gateway connections',
  '/settings': 'Account & merchant settings',
};

// Mock recent notifications — in a real app these would come from the backend
const NOTIFICATIONS = [
  { id: '1', type: 'success', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', title: 'Payment Recovered', desc: '₹33,616 recovered via RETRY_PAYMENT', time: '2m ago' },
  { id: '2', type: 'warning', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', title: 'Risk Detected', desc: 'High-value failure: ₹75,000 — pay_7p7iyapt', time: '8m ago' },
  { id: '3', type: 'success', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', title: 'Payment Recovered', desc: '₹25,895 recovered via RETRY_PAYMENT', time: '14m ago' },
  { id: '4', type: 'info', icon: Info, color: 'text-primary', bg: 'bg-primary/10', title: 'ML Model Online', desc: 'RecoverAI engine running — AUC 0.86', time: '1h ago' },
];

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || 'RecoverAI';
  const subtitle = pageSubtitles[location.pathname] || 'Autonomous Revenue Recovery';

  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);

  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
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

  // Get user name from stored token (simple decode)
  const storedUser = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch { return null; }
  })();

  const displayName = storedUser?.name || storedUser?.email?.split('@')[0] || 'Admin';
  const displayEmail = storedUser?.email || '';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Left: Page title */}
      <div className="flex flex-col justify-center">
        <h1 className="text-base font-bold text-foreground leading-tight">{title}</h1>
        <span className="text-xs text-gray-500">{subtitle}</span>
      </div>

      {/* Right: Bell + Admin */}
      <div className="flex items-center gap-3">

        {/* ── Bell / Notifications ── */}
        <div className="relative" ref={bellRef}>
          <button
            id="topbar-notifications"
            onClick={() => { setBellOpen(v => !v); setUserOpen(false); }}
            className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surfaceHover transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-surface animate-pulse" />
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-gray-200">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-[11px] text-gray-500">{unreadCount} unread</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-border/50">
                {NOTIFICATIONS.map(n => {
                  const isRead = readIds.includes(n.id);
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => setReadIds(prev => [...prev, n.id])}
                      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-surfaceHover ${!isRead ? 'bg-primary/5' : ''}`}
                    >
                      <div className={`mt-0.5 w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${n.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${n.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-gray-200 truncate">{n.title}</p>
                          <span className="text-[10px] text-gray-600 whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{n.desc}</p>
                      </div>
                      {!isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-border text-center">
                <button
                  onClick={() => { navigate('/audit'); setBellOpen(false); }}
                  className="text-xs text-primary hover:underline"
                >
                  View full Audit Trail →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* ── Admin / User Menu ── */}
        <div className="relative" ref={userRef}>
          <button
            id="topbar-user-menu"
            onClick={() => { setUserOpen(v => !v); setBellOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surfaceHover transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white text-xs font-bold select-none">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-gray-500 leading-tight">Administrator</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${userOpen ? 'rotate-180' : ''}`} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User info */}
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-200 truncate">{displayName}</p>
                    <p className="text-[11px] text-gray-500 truncate">{displayEmail}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  id="user-menu-profile"
                  onClick={() => { navigate('/settings'); setUserOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-surfaceHover transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  My Profile
                </button>
                <button
                  id="user-menu-settings"
                  onClick={() => { navigate('/settings'); setUserOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-surfaceHover transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  id="user-menu-policies"
                  onClick={() => { navigate('/policies'); setUserOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-surfaceHover transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Policies & Guardrails
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-border py-1">
                <button
                  id="user-menu-logout"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
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
