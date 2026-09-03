import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Layers, 
  Gauge, 
  Wrench, 
  CloudSun, 
  GitBranch, 
  Bot, 
  AlertTriangle, 
  PlayCircle,
  Cpu,
  ClipboardList,
  TrendingUp,
  CloudLightning,
  Database
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'map', label: 'Gujarat Asset Map', icon: Map },
  { id: 'fleet', label: 'Asset Fleet', icon: Layers },
  { id: 'digital-twin', label: 'Digital Twin & FFT', icon: Cpu, badge: 'Physics', accent: 'cyan' },
  { id: 'work-orders', label: 'Work Orders & Crew', icon: ClipboardList, badge: 'SLDC', accent: 'emerald' },
  { id: 'data-ingest', label: 'Custom Data & SCADA', icon: Database, badge: 'CSV/API', accent: 'cyan' },
  { id: 'market', label: 'G-DAM & Arbitrage', icon: TrendingUp, badge: 'IEX', accent: 'amber' },
  { id: 'resilience', label: 'Disaster Resilience', icon: CloudLightning, badge: 'SIM', accent: 'rose' },
  { id: 'performance', label: 'Performance', icon: Gauge },
  { id: 'maintenance', label: 'Predictive Maint.', icon: Wrench, badge: 'ML' },
  { id: 'forecast', label: 'Weather & Forecast', icon: CloudSun },
  { id: 'grid', label: 'Grid Optimization', icon: GitBranch },
  { id: 'ai', label: 'AI Command Center', icon: Bot, highlight: true },
  { id: 'alerts', label: 'Alert Center', icon: AlertTriangle, hasAlertCount: true },
  { id: 'simulation', label: 'Scenario Sandbox', icon: PlayCircle, accent: 'rose' },
];

const Sidebar = ({ activeTab, onSelectTab }) => {
  const { criticalAlertsCount } = useTelemetry();

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 min-h-[calc(100vh-57px)] flex flex-col justify-between p-3 hidden md:flex bg-slate-950/80">
      
      {/* Navigation Links */}
      <div className="space-y-1 overflow-y-auto pr-1 custom-scrollbar">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Operational Intelligence
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          let activeStyle = isActive 
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold shadow-sm' 
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent';

          if (item.highlight && isActive) {
            activeStyle = 'bg-purple-500/15 text-purple-300 border-purple-500/40 font-semibold shadow-lg shadow-purple-950/50';
          } else if (item.accent === 'rose' && isActive) {
            activeStyle = 'bg-rose-500/15 text-rose-300 border-rose-500/40 font-semibold';
          } else if (item.accent === 'cyan' && isActive) {
            activeStyle = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 font-semibold';
          } else if (item.accent === 'amber' && isActive) {
            activeStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-semibold';
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all duration-150 ${activeStyle}`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${
                  isActive 
                    ? (item.highlight ? 'text-purple-400' : (item.accent === 'rose' ? 'text-rose-400' : (item.accent === 'cyan' ? 'text-cyan-400' : (item.accent === 'amber' ? 'text-amber-400' : 'text-emerald-400'))))
                    : 'text-slate-400'
                }`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-700 text-slate-400">
                  {item.badge}
                </span>
              )}

              {item.hasAlertCount && criticalAlertsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                  {criticalAlertsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Info Card */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1.5 mt-2">
        <div className="flex items-center justify-between text-slate-400">
          <span>AI Engine</span>
          <span className="font-semibold text-cyan-400">Watson Orchestrate</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Monitored Parks</span>
          <span className="font-mono text-emerald-400 font-bold">Kutch & Banas</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Orchestration</span>
          <span className="font-semibold text-purple-400">Multi-Agent</span>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
