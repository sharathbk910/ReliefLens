import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, AlertTriangle, ArrowRight, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { dataService } from '../lib/dataService.ts';
import type { Incident, PriorityTier } from '../shared/types.ts';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge.tsx';

// Custom SVG Icons for Leaflet markers based on priority tier
function createCustomMarkerIcon(tier: PriorityTier) {
  const colors: Record<PriorityTier, string> = {
    critical: '#e11d48', // rose-600
    high: '#f59e0b',     // amber-500
    medium: '#3b82f6',   // blue-500
    low: '#64748b',      // slate-500
  };

  const color = colors[tier] || colors.low;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
      ">
        ●
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

export function MapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tileError, setTileError] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PriorityTier | 'all'>('all');

  const tileUrl =
    import.meta.env.VITE_MAP_TILE_URL ||
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await dataService.getIncidents({ pageSize: 500 });
        setIncidents(res.incidents);
      } catch (err) {
        console.error('Failed to load map incidents', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Filter located vs unlocated incidents
  const locatedIncidents = incidents.filter(
    (i) =>
      typeof i.latitude === 'number' &&
      typeof i.longitude === 'number' &&
      !isNaN(i.latitude) &&
      !isNaN(i.longitude) &&
      (selectedTier === 'all' || i.priority_tier === selectedTier)
  );

  const unlocatedIncidents = incidents.filter(
    (i) => i.latitude === null || i.longitude === null
  );

  // Center on average of located points, default to San Francisco
  const centerLat =
    locatedIncidents.length > 0
      ? locatedIncidents.reduce((acc, cur) => acc + cur.latitude!, 0) /
        locatedIncidents.length
      : 37.7749;

  const centerLng =
    locatedIncidents.length > 0
      ? locatedIncidents.reduce((acc, cur) => acc + cur.longitude!, 0) /
        locatedIncidents.length
      : -122.4194;

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-rose-500" />
            Geographic Incident Visualization
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Spatial distribution of active incidents with verified coordinates and fallback for unlocated reports.
          </p>
        </div>

        {/* Priority Tier Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Filter Tier:</span>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
          >
            <option value="all">All Tiers ({locatedIncidents.length})</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>
        </div>
      </div>

      {/* Main Map + Unlocated Drawer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[650px]">
        {/* Leaflet Map Area (3 Cols) */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative shadow-md">
          {tileError ? (
            /* Graceful Fallback if Tile Server Fails */
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900">
              <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
              <h3 className="text-sm font-semibold text-white">Map Tile Service Unavailable</h3>
              <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
                The external OpenStreetMap tile server is currently unreachable. The incident coordination system remains fully functional. You can inspect all located and unlocated incidents directly from the list.
              </p>
              <button
                onClick={() => setTileError(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Tile Connection</span>
              </button>
            </div>
          ) : (
            <MapContainer
              center={[centerLat, centerLng]}
              zoom={12}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <TileLayer
                url={tileUrl}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                eventHandlers={{
                  tileerror: () => setTileError(true),
                }}
              />

              {locatedIncidents.map((inc) => (
                <Marker
                  key={inc.id}
                  position={[inc.latitude!, inc.longitude!]}
                  icon={createCustomMarkerIcon(inc.priority_tier)}
                >
                  <Popup>
                    <div className="p-1 space-y-2 max-w-xs font-sans text-xs">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5">
                        <PriorityBadge
                          tier={inc.priority_tier}
                          score={inc.effective_score}
                        />
                        <StatusBadge status={inc.status} />
                      </div>

                      <h4 className="font-semibold text-white leading-tight">
                        {inc.title}
                      </h4>

                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        <p>📍 {inc.district || 'Unassigned District'}</p>
                        <p className="text-slate-400">{inc.location_text}</p>
                        <p className="font-mono text-[10px] text-slate-400">
                          Coords: {inc.latitude?.toFixed(4)}, {inc.longitude?.toFixed(4)}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-700">
                        <Link
                          to={`/incidents/${inc.id}`}
                          className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold"
                        >
                          <span>Open Incident Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}

          {/* Floating Map Legend (Section 4.8) */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 shadow-xl backdrop-blur-sm space-y-1.5">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Priority Legend
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <span>Critical (70–100)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>High (45–69)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Medium (20–44)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span>Low (0–19)</span>
            </div>
          </div>
        </div>

        {/* Unlocated Incidents Drawer (1 Col) (Section 4.8) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col shadow-md overflow-hidden">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Unlocated Incidents ({unlocatedIncidents.length})
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Reports without coordinates remain visible for review.
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
            {unlocatedIncidents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                All active incidents have GPS coordinates.
              </p>
            ) : (
              unlocatedIncidents.map((inc) => (
                <Link
                  key={inc.id}
                  to={`/incidents/${inc.id}`}
                  className="block p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <PriorityBadge tier={inc.priority_tier} score={inc.effective_score} />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {inc.incident_type}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-rose-300 transition-colors line-clamp-1">
                    {inc.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {inc.location_text || inc.district || 'Location text missing'}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
