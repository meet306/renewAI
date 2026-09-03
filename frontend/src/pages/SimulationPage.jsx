import React from 'react';
import { 
  PlayCircle, 
  RotateCcw, 
  Flame, 
  CheckCircle2, 
  Wind, 
  Sun, 
  CloudRain, 
  Zap, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

const SimulationPage = ({ onInspectAsset }) => {
  const { 
    scenarios, 
    activeScenario, 
    loading, 
    lastActionMessage, 
    triggerScenario, 
    resetSimulation 
  } = useSimulation();

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-rose-400" />
            <span>Interactive Scenario Simulator & Anomaly Injector</span>
          </h2>
          <p className="text-xs text-slate-400">
            Inject mechanical bearing degradation, thermal faults, and grid demand spikes to validate Agentic AI reactions.
          </p>
        </div>

        <button
          onClick={resetSimulation}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reset Fleet to Baseline</span>
        </button>
      </div>

      {/* Active State Banner */}
      {activeScenario ? (
        <div className="p-4 rounded-xl glass-panel border border-rose-500/40 bg-rose-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-rose-400 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                Active Simulation Event: {activeScenario}
              </p>
              <p className="text-xs text-slate-300">
                Sensors are mutating in real-time. Performance and Maintenance agents have triggered alerts.
              </p>
            </div>
          </div>
          {activeScenario === 'WT_BEARING_DEGRADATION' && (
            <button
              onClick={() => onInspectAsset('WT-021')}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
            >
              Inspect WT-021 Telemetry →
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl glass-panel border border-emerald-500/30 bg-emerald-500/5 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <p className="text-xs text-slate-300">
            Fleet is currently operating in <strong className="text-emerald-400">Nominal Baseline State</strong>. Select a scenario below to inject abnormal conditions.
          </p>
        </div>
      )}

      {/* Scenario Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((sc) => {
          const isCurrent = activeScenario === sc.code;
          const isStep3 = sc.code === 'WT_BEARING_DEGRADATION';

          return (
            <div
              key={sc.code}
              className={`glass-panel p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isCurrent 
                  ? 'border-rose-500/50 bg-rose-500/10 shadow-glow-rose' 
                  : (isStep3 ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-slate-800 hover:border-slate-700')
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {sc.category}
                  </span>
                  {isStep3 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                      ★ DEMO STEP 3
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white tracking-tight">{sc.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{sc.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Target: {sc.target}</span>

                <button
                  onClick={() => triggerScenario(sc.code)}
                  disabled={loading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isCurrent 
                      ? 'bg-rose-600 text-white shadow-glow-rose' 
                      : (isStep3 ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200')
                  }`}
                >
                  <span>{isCurrent ? "Active (Re-trigger)" : "Inject Scenario"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default SimulationPage;
