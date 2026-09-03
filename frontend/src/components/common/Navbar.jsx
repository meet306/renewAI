import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Cpu, 
  Activity, 
  Wifi, 
  WifiOff, 
  Bell, 
  ShieldCheck, 
  MapPin,
  Clock,
  Radio,
  TrendingUp
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

const Navbar = ({ activeTab, onNavigate }) => {
  const { isConnected, criticalAlertsCount, telemetry } = useTelemetry();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const gridFreq = telemetry?.grid_frequency_hz || 50.02;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-6 py-2.5 bg-slate-950/90 backdrop-blur-md">
      <div className="flex items-center justify-between">
        
        {/* Left: Brand & Regional Context */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-purple-600 p-[1px] shadow-lg shadow-emerald-950/40">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Renew<span className="text-emerald-400">AI</span>
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>Kutch & Banaskantha Parks (Gujarat SLDC)</span>
            </p>
          </div>
        </div>

        {/* Center: Dual-Engine AI Status, Grid Frequency & IEX Ticker */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* IBM Watson Orchestrate Live Cloud Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-medium">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>IBM Watson Orchestrate</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          </div>

          {/* Grid Frequency Meter */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Grid:</span>
            <span className="font-bold text-emerald-400">{gridFreq.toFixed(2)} Hz</span>
          </div>

          {/* G-DAM Ticker */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">G-DAM:</span>
            <span className="font-bold text-slate-200">₹4.35</span>
          </div>

          {/* WebSocket Live Telemetry Indicator */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
            isConnected 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live Telemetry</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Reconnecting...</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Clock, Alerts & User Pill */}
        <div className="flex items-center gap-3">
          {/* Live IST Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{time.toLocaleTimeString('en-IN', { hour12: false })} IST</span>
          </div>

          {/* Alerts Bell Shortcut */}
          <button
            onClick={() => onNavigate('alerts')}
            className={`relative p-2 rounded-lg border transition-all ${
              criticalAlertsCount > 0 
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 hover:bg-rose-500/20' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title={`${criticalAlertsCount} Critical Alarms`}
          >
            <Bell className="w-4 h-4" />
            {criticalAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {criticalAlertsCount}
              </span>
            )}
          </button>

          {/* Operator Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
              SLDC
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <p className="font-semibold text-slate-200">Control Desk</p>
              <p className="text-[10px] text-slate-400">Gujarat Hub</p>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};

export default Navbar;
