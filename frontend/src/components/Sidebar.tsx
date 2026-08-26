import { NavLink } from 'react-router-dom';
import { 
  Home, LayoutDashboard, LineChart, List, FileSearch, 
  BrainCircuit, Activity, Settings, ShieldCheck,
  History, Power
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Home', section: 'OVERVIEW' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'OVERVIEW' },
  { path: '/analytics', icon: LineChart, label: 'Risk Analytics', section: 'INSIGHTS' },
  { path: '/model-performance', icon: FileSearch, label: 'Model Performance', section: 'INSIGHTS' },
  
  { path: '/cases', icon: List, label: 'Recovery Cases', badge: '12', section: 'RECOVERY' },
  { path: '/decision-center', icon: BrainCircuit, label: 'AI Decision Center', section: 'RECOVERY' },
  
  { path: '/simulator', icon: Activity, label: 'Simulator', section: 'TOOLS' },
  
  { path: '/agent-control', icon: Power, label: 'Agent Control', section: 'SYSTEM' },
  { path: '/policies', icon: ShieldCheck, label: 'Policies & Guardrails', section: 'SYSTEM' },
  { path: '/audit', icon: History, label: 'Audit Trail', section: 'SYSTEM' },
  { path: '/settings', icon: Settings, label: 'Settings', section: 'SYSTEM' },
];

export default function Sidebar() {
  let currentSection = '';

  return (
    <aside className="w-64 min-h-screen bg-surface border-r border-border flex flex-col fixed top-0 left-0 z-50">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold">
          ⚡
        </div>
        <div>
          <div className="font-extrabold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            RecoverAI
          </div>
          <div className="text-[10px] text-gray-400 font-medium tracking-wider">
            REVENUE AGENT
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto flex flex-col gap-1">
        {navItems.map((item) => {
          let sectionLabel = null;
          if (item.section !== currentSection) {
            currentSection = item.section;
            sectionLabel = (
              <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase px-3 pt-5 pb-2" key={`section-${item.section}`}>
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary border-l-2 border-primary" 
                    : "text-gray-400 hover:bg-surfaceHover hover:text-gray-200"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 bg-success-bg border border-success/20 rounded-lg">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <div>
            <div className="text-xs font-semibold text-success">Agent Active</div>
            <div className="text-[10px] text-gray-400">v2.0 • Monitoring</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
