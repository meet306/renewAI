import React, { useState, useEffect } from 'react';
import { 
  CloudSun, 
  Sun, 
  Wind, 
  Thermometer, 
  Compass, 
  Activity, 
  Droplets, 
  Zap, 
  RefreshCw,
  Cpu
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { weatherService, forecastService } from '../services/api';

const WeatherForecastPage = () => {
  const [weatherData, setWeatherData] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchForecast = () => {
    setLoading(true);
    Promise.all([
      weatherService.getCurrentWeather(),
      forecastService.get24hForecast()
    ]).then(([wRes, fRes]) => {
      setWeatherData(wRes.data || []);
      setForecast(fRes.data || null);
      setLoading(false);
    }).catch((e) => {
      console.error("Forecast load error", e);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-amber-400" />
            <span>Meteorological Intelligence & 24h Generation Forecaster</span>
          </h2>
          <p className="text-xs text-slate-400">
            Gradient Boosting ML Regressors incorporating clear-sky GHI, cloud attenuation, and coastal Weibull wind distributions.
          </p>
        </div>

        <button
          onClick={fetchForecast}
          className="p-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Forecast</span>
        </button>
      </div>

      {/* Current Weather Cards (Kutch & Banaskantha) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {weatherData.map((w, idx) => (
          <div key={idx} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">{w.region} District</span>
                <h3 className="text-base font-bold text-white">{w.park_name}</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-dark-900 border border-slate-700 text-slate-200">
                {w.weather_condition}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="p-2.5 rounded-xl bg-dark-900 border border-slate-800">
                <p className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-rose-400" /> Temp
                </p>
                <p className="font-mono font-bold text-white text-sm">{w.temperature_c}°C</p>
              </div>

              <div className="p-2.5 rounded-xl bg-dark-900 border border-slate-800">
                <p className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">
                  <Sun className="w-3 h-3 text-amber-400" /> Solar GHI
                </p>
                <p className="font-mono font-bold text-white text-sm">{w.irradiance_wm2} W/m²</p>
              </div>

              <div className="p-2.5 rounded-xl bg-dark-900 border border-slate-800">
                <p className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" /> Wind
                </p>
                <p className="font-mono font-bold text-white text-sm">{w.wind_speed_ms} m/s</p>
              </div>

              <div className="p-2.5 rounded-xl bg-dark-900 border border-slate-800">
                <p className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-blue-400" /> Cloud
                </p>
                <p className="font-mono font-bold text-white text-sm">{w.cloud_cover_pct}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 24-Hour Forecast Summary Banner */}
      {forecast && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>24-Hour Ahead Renewable Generation Forecast ({forecast.forecast_date})</span>
              </h3>
              <p className="text-xs text-slate-400">P50 Model Inference with Confidence Bands</p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1 rounded-xl bg-dark-900 border border-slate-700 text-slate-300">
                Avg. Confidence: <strong className="text-emerald-400 font-mono">{forecast.average_confidence_pct}%</strong>
              </div>
              <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono font-bold">
                Total: {forecast.total_expected_mwh} MWh
              </div>
            </div>
          </div>

          {/* Forecast Stacked Area Chart */}
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast.hourly_forecast}>
                <defs>
                  <linearGradient id="foreSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="foreWind" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} unit=" MW" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#10192C', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area 
                  type="monotone" 
                  dataKey="solar_forecast_mw" 
                  name="Solar Forecast (MW)" 
                  stroke="#F59E0B" 
                  fillOpacity={1} 
                  fill="url(#foreSolar)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="wind_forecast_mw" 
                  name="Wind Forecast (MW)" 
                  stroke="#06B6D4" 
                  fillOpacity={1} 
                  fill="url(#foreWind)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* IBM Granite Forecasting Insights Card */}
          <div className="glass-panel-glow p-4 rounded-xl border border-purple-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-white uppercase tracking-wider">IBM Granite 24h Operational Insight</span>
            </div>
            <p className="text-slate-200 leading-relaxed font-mono">
              {forecast.granite_forecast_insights}
            </p>
          </div>

        </div>
      )}

    </div>
  );
};

export default WeatherForecastPage;
