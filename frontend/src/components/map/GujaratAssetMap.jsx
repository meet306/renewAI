import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { parksService, assetsService } from '../../services/api';
import StatusBadge from '../common/StatusBadge';
import { Wind, Sun, Layers, ArrowRight } from 'lucide-react';

// Custom SVG map icons
const createCustomIcon = (type, status) => {
  let color = '#10B981'; // green
  if (status === 'critical') color = '#EF4444'; // red
  else if (status === 'warning') color = '#F59E0B'; // amber

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <circle cx="16" cy="16" r="14" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="2"/>
      <circle cx="16" cy="16" r="7" fill="${color}"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-map-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const GujaratAssetMap = ({ onSelectAsset, onSelectPark }) => {
  const [parks, setParks] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      parksService.getParks(),
      assetsService.getAssets()
    ]).then(([parksRes, assetsRes]) => {
      setParks(parksRes.data || []);
      setAssets(assetsRes.data || []);
      setLoading(false);
    }).catch((e) => {
      console.error("Map data load error", e);
      setLoading(false);
    });
  }, []);

  return (
    <div className="w-full h-[520px] rounded-2xl overflow-hidden glass-panel border border-slate-800 relative z-0">
      
      {/* Map Overlay Badge */}
      <div className="absolute top-3 left-3 z-[1000] glass-panel rounded-xl p-3 border border-slate-700 shadow-xl max-w-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Gujarat Renewable GIS Grid</h4>
        </div>
        <p className="text-[11px] text-slate-400">
          Real-time geospatial asset tracking across Kutch and Banaskantha districts.
        </p>
        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Nominal</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Warning</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Critical</span>
        </div>
      </div>

      <MapContainer
        center={[23.55, 70.40]}
        zoom={8}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Renewable Park Clusters */}
        {parks.map((park) => {
          let parkStatus = 'healthy';
          if (park.critical_assets_count > 0) parkStatus = 'critical';
          else if (park.warning_assets_count > 0) parkStatus = 'warning';

          return (
            <React.Fragment key={park.id}>
              {/* Coverage Area Circle */}
              <Circle
                center={[park.latitude, park.longitude]}
                radius={8000}
                pathOptions={{
                  color: parkStatus === 'critical' ? '#EF4444' : (parkStatus === 'warning' ? '#F59E0B' : '#10B981'),
                  fillColor: parkStatus === 'critical' ? '#EF4444' : (parkStatus === 'warning' ? '#F59E0B' : '#10B981'),
                  fillOpacity: 0.12,
                  weight: 1.5,
                }}
              />

              <Marker
                position={[park.latitude, park.longitude]}
                icon={createCustomIcon(park.park_type, parkStatus)}
              >
                <Popup>
                  <div className="p-1 min-w-[210px]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-white">{park.name}</span>
                      <StatusBadge status={parkStatus} size="sm" />
                    </div>

                    <div className="space-y-1 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Region:</span>
                        <span className="font-semibold text-cyan-400">{park.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Type:</span>
                        <span>{park.park_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Capacity:</span>
                        <span className="font-mono font-bold text-white">{park.capacity_mw} MW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Gen:</span>
                        <span className="font-mono font-bold text-emerald-400">{park.current_generation_mw} MW</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectPark && onSelectPark(park.id)}
                      className="mt-2.5 w-full py-1 px-2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1"
                    >
                      <span>Explore Park Assets</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Key Individual Assets (WT-021, INV-042, etc.) */}
        {assets.filter(a => a.status !== 'healthy' || a.asset_code === 'WT-021').map((asset) => (
          <Marker
            key={asset.id}
            position={[asset.latitude, asset.longitude]}
            icon={createCustomIcon(asset.asset_type, asset.status)}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-white">{asset.asset_code}</span>
                  <StatusBadge status={asset.status} size="sm" />
                </div>
                <p className="text-[11px] text-slate-400 mb-2">{asset.manufacturer}</p>
                <div className="text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Power:</span>
                    <span className="font-mono font-bold text-white">{asset.current_power_kw} kW</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Failure Risk:</span>
                    <span className={`font-mono font-bold ${
                      asset.failure_probability_pct > 70 ? 'text-rose-400' : 'text-slate-200'
                    }`}>
                      {asset.failure_probability_pct}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectAsset && onSelectAsset(asset.asset_code)}
                  className="mt-2 w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1"
                >
                  <span>Inspect Telemetry</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  );
};

export default GujaratAssetMap;
