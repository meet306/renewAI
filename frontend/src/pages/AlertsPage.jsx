import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Filter, 
  Clock, 
  ArrowRight, 
  Check,
  RefreshCw
} from 'lucide-react';
import { alertsService } from '../services/api';
import { useTelemetry } from '../context/TelemetryContext';

const AlertsPage = ({ onInspectAsset }) => {
  const { telemetry } = useTelemetry();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const fetchAlerts = () => {
    setLoading(true);
    alertsService.getAlerts().then((res) => {
      setAlerts(res.data || []);
      setLoading(false);
    }).catch((e) => {
      console.error("Alerts load error", e);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAlerts();
  }, [telemetry]);

  const handleAcknowledge = async (alertId) => {
    try {
      await alertsService.acknowledgeAlert(alertId);
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_acknowledged: true, acknowledged_at: new Date() } : a));
    } catch (e) {
      console.error("Acknowledge error", e);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Intelligent Operational Alert Center</span>
          </h2>
          <p className="text-xs text-slate-400">
            Prioritized operational alarms with automated root-cause evidence and recommended field actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-700 text-slate-200 text-xs focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">🔴 Critical Only</option>
            <option value="WARNING">🟠 Warning Only</option>
            <option value="NOTICE">🟡 Notice Only</option>
            <option value="INFO">🟢 Info Only</option>
          </select>

          <button
            onClick={fetchAlerts}
            className="p-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="space-y-3.5">
        {filteredAlerts.map((al) => {
          const isCrit = al.severity === 'CRITICAL';
          const isWarn = al.severity === 'WARNING';
          const isNotice = al.severity === 'NOTICE';

          let borderStyle = isCrit ? 'border-rose-500/40 bg-rose-500/5' :
                            (isWarn ? 'border-amber-500/40 bg-amber-500/5' :
                            (isNotice ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-emerald-500/30 bg-emerald-500/5'));

          let badgeStyle = isCrit ? 'bg-rose-500 text-white animate-pulse' :
                           (isWarn ? 'bg-amber-500 text-dark-950 font-bold' :
                           (isNotice ? 'bg-yellow-500 text-dark-950 font-bold' : 'bg-emerald-500 text-white font-bold'));

          return (
            <div key={al.id} className={`glass-panel p-5 rounded-2xl border ${borderStyle} space-y-3 transition-all`}>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${badgeStyle}`}>
                    {al.severity}
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-tight">{al.title}</h3>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(al.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST</span>
                </div>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {al.message}
              </p>

              {/* Root Cause & Suggested Action Pills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                {al.root_cause && (
                  <div className="p-3 rounded-xl bg-dark-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Root Cause Analysis</span>
                    <p className="text-slate-300">{al.root_cause}</p>
                  </div>
                )}
                {al.suggested_action && (
                  <div className="p-3 rounded-xl bg-dark-900/90 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Recommended Operator Action</span>
                    <p className="text-slate-300">{al.suggested_action}</p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <span>Target:</span>
                  <strong className="text-cyan-400 font-mono">{al.asset_code || al.park_name || 'Fleet'}</strong>
                </div>

                <div className="flex items-center gap-2">
                  {al.asset_code && (
                    <button
                      onClick={() => onInspectAsset(al.asset_code)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 text-xs"
                    >
                      <span>Inspect Asset</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!al.is_acknowledged ? (
                    <button
                      onClick={() => handleAcknowledge(al.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 text-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Acknowledged</span>
                    </span>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default AlertsPage;
