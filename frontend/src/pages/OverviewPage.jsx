import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Wind, 
  Zap, 
  Gauge, 
  AlertTriangle, 
  BatteryCharging, 
  TrendingUp, 
  ShieldCheck, 
  ArrowUpRight,
  Activity,
  MapPin,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import MetricCard from '../components/common/MetricCard';
import StatusBadge from '../components/common/StatusBadge';
import GujaratAssetMap from '../components/map/GujaratAssetMap';
import { useTelemetry } from '../context/TelemetryContext';
import { energyService, parksService, alertsService } from '../services/api';

const OverviewPage = ({ onNavigate, onInspectAsset }) => {
  const { telemetry } = useTelemetry();
  const [historyData, setHistoryData] = useState([]);
  const [parks, setParks] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      energyService.getGenerationHistory(12),
      parksService.getParks(),
      alertsService.getAlerts({ severity: 'CRITICAL', is_acknowledged: false })
    ]).then(([histRes, parksRes, alertsRes]) => {
      setHistoryData(histRes.data || []);
      setParks(parksRes.data || []);
      setCriticalAlerts(alertsRes.data || []);
      setLoading(false);
    }).catch((err) => {
      console.error("Overview data load error", err);
      setLoading(false);
    });
  }, [telemetry]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome & Grid Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Renewable Energy Operations Cockpit
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time hybrid solar-wind operational telemetry across Kutch & Banaskantha parks in Gujarat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-800 flex items-center gap-2">
            <span className="text-slate-400">SLDC Grid Status:</span>
            <span className="font-semibold text-emerald-400">Synchronous Normal (50.02 Hz)</span>
          </div>
          <button
            onClick={() => onNavigate('ai')}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5 shadow-glow-purple transition-all"
          >
            <span>Ask IBM Granite AI</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 9 Core KPI Cards (Spec Requirement: Solar 82 MW, Wind 46 MW, Total 128 MW, Efficiency 91%) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        
        <MetricCard
          title="Total Generation"
          value={telemetry.total_generation_mw.toFixed(1)}
          unit="MW"
          delta="128.0 MW target"
          deltaType="positive"
          subtext="Active output"
          icon={Zap}
          accentColor="emerald"
          badge="LIVE"
        />

        <MetricCard
          title="Solar Generation"
          value={telemetry.solar_mw.toFixed(1)}
          unit="MW"
          delta="↑ 8.4%"
          deltaType="positive"
          subtext="GHI 885 W/m²"
          icon={Sun}
          accentColor="amber"
        />

        <MetricCard
          title="Wind Generation"
          value={telemetry.wind_mw.toFixed(1)}
          unit="MW"
          delta="↓ 2.1%"
          deltaType="negative"
          subtext="Wind 8.4 m/s"
          icon={Wind}
          accentColor="cyan"
        />

        <MetricCard
          title="Park Efficiency"
          value={telemetry.park_efficiency_pct.toFixed(1)}
          unit="%"
          delta="Target: >90%"
          deltaType="positive"
          subtext="Fleet health 96%"
          icon={Gauge}
          accentColor="blue"
        />

        <MetricCard
          title="Grid Demand"
          value={telemetry.grid_demand_mw.toFixed(1)}
          unit="MW"
          delta={`Export: +${(telemetry.total_generation_mw - telemetry.grid_demand_mw).toFixed(1)} MW`}
          deltaType="positive"
          subtext="SLDC Schedule"
          icon={TrendingUp}
          accentColor="purple"
        />

        <MetricCard
          title="Battery SoC"
          value={telemetry.battery_soc_pct.toFixed(1)}
          unit="%"
          delta="Mode: Charging"
          deltaType="positive"
          subtext="40 MWh BESS"
          icon={BatteryCharging}
          accentColor="emerald"
        />

      </div>

      {/* Critical Alarms Callout Bar (If active) */}
      {criticalAlerts.length > 0 && (
        <div className="glass-panel p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500 text-white animate-bounce">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                Critical Alert Detected: {criticalAlerts[0].title}
              </p>
              <p className="text-xs text-slate-300 line-clamp-1">
                {criticalAlerts[0].message}
              </p>
            </div>
          </div>
          <button
            onClick={() => onInspectAsset(criticalAlerts[0].asset_code || 'WT-021')}
            className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold whitespace-nowrap"
          >
            Investigate Root Cause →
          </button>
        </div>
      )}

      {/* Main Charts & Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Live Power Curve & Generation Splits (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Generation Timeline Chart */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Power Dispatch Curve (Last 12 Hours)</span>
                </h3>
                <p className="text-xs text-slate-400">Total Solar vs Wind Generation compared against SLDC Demand</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-dark-900 border border-slate-700 text-slate-300 font-mono">
                INTERVAL: 1-HR
              </span>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(str) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    stroke="#64748B"
                    fontSize={11}
                  />
                  <YAxis stroke="#64748B" fontSize={11} unit=" MW" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#10192C', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    labelFormatter={(str) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="solar_generation_mw" 
                    name="Solar (MW)" 
                    stroke="#F59E0B" 
                    fillOpacity={1} 
                    fill="url(#colorSolar)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="wind_generation_mw" 
                    name="Wind (MW)" 
                    stroke="#06B6D4" 
                    fillOpacity={1} 
                    fill="url(#colorWind)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Park Capacity Breakdown Bars */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              Park Generation & Fleet Distribution
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {parks.map((p) => (
                <div key={p.id} className="p-3.5 rounded-xl bg-dark-900 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{p.name}</span>
                    <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {p.region}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">Current Output:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{p.current_generation_mw} MW</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400 rounded-full" 
                      style={{ width: `${Math.min(100, (p.current_generation_mw / p.capacity_mw) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Capacity: {p.capacity_mw} MW</span>
                    <span>Eff: {p.efficiency_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right: GIS Asset Map (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <GujaratAssetMap 
            onSelectAsset={(code) => onInspectAsset(code)} 
            onSelectPark={() => onNavigate('fleet')}
          />

          {/* WT-021 Telemetry Live Snapshot */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-sm">WT-021</span>
                <span className="text-xs text-slate-400">(Kutch Wind Farm)</span>
              </div>
              <StatusBadge status={telemetry.wt_021.status} size="sm" />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-dark-900 border border-slate-800">
                <p className="text-[10px] text-slate-400 mb-0.5">Power</p>
                <p className="font-mono font-bold text-white">{telemetry.wt_021.power_kw} kW</p>
              </div>
              <div className="p-2 rounded-lg bg-dark-900 border border-slate-800">
                <p className="text-[10px] text-slate-400 mb-0.5">Vibration</p>
                <p className={`font-mono font-bold ${telemetry.wt_021.vibration_mms > 3.0 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {telemetry.wt_021.vibration_mms} mm/s
                </p>
              </div>
              <div className="p-2 rounded-lg bg-dark-900 border border-slate-800">
                <p className="text-[10px] text-slate-400 mb-0.5">Bearing Temp</p>
                <p className={`font-mono font-bold ${telemetry.wt_021.bearing_temp_c > 70.0 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {telemetry.wt_021.bearing_temp_c}°C
                </p>
              </div>
            </div>

            <button
              onClick={() => onInspectAsset('WT-021')}
              className="mt-3 w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1"
            >
              <span>Inspect Full Asset Telemetry & Diagnostics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default OverviewPage;
