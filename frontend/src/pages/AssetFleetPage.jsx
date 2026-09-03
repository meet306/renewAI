import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Wind, 
  Sun, 
  Layers, 
  Activity, 
  ChevronRight, 
  AlertOctagon,
  RefreshCw
} from 'lucide-react';
import { assetsService, parksService } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import { useTelemetry } from '../context/TelemetryContext';

const AssetFleetPage = ({ onInspectAsset }) => {
  const { telemetry } = useTelemetry();
  const [assets, setAssets] = useState([]);
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const fetchFleet = () => {
    setLoading(true);
    Promise.all([
      assetsService.getAssets(),
      parksService.getParks()
    ]).then(([assetsRes, parksRes]) => {
      setAssets(assetsRes.data || []);
      setParks(parksRes.data || []);
      setLoading(false);
    }).catch((e) => {
      console.error("Fleet load error", e);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchFleet();
  }, [telemetry]);

  const filteredAssets = assets.filter((a) => {
    const matchesSearch = a.asset_code.toLowerCase().includes(search.toLowerCase()) ||
                          a.manufacturer.toLowerCase().includes(search.toLowerCase()) ||
                          (a.park_name && a.park_name.toLowerCase().includes(search.toLowerCase()));
    const matchesRegion = selectedRegion === 'ALL' || a.region === selectedRegion;
    const matchesType = selectedType === 'ALL' || a.asset_type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
    return matchesSearch && matchesRegion && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>Renewable Fleet Telemetry Explorer</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time multi-asset health indices, active kilowatt outputs, and predictive failure risks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFleet}
            className="p-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1.5"
            title="Refresh Fleet Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-300 font-mono">
            Total Assets: <strong className="text-white">{assets.length}</strong>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search asset code (WT-021, INV-042)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-dark-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
          />
        </div>

        {/* Region Filter */}
        <div>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="ALL">All Regions (Kutch & Banaskantha)</option>
            <option value="Kutch">Kutch Region</option>
            <option value="Banaskantha">Banaskantha Region</option>
          </select>
        </div>

        {/* Asset Type Filter */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="ALL">All Asset Types</option>
            <option value="wind_turbine">Wind Turbines</option>
            <option value="solar_inverter">Solar Inverters</option>
            <option value="solar_string">Solar String Arrays</option>
            <option value="bess">Battery Storage (BESS)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="healthy">Healthy Only</option>
            <option value="warning">Warning Only</option>
            <option value="critical">Critical Only</option>
          </select>
        </div>

      </div>

      {/* Fleet Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Asset Code</th>
                <th className="px-4 py-3">Type & Model</th>
                <th className="px-4 py-3">Park & Region</th>
                <th className="px-4 py-3">Current Power</th>
                <th className="px-4 py-3">Health Score</th>
                <th className="px-4 py-3">Failure Risk</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
              {filteredAssets.map((asset) => {
                const isCritical = asset.status === 'critical' || asset.failure_probability_pct > 75;
                const isWarning = asset.status === 'warning' || (asset.failure_probability_pct > 35 && asset.failure_probability_pct <= 75);

                return (
                  <tr 
                    key={asset.id} 
                    className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                      isCritical ? 'bg-rose-500/5' : (isWarning ? 'bg-amber-500/5' : '')
                    }`}
                    onClick={() => onInspectAsset(asset.asset_code)}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-white flex items-center gap-2">
                      {asset.asset_type === 'wind_turbine' ? (
                        <Wind className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-400" />
                      )}
                      <span>{asset.asset_code}</span>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-slate-200">{asset.manufacturer}</p>
                      <p className="text-[10px] text-slate-400">Cap: {asset.capacity_kw} kW</p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-slate-200">{asset.park_name}</p>
                      <span className="text-[10px] font-semibold text-cyan-400">{asset.region}</span>
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <span className="text-white font-bold">{asset.current_power_kw}</span>
                      <span className="text-slate-400 text-[10px]"> / {asset.expected_power_kw} kW</span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200">{asset.health_score}%</span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              asset.health_score > 85 ? 'bg-emerald-400' : (asset.health_score > 60 ? 'bg-amber-400' : 'bg-rose-500')
                            }`}
                            style={{ width: `${asset.health_score}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isCritical 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                          : (isWarning ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400')
                      }`}>
                        {asset.failure_probability_pct}%
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={asset.status} size="sm" />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onInspectAsset(asset.asset_code); }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AssetFleetPage;
