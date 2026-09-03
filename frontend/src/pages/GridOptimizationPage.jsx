import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  BatteryCharging, 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  Cpu, 
  ArrowRight, 
  Activity, 
  CheckCircle2, 
  Leaf, 
  Coins,
  RefreshCw
} from 'lucide-react';
import { gridService } from '../services/api';
import MetricCard from '../components/common/MetricCard';
import { useTelemetry } from '../context/TelemetryContext';

const GridOptimizationPage = () => {
  const { telemetry } = useTelemetry();
  const [gridStatus, setGridStatus] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGridData = () => {
    setLoading(true);
    Promise.all([
      gridService.getGridStatus(),
      gridService.getRecommendations()
    ]).then(([statusRes, recRes]) => {
      setGridStatus(statusRes.data || null);
      setRecommendation(recRes.data || null);
      setLoading(false);
    }).catch((e) => {
      console.error("Grid load error", e);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchGridData();
  }, [telemetry]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-emerald-400" />
            <span>Grid Integration & BESS Dispatch Optimization</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time balance between renewable park generation, Gujarat SLDC demand, and Battery Storage dispatch.
          </p>
        </div>

        <button
          onClick={fetchGridData}
          className="p-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Re-optimize Dispatch</span>
        </button>
      </div>

      {/* Grid Key Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        <MetricCard
          title="Renewable Supply"
          value={gridStatus?.renewable_supply_mw?.toFixed(1) || telemetry.total_generation_mw.toFixed(1)}
          unit="MW"
          delta="Solar + Wind Total"
          deltaType="positive"
          subtext="Active Parks"
          icon={Zap}
          accentColor="emerald"
        />

        <MetricCard
          title="Grid Demand (SLDC)"
          value={gridStatus?.grid_demand_mw?.toFixed(1) || telemetry.grid_demand_mw.toFixed(1)}
          unit="MW"
          delta="Gujarat-SLDC-West"
          deltaType="positive"
          subtext="Base commitment"
          icon={TrendingUp}
          accentColor="cyan"
        />

        <MetricCard
          title="Net Grid Export"
          value={gridStatus?.grid_import_export_mw?.toFixed(1) || (telemetry.total_generation_mw - telemetry.grid_demand_mw).toFixed(1)}
          unit="MW"
          delta="Surplus Export"
          deltaType="positive"
          subtext="Western Interconnect"
          icon={GitBranch}
          accentColor="purple"
        />

        <MetricCard
          title="Battery Storage SoC"
          value={gridStatus?.battery_current_soc_pct?.toFixed(1) || telemetry.battery_soc_pct.toFixed(1)}
          unit="%"
          delta={`Charging: ${gridStatus?.battery_charge_discharge_rate_mw || 12.0} MW`}
          deltaType="positive"
          subtext="40 MWh Capacity"
          icon={BatteryCharging}
          accentColor="emerald"
        />

      </div>

      {/* Main AI Simulated Recommendation Card (Spec Requirement 22) */}
      {recommendation && (
        <div className="glass-panel-glow p-6 rounded-2xl border border-emerald-500/40 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
                <Cpu className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  AI SIMULATED DISPATCH DIRECTIVE
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {recommendation.action_title}
                </h3>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              Strategy: {recommendation.strategy}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-dark-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono">
            {recommendation.granite_reasoning}
          </div>

          {/* Environmental & Financial Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-dark-900 border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Estimated CO₂ Avoided Today</p>
                <p className="text-sm font-bold font-mono text-emerald-400">{recommendation.co2_saved_tons_today} Metric Tons</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-dark-900 border border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Estimated PPA Revenue (GUVNL)</p>
                <p className="text-sm font-bold font-mono text-amber-400">₹{recommendation.estimated_revenue_inr.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800">
            <span>* Simulated decision support feature adhering to SLDC Indian Electricity Grid Code (IEGC).</span>
            <span className="text-emerald-400 font-semibold">Grid Frequency: 50.02 Hz (Nominal)</span>
          </div>

        </div>
      )}

    </div>
  );
};

export default GridOptimizationPage;
