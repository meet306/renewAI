import React from 'react';
import { Map, Layers, ShieldCheck, MapPin } from 'lucide-react';
import GujaratAssetMap from '../components/map/GujaratAssetMap';

const AssetMapPage = ({ onInspectAsset, onNavigateToFleet }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Map className="w-5 h-5 text-cyan-400" />
            <span>Geospatial Renewable Asset Map (Gujarat Grid)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Interactive GIS layout of hybrid solar-wind installations in Kutch coastal belts and Banaskantha plains.
          </p>
        </div>

        <button
          onClick={onNavigateToFleet}
          className="px-3.5 py-2 rounded-xl bg-dark-900 hover:bg-dark-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
        >
          <Layers className="w-4 h-4" />
          <span>Switch to Fleet Table View</span>
        </button>
      </div>

      <div className="w-full">
        <GujaratAssetMap 
          onSelectAsset={(code) => onInspectAsset(code)}
          onSelectPark={onNavigateToFleet}
        />
      </div>
    </div>
  );
};

export default AssetMapPage;
