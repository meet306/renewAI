import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  Activity, 
  TrendingDown, 
  Sun, 
  Wind, 
  Zap, 
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { assetsService, energyService } from '../services/api';
import MetricCard from '../components/common/MetricCard';

const PerformancePage = ({ onInspectAsset }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assetsService.getAssets().then((res) => {
      setAssets(res.data || []);
      setLoading(false);
    }).catch((e) => {
      console.error("Assets performance load error", e);
      setLoading(false);
    });
  }, []);

  const underperforming = assets.filter(a => a.status !== 'healthy' || a.performance_ratio < 0.88);

  const performanceDistribution = [
    { name: '95-100% PR', count: assets.filter(a => a.performance_ratio >= 0.95).length, fill: '#10B981' },
    { name: '90-95% PR', count: assets.filter(a => a.performance_ratio >= 0.90 && a.performance_ratio < 0.95).length, fill: '#06B6D4' },
    { name: '80-90% PR', count: assets.filter(a => a.performance_ratio >= 0.80 && a.performance_ratio < 0.90).length, fill: '#F59E0B' },
    { name: '<80% PR', count: assets.filter(a => a.performance_ratio < 0.80).length, fill: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Gauge className="w-5 h-5 text-emerald-400" />
            <span>Asset Performance Ratio (PR) & Loss Analytics</span>
          </h2>
          <p className="text-xs text-slate-400">
            Automated degradation quantification, thermal derating indices, and Expected vs Actual generation deficit.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Fleet Mean PR"
          value="93.8"
          unit="%"
          delta="↑ 0.4% vs 7-day"
          deltaType="positive"
          subtext="Target: 92.0%"
          icon={Gauge}
          accentColor="emerald"
        />
        <MetricCard
          title="Underperforming Assets"
          value={underperforming.length}
          unit="Units"
          delta="WT-021 & INV-042"
          deltaType="negative"
          subtext="Requires inspection"
          icon={TrendingDown}
          accentColor="rose"
        />
        <MetricCard
          title="Avoidable Loss"
          value="1.8"
          unit="MW"
          delta="Bearing/Thermal loss"
          deltaType="negative"
          subtext="Estimated 43 MWh/day"
          icon={Zap}
          accentColor="amber"
        />
      </div>

      {/* Performance Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Fleet Performance Ratio Distribution
          </h3>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#10192C', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" name="Number of Assets" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Underperforming Assets List */}
        <div className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            Flagged Underperforming Assets
          </h3>
          <p className="text-xs text-slate-400 mb-3">Identified by Performance Monitoring Agent</p>

          <div className="space-y-2.5">
            {underperforming.map((a) => (
              <div 
                key={a.id}
                onClick={() => onInspectAsset(a.asset_code)}
                className="p-3.5 rounded-xl bg-dark-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${a.asset_type === 'wind_turbine' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {a.asset_type === 'wind_turbine' ? <Wind className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-mono font-bold text-white text-xs">{a.asset_code}</span>
                    <p className="text-[11px] text-slate-400">{a.park_name} • {a.region}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-rose-400 text-xs">PR: {((a.performance_ratio || 0.8) * 100).toFixed(1)}%</span>
                  <p className="text-[10px] text-slate-400">{a.current_power_kw} kW / {a.expected_power_kw} kW</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default PerformancePage;
