import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Cpu, 
  Calendar, 
  ArrowRight, 
  TrendingDown,
  RefreshCw,
  Search
} from 'lucide-react';
import { maintenanceService, agentService } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import { useTelemetry } from '../context/TelemetryContext';

const PredictiveMaintenancePage = ({ onInspectAsset }) => {
  const { telemetry } = useTelemetry();
  const [risks, setRisks] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssetForExplanation, setSelectedAssetForExplanation] = useState(null);
  const [explanationText, setExplanationText] = useState('');
  const [explainingLoading, setExplainingLoading] = useState(false);

  const fetchMaintenanceData = () => {
    setLoading(true);
    Promise.all([
      maintenanceService.getRisks(),
      maintenanceService.getRecords()
    ]).then(([risksRes, recordsRes]) => {
      setRisks(risksRes.data || []);
      setRecords(recordsRes.data || []);
      setLoading(false);
    }).catch((e) => {
      console.error("Maintenance load error", e);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchMaintenanceData();
  }, [telemetry]);

  const handleExplainRisk = async (assetCode) => {
    setSelectedAssetForExplanation(assetCode);
    setExplainingLoading(true);
    try {
      const res = await agentService.query(`Why is ${assetCode} ranked at its current risk level and what is the ML evidence?`);
      setExplanationText(res.data?.granite_reasoning || res.data?.answer);
    } catch (e) {
      setExplanationText("Error fetching Granite explanation.");
    } finally {
      setExplainingLoading(false);
    }
  };

  const criticalCount = risks.filter(r => r.risk_level === 'Critical').length;
  const highCount = risks.filter(r => r.risk_level === 'High').length;
  const mediumCount = risks.filter(r => r.risk_level === 'Medium').length;
  const lowCount = risks.filter(r => r.risk_level === 'Low').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-400" />
            <span>Predictive Maintenance & Fleet Health Hub</span>
          </h2>
          <p className="text-xs text-slate-400">
            Random Forest & Gradient Boosting ML models predicting component failures and remaining useful life (RUL).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMaintenanceData}
            className="p-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh Models</span>
          </button>
        </div>
      </div>

      {/* 4 Risk Category Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        <div className="glass-panel p-4 rounded-xl border border-rose-500/30 bg-rose-500/5">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Critical Risk</span>
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">{criticalCount}</span>
            <span className="text-xs text-rose-300">&gt;75% Probability</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Requires 48h field dispatch</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            High Risk
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">{highCount}</span>
            <span className="text-xs text-amber-300">50-75% Probability</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Schedule within 5 days</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            Medium Risk
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">{mediumCount}</span>
            <span className="text-xs text-blue-300">25-50% Probability</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Active trend monitoring</p>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            Low Risk (Nominal)
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">{lowCount}</span>
            <span className="text-xs text-emerald-300">&lt;25% Probability</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Standard periodic audit</p>
        </div>

      </div>

      {/* Main Table: Fleet Failure Risk Matrix */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Fleet Predictive Failure Matrix & Ranked Assets
            </h3>
            <p className="text-xs text-slate-400">Ranked by Machine Learning Failure Probability (%)</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Asset Code</th>
                <th className="px-4 py-3">Location & Park</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Failure Prob. (ML)</th>
                <th className="px-4 py-3">Predicted RUL</th>
                <th className="px-4 py-3">Primary Sensor Anomaly</th>
                <th className="px-4 py-3">System Recommendation</th>
                <th className="px-4 py-3 text-right">Cognitive Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
              {risks.slice(0, 10).map((r) => {
                const isCrit = r.risk_level === 'Critical';
                const isHigh = r.risk_level === 'High';

                return (
                  <tr 
                    key={r.asset_id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isCrit ? 'bg-rose-500/10' : (isHigh ? 'bg-amber-500/5' : '')
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-white flex items-center gap-1.5">
                      <button 
                        onClick={() => onInspectAsset(r.asset_code)}
                        className="hover:underline text-emerald-400"
                      >
                        {r.asset_code}
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-slate-200">{r.park_name}</p>
                      <span className="text-[10px] text-cyan-400">{r.region}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isCrit ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        (isHigh ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        (r.risk_level === 'Medium' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'))
                      }`}>
                        {r.risk_level}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <span className={`text-sm font-bold ${isCrit ? 'text-rose-400' : (isHigh ? 'text-amber-400' : 'text-slate-300')}`}>
                        {r.failure_probability_pct}%
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-200 font-semibold">
                      {r.predicted_rul_days} Days
                    </td>

                    <td className="px-4 py-3 text-slate-300">
                      {r.primary_sensor_anomaly}
                    </td>

                    <td className="px-4 py-3 text-slate-300 max-w-xs truncate" title={r.recommendation}>
                      {r.recommendation}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleExplainRisk(r.asset_code)}
                        className="px-2.5 py-1 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>AI Explain</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* IBM Granite Explanation Modal / Drawer */}
      {selectedAssetForExplanation && (
        <div className="glass-panel-glow p-5 rounded-2xl border border-purple-500/40 space-y-3">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400 animate-pulse" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                IBM Granite Root-Cause Explanation for {selectedAssetForExplanation}
              </h4>
            </div>
            <button
              onClick={() => setSelectedAssetForExplanation(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕ Close
            </button>
          </div>

          {explainingLoading ? (
            <div className="py-6 text-center text-xs text-purple-300">
              <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Generating grounded cognitive explanation...</span>
            </div>
          ) : (
            <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
              {explanationText}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default PredictiveMaintenancePage;
