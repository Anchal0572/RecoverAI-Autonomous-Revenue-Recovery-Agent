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
  { path: '/command-center', icon: Radio, label: 'Command Center', badge: 'NEW', section: 'OVERVIEW' },
  
  { path: '/analytics', icon: LineChart, label: 'Risk Analytics', section: 'INSIGHTS' },
  { path: '/model-performance', icon: FileSearch, label: 'Model Performance', section: 'INSIGHTS' },
  { path: '/leakage-detection', icon: AlertTriangle, label: 'Leakage Detection', badge: 'NEW', section: 'INSIGHTS' },
  { path: '/customer-segments', icon: Users, label: 'Customer Segments', badge: 'NEW', section: 'INSIGHTS' },
  
  { path: '/cases', icon: List, label: 'Recovery Cases', badge: '12', section: 'RECOVERY' },
  { path: '/decision-center', icon: BrainCircuit, label: 'AI Decision Center', section: 'RECOVERY' },
  
  { path: '/simulator', icon: Activity, label: 'Simulator', section: 'TOOLS' },
  { path: '/strategy-comparison', icon: BarChart3, label: 'Strategy Compare', badge: 'NEW', section: 'TOOLS' },
  { path: '/knowledge-base', icon: BookOpen, label: 'Knowledge Base', badge: 'NEW', section: 'TOOLS' },
  
  { path: '/agent-control', icon: Power, label: 'Agent Control', section: 'SYSTEM' },
  { path: '/policies', icon: ShieldCheck, label: 'Policies & Guardrails', section: 'SYSTEM' },
  { path: '/audit', icon: History, label: 'Audit Trail', section: 'SYSTEM' },
  { path: '/settings', icon: Settings, label: 'Settings', section: 'SYSTEM' },
];

export default function Sidebar() {
  let currentSection = '';

  return (
    <aside className="w-64 h-screen max-h-screen bg-surface border-r border-border flex flex-col fixed top-0 left-0 z-50 overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
          ⚡
        </div>
        <div>
          <div className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            RecoverAI
          </div>
          <div className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">
            REVENUE AGENT
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 overflow-y-auto flex flex-col gap-0.5 custom-sidebar-scrollbar">
        {navItems.map((item) => {
          let sectionLabel = null;
          if (item.section !== currentSection) {
            currentSection = item.section;
            sectionLabel = (
              <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase px-3 pt-4 pb-1.5" key={`section-${item.section}`}>
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
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                  isActive 
                    ? "bg-primary/10 text-primary border-l-2 border-primary font-semibold" 
                    : "text-gray-400 hover:bg-surfaceHover hover:text-gray-200"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={cn(
                    "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                    item.badge === 'NEW'
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
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
        <div className="flex items-center gap-3 p-2.5 bg-success-bg border border-success/20 rounded-lg">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <div>
            <div className="text-xs font-semibold text-success">Agent Active</div>
            <div className="text-[10px] text-gray-400">v7.0 • Phase 7 Engine</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
