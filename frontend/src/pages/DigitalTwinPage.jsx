import React, { useState, useEffect } from 'react';
import { 
  Activity, Cpu, Disc, AlertTriangle, CheckCircle2, 
  Layers, Gauge, Thermometer, Wind, Sun, RefreshCw, Zap, ShieldCheck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, ReferenceLine
} from 'recharts';
import { digitalTwinService } from '../services/api';

export default function DigitalTwinPage() {
  const [activeTab, setActiveTab] = useState('wind'); // 'wind' | 'solar'
  const [turbineCode, setTurbineCode] = useState('WT-021');
  const [inverterCode, setInverterCode] = useState('INV-042');
  const [turbineData, setTurbineData] = useState(null);
  const [inverterData, setInverterData] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState('main_bearing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTwinData();
  }, [activeTab, turbineCode, inverterCode]);

  const fetchTwinData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'wind') {
        const res = await digitalTwinService.getTurbineTwin(turbineCode);
        setTurbineData(res.data);
      } else {
        const res = await digitalTwinService.getInverterTwin(inverterCode);
        setInverterData(res.data);
      }
    } catch (err) {
      console.error('Failed to load digital twin data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Physics-Informed Real-Time Digital Twin
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              FFT Harmonic Spectrum Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-cyan-400" />
            Asset Digital Twin & Physics Telemetry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sub-assembly drive-train finite stress modeling, raceway fault harmonics (BPFO/BPFI), and oil chemistry tracking.
          </p>
        </div>

        {/* Tab Switcher & Asset Selector */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800/90 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setActiveTab('wind')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'wind' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wind className="h-4 w-4" />
              Wind Turbine ({turbineCode})
            </button>
            <button
              onClick={() => setActiveTab('solar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'solar' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="h-4 w-4" />
              Solar Inverter ({inverterCode})
            </button>
          </div>

          <button
            onClick={fetchTwinData}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !turbineData && !inverterData ? (
        <div className="h-96 flex items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
            <span className="text-slate-400 text-sm">Computing finite element drive-train physics...</span>
          </div>
        </div>
      ) : activeTab === 'wind' && turbineData ? (
        <>
          {/* Main Anomaly / Defect Banner */}
          {turbineData.is_anomalous && (
            <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-4 flex items-start gap-4">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-rose-300 text-base">
                    Active Mechanical Bearing Fault Detected: {turbineData.primary_defect.component}
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {turbineData.primary_defect.urgency}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-1">
                  Defect: <strong className="text-white">{turbineData.primary_defect.defect_type}</strong> | Characteristic Harmonic: <strong className="text-rose-400">{turbineData.primary_defect.characteristic_frequency}</strong> | Thermal Runaway: <strong className="text-rose-400">{turbineData.primary_defect.thermal_differential}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Drive-train Visualizer & Selected Component Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Drive-Train Assembly Schematic */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Disc className="h-5 w-5 text-cyan-400" />
                  Suzlon S120 Drive-Train Sub-Assemblies
                </h2>
                <span className="text-xs text-slate-400">Click component to inspect telemetry</span>
              </div>

              {/* Interactive Schematic Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-4">
                {turbineData.drive_train.map((comp) => {
                  const isSelected = selectedComponent === comp.id;
                  const isCrit = comp.status === 'Critical';
                  const isWarn = comp.status === 'Warning';
                  return (
                    <button
                      key={comp.id}
                      onClick={() => setSelectedComponent(comp.id)}
                      className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                        isSelected 
                          ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-950/50' 
                          : isCrit 
                            ? 'border-rose-500/50 bg-rose-950/20 hover:border-rose-400' 
                            : isWarn 
                              ? 'border-amber-500/50 bg-amber-950/20 hover:border-amber-400' 
                              : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isCrit ? 'bg-rose-500/20 text-rose-300' : isWarn ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {comp.status}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{comp.health_pct}%</span>
                      </div>
                      <h4 className="font-semibold text-white text-sm line-clamp-2">{comp.name}</h4>
                      {isCrit && (
                        <div className="mt-2 text-xs text-rose-400 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Anomaly active
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Detailed Component Inspector */}
              {(() => {
                const comp = turbineData.drive_train.find(c => c.id === selectedComponent) || turbineData.drive_train[1];
                return (
                  <div className="mt-6 bg-slate-950/60 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                      <div>
                        <h3 className="font-bold text-white text-base flex items-center gap-2">
                          <Layers className="h-4 w-4 text-cyan-400" />
                          {comp.name} Telemetry & Physics State
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{comp.physics_state}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        comp.status === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                        comp.status === 'Warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        Health: {comp.health_pct}% ({comp.status})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {Object.entries(comp.metrics).map(([key, val]) => (
                        <div key={key} className="bg-slate-900/90 rounded-lg p-3 border border-slate-800">
                          <span className="text-xs text-slate-400 block">{key}</span>
                          <span className="text-sm font-bold text-white mt-1 block font-mono">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Gearbox Oil Chemistry */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-amber-400" />
                    Lubrication Oil Chemistry
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    ISO VG 320
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  {turbineData.oil_chemistry.lubricant_type}
                </p>

                <div className="space-y-3">
                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-400 block">Kinematic Viscosity (40°C)</span>
                      <span className="text-xs font-semibold text-amber-400">{turbineData.oil_chemistry.viscosity_status}</span>
                    </div>
                    <span className="text-base font-mono font-bold text-white">
                      {turbineData.oil_chemistry.oil_viscosity_cst} cSt
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-400 block">Moisture Content</span>
                      <span className="text-xs text-slate-500">Threshold: &lt;50 ppm</span>
                    </div>
                    <span className={`text-base font-mono font-bold ${turbineData.oil_chemistry.moisture_ppm > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {turbineData.oil_chemistry.moisture_ppm} ppm
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-400 block">ISO 4406 Cleanliness</span>
                      <span className="text-xs text-slate-500">Solid Particulates</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded">
                      {turbineData.oil_chemistry.particle_count_iso4406}
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-400 block">Ferrous Wear Debris</span>
                      <span className="text-xs text-slate-500">Acoustic wear particles</span>
                    </div>
                    <span className={`text-base font-mono font-bold ${turbineData.oil_chemistry.ferrous_debris_ppm > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {turbineData.oil_chemistry.ferrous_debris_ppm} ppm
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-slate-400">Remaining Lubricant Life</span>
                  <span className="font-bold text-amber-400">{turbineData.oil_chemistry.remaining_oil_life_pct}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full ${turbineData.oil_chemistry.remaining_oil_life_pct < 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${turbineData.oil_chemistry.remaining_oil_life_pct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FFT Vibration Spectrum Chart */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  Fast Fourier Transform (FFT) Vibration Harmonics Spectrum
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time acceleration amplitude across 0–200 Hz frequency domain with raceway defect markers.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 inline-block" />
                  Velocity RMS (mm/s)
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400 inline-block" />
                  BPFO Defect Peak (84.2 Hz)
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={turbineData.fft_spectrum} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fftGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="frequency_hz" 
                    stroke="#64748b" 
                    tickFormatter={(v) => `${v} Hz`}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fontSize: 11 }}
                    domain={[0, 6]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }}
                    formatter={(value, name, props) => [
                      `${value} mm/s`,
                      props.payload.fault_label || 'Harmonic Amplitude'
                    ]}
                    labelFormatter={(label) => `Frequency: ${label} Hz`}
                  />
                  <ReferenceLine x={84} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'BPFO (84.2 Hz)', fill: '#f43f5e', fontSize: 10, position: 'top' }} />
                  <ReferenceLine x={127} stroke="#fbbf24" strokeDasharray="4 4" label={{ value: 'BPFI (126.8 Hz)', fill: '#fbbf24', fontSize: 10, position: 'top' }} />
                  <Area 
                    type="monotone" 
                    dataKey="amplitude_mms" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#fftGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : inverterData ? (
        <>
          {/* Solar Inverter MPPT Strings & IGBT Bridges */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 8-Channel MPPT String Table */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-400" />
                  Sungrow SG3125HV — 8-Channel MPPT DC Strings
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  {inverterData.derating_status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {inverterData.mppt_strings.map((str) => (
                  <div 
                    key={str.string_id}
                    className={`p-3 rounded-lg border ${
                      str.status.includes('Degraded') 
                        ? 'border-amber-500/40 bg-amber-950/20' 
                        : 'border-slate-800 bg-slate-950/60'
                    }`}
                  >
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-white">{str.string_id}</span>
                      <span className={str.status.includes('Degraded') ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                        {str.mppt_efficiency_pct}%
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-0.5 font-mono">
                      <div>V: <span className="text-slate-200">{str.voltage_v} V</span></div>
                      <div>I: <span className="text-slate-200">{str.current_a} A</span></div>
                      <div>P: <span className="text-cyan-400 font-bold">{str.power_kw} kW</span></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* I-V & P-V Characteristic Curve */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <h4 className="text-sm font-bold text-white mb-2">Simulated String I-V Characteristic Curve</h4>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={inverterData.iv_curve} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="voltage_v" stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}V`} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff' }} />
                      <Line type="monotone" dataKey="current_a" stroke="#f59e0b" strokeWidth={2} dot={false} name="Current (A)" />
                      <Line type="monotone" dataKey="power_kw" stroke="#06b6d4" strokeWidth={2} dot={false} name="Power (kW)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* IGBT Junctions & Thermal Derating */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2 mb-4">
                  <Thermometer className="h-5 w-5 text-rose-400" />
                  IGBT Bridge Junction Thermals
                </h3>

                <div className="space-y-4">
                  {inverterData.igbt_junctions.map((igbt) => (
                    <div key={igbt.phase} className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-slate-300">{igbt.phase}</span>
                        <span className={`text-xs font-bold ${igbt.status === 'Critical' ? 'text-rose-400' : 'text-amber-400'}`}>
                          {igbt.temp_c} °C ({igbt.status})
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full ${igbt.temp_c > 75 ? 'bg-rose-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(100, (igbt.temp_c / 90) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-xs p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Cooling Fan Duty</span>
                    <span className="font-bold text-cyan-400">{inverterData.cooling_fan_rpm} RPM (100%)</span>
                  </div>
                  <div className="flex justify-between text-xs p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Filter Soiling Index</span>
                    <span className="font-bold text-amber-400">{inverterData.filter_soiling_index_pct}% (High Dust)</span>
                  </div>
                  <div className="flex justify-between text-xs p-2.5 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Inversion Efficiency</span>
                    <span className="font-bold text-white">{inverterData.efficiency_pct}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-400" />
                <span>Q-Mode Reactive Power Cooling Active to alleviate bridge thermal strain.</span>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
