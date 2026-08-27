import { NavLink } from 'react-router-dom';
import { 
  Home, LayoutDashboard, LineChart, List, FileSearch, 
  BrainCircuit, Activity, Settings, ShieldCheck,
  History, Power, Radio, AlertTriangle, BarChart3,
  Users, BookOpen, Zap
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Home', section: 'OVERVIEW' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'OVERVIEW' },
  { path: '/demo-center', icon: Zap, label: 'Demo Center', badge: 'DEMO', section: 'OVERVIEW' },
  { path: '/command-center', icon: Radio, label: 'Command Operations', badge: 'LIVE', section: 'OVERVIEW' },
  
  { path: '/analytics', icon: LineChart, label: 'Risk Analytics', section: 'INSIGHTS' },
  { path: '/model-performance', icon: FileSearch, label: 'ML Performance', section: 'INSIGHTS' },
  { path: '/leakage-detection', icon: AlertTriangle, label: 'Leakage Alerts', badge: 'NEW', section: 'INSIGHTS' },
  { path: '/customer-segments', icon: Users, label: 'Customer Segments', section: 'INSIGHTS' },
  
  { path: '/cases', icon: List, label: 'Recovery Cases', badge: '12', section: 'RECOVERY' },
  { path: '/decision-center', icon: BrainCircuit, label: 'Strategy Operations', section: 'RECOVERY' },
  
  { path: '/simulator', icon: Activity, label: 'What-If Simulator', section: 'TOOLS' },
  { path: '/strategy-comparison', icon: BarChart3, label: 'Strategy Benchmark', section: 'TOOLS' },
  { path: '/knowledge-base', icon: BookOpen, label: 'Playbook & Rules KB', section: 'TOOLS' },
  
  { path: '/agent-control', icon: Power, label: 'Automation Rules', section: 'SYSTEM' },
  { path: '/policies', icon: ShieldCheck, label: 'Policies & Limits', section: 'SYSTEM' },
  { path: '/audit', icon: History, label: 'Audit Trail', section: 'SYSTEM' },
  { path: '/settings', icon: Settings, label: 'Settings', section: 'SYSTEM' },
];

export default function Sidebar() {
  let currentSection = '';

  return (
    <aside className="w-64 h-screen max-h-screen bg-surface border-r border-border flex flex-col fixed top-0 left-0 z-50 overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
          ⚡
        </div>
        <div>
          <div className="font-extrabold text-base tracking-tight text-white">
            RecoverAI
          </div>
          <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
            REVENUE INFRASTRUCTURE
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 overflow-y-auto flex flex-col gap-0.5 custom-sidebar-scrollbar">
        {navItems.map((item) => {
          let sectionLabel = null;
          if (item.section !== currentSection) {
            currentSection = item.section;
            sectionLabel = (
              <div className="text-[10px] font-bold text-slate-500 tracking-widest uppercase px-3 pt-4 pb-1.5" key={`section-${item.section}`}>
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
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150",
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 font-semibold" 
                    : "text-slate-400 hover:bg-surfaceHover hover:text-slate-200"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={cn(
                    "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                    item.badge === 'NEW' || item.badge === 'LIVE' || item.badge === 'DEMO'
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-danger text-white"
                  )}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border flex-shrink-0 bg-surface">
        <div className="flex items-center gap-3 p-2.5 bg-success-bg border border-success/20 rounded-xl">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <div>
            <div className="text-xs font-semibold text-success">Engine Active</div>
            <div className="text-[10px] text-slate-400">v10.0 • Verified Suite</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
