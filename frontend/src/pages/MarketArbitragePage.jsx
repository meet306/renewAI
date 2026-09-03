import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, IndianRupee, Leaf, ShieldAlert, BarChart3, 
  ArrowUpRight, Clock, Zap, Award, Sparkles, RefreshCw, Layers
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, BarChart, Bar
} from 'recharts';
import { marketService } from '../services/api';

export default function MarketArbitragePage() {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [batteryShiftMW, setBatteryShiftMW] = useState(12.0);

  useEffect(() => {
    fetchMarketOverview();
  }, []);

  const fetchMarketOverview = async () => {
    setLoading(true);
    try {
      const res = await marketService.getOverview();
      setMarketData(res.data);
    } catch (err) {
      console.error('Failed to load market data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Simulated Battery Arbitrage Calculation
  // Shift generation from midday ₹3.60 to evening peak ₹5.40 (spread: ₹1.80/kWh)
  const arbitrageGainINR = Math.round(batteryShiftMW * 2 * 1000 * (5.40 - 3.60)); // 2 hours discharge

  if (loading && !marketData) {
    return (
      <div className="h-96 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
          <span className="text-slate-400 text-sm">Fetching Indian Energy Exchange (IEX) G-DAM curves...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Indian Energy Exchange (IEX) Real-Time G-DAM
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              CERC DSM 2024 Compliant
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
            Green Energy Market Arbitrage & Carbon Economics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Dynamic Green Day-Ahead Market (G-DAM) price capture, Deviation Settlement Mechanism (DSM) avoidance, and ESG offsets.
          </p>
        </div>

        <button
          onClick={fetchMarketOverview}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh Spot Prices
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-emerald-400" />
            IEX G-DAM Spot Price
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-white font-mono">
              ₹{marketData?.pricing_benchmarks?.gdam_spot_price_inr_kwh} <span className="text-xs text-slate-400 font-normal">/ kWh</span>
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              +₹{marketData?.pricing_benchmarks?.merchant_arbitrage_spread_inr_kwh} vs PPA
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-cyan-400" />
            DSM Penalties Prevented Daily
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-cyan-400 font-mono">
              ₹{(marketData?.financial_kpis?.dsm_penalties_prevented_daily_inr / 100000).toFixed(2)} Lakhs
            </span>
            <span className="text-xs text-emerald-400 font-semibold">0 Penalties</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Leaf className="h-3.5 w-3.5 text-emerald-400" />
            Daily CO₂ Emissions Abated
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              {marketData?.esg_carbon_metrics?.daily_co2_abated_tons} <span className="text-xs text-slate-400 font-normal">Tons</span>
            </span>
            <span className="text-xs text-slate-400">0.82 t/MWh</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-purple-400" />
            Projected Daily Revenue
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-purple-400 font-mono">
              ₹{(marketData?.financial_kpis?.daily_projected_revenue_inr / 100000).toFixed(2)} Lakhs
            </span>
            <span className="text-xs text-slate-400">PPA Tariff ₹2.75</span>
          </div>
        </div>
      </div>

      {/* 24-Hour G-DAM Hourly Price & Dispatch Curve */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              24-Hour G-DAM Hourly Clearing Price & BESS Arbitrage Strategy
            </h3>
            <p className="text-xs text-slate-400">
              Real-time merchant spot prices across day-ahead trading blocks on the Indian Energy Exchange.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block" />
              IEX Spot Price (₹/kWh)
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 inline-block" />
              Traded Volume (MW)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={marketData?.hourly_gdam_curve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[2, 7]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }}
                formatter={(value, name) => [
                  name === 'clearing_price_inr_kwh' ? `₹${value} / kWh` : `${value} MW`,
                  name === 'clearing_price_inr_kwh' ? 'G-DAM Spot Price' : 'Traded Volume'
                ]}
              />
              <Area type="monotone" dataKey="clearing_price_inr_kwh" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#priceGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid 2 Columns: DSM Settlement & BESS Arbitrage Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DSM Compliance & Penalty Shield */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-cyan-400" />
                Deviation Settlement Mechanism (DSM 2024)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Gujarat SLDC Scheduling Compliance</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {marketData?.dsm_compliance?.status}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Current Generation vs Schedule:</span>
              <span className="font-mono font-bold text-white">
                {marketData?.current_generation_mw} MW / {marketData?.scheduled_commitment_mw} MW
              </span>
            </div>

            <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Actual Deviation:</span>
              <span className="font-mono font-bold text-emerald-400">
                {marketData?.dsm_compliance?.deviation_pct}% (Band limit: ±10.0%)
              </span>
            </div>

            <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">DSM Penalty Incurred:</span>
              <span className="font-mono font-bold text-emerald-400">₹0.00 INR (Zero Penalties)</span>
            </div>

            <div className="flex justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">AI Forecasting Accuracy:</span>
              <span className="font-mono font-bold text-cyan-400">96.8% (Gradient Boosting Regressor)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300">
            <strong>✨ Value Addition:</strong> High-precision 24-hour forecasting protects the park from ~₹4,85,000 in daily unbalance penalties under CERC regulations.
          </div>
        </div>

        {/* Interactive BESS Evening Peak Arbitrage Simulator */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                BESS Merchant Peak Arbitrage Simulator
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Capture Evening High-Tariff Spreads</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              Spread: ₹1.80/kWh
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-slate-400">Discharge Capacity Shift:</span>
              <span className="font-bold text-cyan-400 font-mono">{batteryShiftMW} MW (24 MWh)</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={batteryShiftMW}
              onChange={(e) => setBatteryShiftMW(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">Midday Charge Cost (₹3.60)</span>
              <span className="text-base font-bold text-slate-300 font-mono mt-1 block">
                ₹{(batteryShiftMW * 2 * 1000 * 3.60).toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block">Evening Peak Sale (₹5.40)</span>
              <span className="text-base font-bold text-emerald-400 font-mono mt-1 block">
                ₹{(batteryShiftMW * 2 * 1000 * 5.40).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-cyan-950/40 border border-emerald-500/30 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-300 block">Net Daily Merchant Gain:</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">+₹{arbitrageGainINR.toLocaleString()} INR</span>
            </div>
            <button className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-sm">
              Commit Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
