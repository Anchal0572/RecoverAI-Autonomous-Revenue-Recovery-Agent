import { NavLink } from 'react-router-dom';
import { 
  Home, LayoutDashboard, LineChart, List, FileSearch, 
  BrainCircuit, Activity, Settings, ShieldCheck,
  History, Power, Radio, AlertTriangle, BarChart3,
  Users, BookOpen, Zap, Shield
} from 'lucide-react';
import { cn } from '../lib/utils';
import BrandLogo from './BrandLogo';

const navItems = [
  { path: '/', icon: Home, label: 'Overview', section: 'MAIN' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'MAIN' },
  { path: '/demo-center', icon: Zap, label: 'Demo Center', badge: 'DEMO', section: 'MAIN' },
  { path: '/command-center', icon: Radio, label: 'Command Console', badge: 'LIVE', section: 'MAIN' },
  
  { path: '/cases', icon: List, label: 'Recovery Cases', badge: '12', section: 'OPERATIONS' },
  { path: '/decision-center', icon: BrainCircuit, label: 'Strategy Operations', section: 'OPERATIONS' },
  { path: '/leakage-detection', icon: AlertTriangle, label: 'Leakage Alerts', badge: 'NEW', section: 'OPERATIONS' },
  { path: '/customer-segments', icon: Users, label: 'Customer Segments', section: 'OPERATIONS' },
  
  { path: '/analytics', icon: LineChart, label: 'Risk Analytics', section: 'INTELLIGENCE' },
  { path: '/model-performance', icon: FileSearch, label: 'ML Performance', section: 'INTELLIGENCE' },
  { path: '/simulator', icon: Activity, label: 'What-If Simulator', section: 'INTELLIGENCE' },
  { path: '/strategy-comparison', icon: BarChart3, label: 'Strategy Benchmark', section: 'INTELLIGENCE' },
  { path: '/knowledge-base', icon: BookOpen, label: 'RAG Knowledge KB', section: 'INTELLIGENCE' },
  
  { path: '/agent-control', icon: Power, label: 'Automation Rules', section: 'GOVERNANCE' },
  { path: '/policies', icon: ShieldCheck, label: 'Policies & Guardrails', section: 'GOVERNANCE' },
  { path: '/audit', icon: History, label: 'Audit Trail', section: 'GOVERNANCE' },
  { path: '/settings', icon: Settings, label: 'Settings & APIs', section: 'GOVERNANCE' },
];

export default function Sidebar() {
  let currentSection = '';

  return (
    <aside className="w-64 h-screen max-h-screen bg-[#0d1322] border-r border-slate-800 flex flex-col fixed top-0 left-0 z-50 overflow-hidden select-none">
      {/* Brand Header */}
      <div className="p-3.5 px-4 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0 bg-[#090e1a]/95">
        <BrandLogo size="md" badgeText="AI SAAS" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto flex flex-col gap-0.5 custom-sidebar-scrollbar">
        {navItems.map((item) => {
          let sectionLabel = null;
          if (item.section !== currentSection) {
            currentSection = item.section;
            sectionLabel = (
              <div className="text-[10px] font-semibold text-slate-500 tracking-widest uppercase px-3 pt-3.5 pb-1" key={`section-${item.section}`}>
                {item.section}
              </div>
            );
          }
          return (
            <div key={item.path}>
              {sectionLabel}
              <NavLink
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150",
                  isActive 
                    ? "bg-blue-600/15 text-blue-400 font-semibold border-l-2 border-blue-500 pl-2.5" 
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className={cn(
                    "ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded min-w-[18px] text-center leading-none",
                    item.badge === 'LIVE' 
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : item.badge === 'DEMO'
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      : item.badge === 'NEW'
                      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  )}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800/80 flex-shrink-0 bg-[#0b101d]">
        <div className="flex items-center gap-2.5 p-2 bg-slate-900/60 border border-slate-800 rounded-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="truncate">
            <div className="text-[11px] font-semibold text-slate-200 leading-tight">Razorpay Gateway Test</div>
            <div className="text-[10px] text-slate-400 font-mono">v10.0 • Connected</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

