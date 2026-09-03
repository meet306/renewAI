import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  AlertOctagon, 
  CheckCircle2, 
  Flame, 
  CloudRain, 
  Wind, 
  Zap,
  ChevronDown
} from 'lucide-react';
import { useSimulation } from '../../context/SimulationContext';

const SimulationBanner = ({ onInspectAsset }) => {
  const { 
    scenarios, 
    activeScenario, 
    loading, 
    lastActionMessage, 
    triggerScenario, 
    resetSimulation, 
    clearMessage 
  } = useSimulation();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-dark-900 border-b border-rose-500/20 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left Indicator & Quick Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold tracking-wide uppercase text-[10px]">
            <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>DEMO SIMULATOR</span>
          </div>

          {activeScenario ? (
            <div className="flex items-center gap-2 text-rose-300">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="font-semibold">Active: {activeScenario}</span>
              {activeScenario === 'WT_BEARING_DEGRADATION' && (
                <button
                  onClick={() => onInspectAsset && onInspectAsset('WT-021')}
                  className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-white font-medium border border-rose-500/40 text-[11px]"
                >
                  Inspect WT-021 Telemetry →
                </button>
              )}
            </div>
          ) : (
            <span className="text-slate-400">
              Fleet Status: <strong className="text-emerald-400">Baseline Operations (Nominal)</strong>
            </span>
          )}
        </div>

        {/* Center / Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Key Step 3 Button */}
          <button
            onClick={() => triggerScenario('WT_BEARING_DEGRADATION')}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 border transition-all text-xs ${
              activeScenario === 'WT_BEARING_DEGRADATION'
                ? 'bg-rose-600 text-white border-rose-400 shadow-glow-rose'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-rose-400" />
            <span>Simulate WT-021 Bearing Degradation (Step 3)</span>
          </button>

          {/* Additional Scenarios Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 font-medium"
            >
              <span>More Scenarios</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 glass-panel border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                <button
                  onClick={() => { triggerScenario('SOLAR_INVERTER_FAULT'); setIsOpen(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-xs flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>INV-042 Inverter Thermal Fault</span>
                </button>
                <button
                  onClick={() => { triggerScenario('CLOUD_COVER_DROP'); setIsOpen(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-xs flex items-center gap-2"
                >
                  <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Monsoon Cloud Cover Drop</span>
                </button>
                <button
                  onClick={() => { triggerScenario('HIGH_WIND_SURGE'); setIsOpen(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-xs flex items-center gap-2"
                >
                  <Wind className="w-3.5 h-3.5 text-blue-400" />
                  <span>Coastal High Wind Surge (115 MW)</span>
                </button>
                <button
                  onClick={() => { triggerScenario('GRID_DEMAND_SPIKE'); setIsOpen(false); }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 text-xs flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span>Grid Demand Spike (160 MW)</span>
                </button>
              </div>
            )}
          </div>

          {/* Reset Baseline Button */}
          <button
            onClick={resetSimulation}
            disabled={loading}
            className="px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 border border-slate-700 flex items-center gap-1 font-medium transition-all"
            title="Reset to normal baseline"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reset Baseline</span>
          </button>
        </div>

      </div>

      {lastActionMessage && (
        <div className="max-w-7xl mx-auto mt-1 flex items-center justify-between px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700 text-[11px] text-emerald-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lastActionMessage}</span>
          </div>
          <button onClick={clearMessage} className="text-slate-400 hover:text-slate-200 text-xs font-bold">×</button>
        </div>
      )}
    </div>
  );
};

export default SimulationBanner;
