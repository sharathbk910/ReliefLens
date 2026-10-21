import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  AlertTriangle,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Filter,
  X,
  Layers,
  Flame,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';
import type { Incident, PriorityTier } from '../shared/types.ts';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge.tsx';

function createCustomMarkerIcon(tier: PriorityTier) {
  const colors: Record<PriorityTier, string> = {
    critical: '#e11d48',
    high: '#f59e0b',
    medium: '#3b82f6',
    low: '#64748b',
  };
  const color = colors[tier] || colors.low;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 22px;
        height: 22px;
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
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

function getHeatCircleStyle(tier: PriorityTier) {
  const configs: Record<PriorityTier, { color: string; fillColor: string; radius: number; fillOpacity: number }> = {
    critical: { color: '#e11d48', fillColor: '#e11d48', radius: 1000, fillOpacity: 0.25 },
    high: { color: '#f59e0b', fillColor: '#f59e0b', radius: 700, fillOpacity: 0.20 },
    medium: { color: '#3b82f6', fillColor: '#3b82f6', radius: 500, fillOpacity: 0.15 },
    low: { color: '#64748b', fillColor: '#64748b', radius: 350, fillOpacity: 0.10 },
  };
  return configs[tier] || configs.low;
}

// Map center controller
function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

export function MapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tileError, setTileError] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PriorityTier | 'all'>('all');
  const [mapViewMode, setMapViewMode] = useState<'all' | 'pins' | 'heat'>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  // Mobile sheet detents: 'peek' | 'half' | 'full'
  const [mobileDetent, setMobileDetent] = useState<'peek' | 'half' | 'full'>('peek');

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

  const handleSelectIncident = (inc: Incident) => {
    setSelectedIncident(inc);
    if (window.innerWidth < 768) {
      setMobileDetent('half');
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] min-h-[500px] rounded-2xl overflow-hidden surface-z1">
      {/* 1. Full-Bleed Map Canvas (Layer 0) */}
      <div className="absolute inset-0 z-0">
        {tileError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[var(--surface-1)]">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-3" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Map Tile Service Unavailable</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md mt-1 mb-4">
              The external tile server is currently unreachable. You can continue inspecting incidents from the floating panel.
            </p>
            <button
              onClick={() => setTileError(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[var(--border-subtle)] hover:bg-[var(--border-strong)] text-[var(--text-primary)] border border-[var(--border-strong)]"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Retry Connection</span>
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
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              eventHandlers={{
                tileerror: () => setTileError(true),
              }}
            />

            {selectedIncident?.latitude && selectedIncident?.longitude && (
              <MapFlyTo lat={selectedIncident.latitude} lng={selectedIncident.longitude} />
            )}

            {/* Density Heat Radius Overlay */}
            {mapViewMode !== 'pins' &&
              locatedIncidents.map((inc) => {
                const style = getHeatCircleStyle(inc.priority_tier);
                return (
                  <Circle
                    key={`heat-${inc.id}`}
                    center={[inc.latitude!, inc.longitude!]}
                    radius={style.radius}
                    pathOptions={{
                      color: style.color,
                      fillColor: style.fillColor,
                      fillOpacity: style.fillOpacity,
                      weight: 1,
                    }}
                  />
                );
              })}

            {/* Pinpoint Markers */}
            {mapViewMode !== 'heat' &&
              locatedIncidents.map((inc) => (
                <Marker
                  key={inc.id}
                  position={[inc.latitude!, inc.longitude!]}
                  icon={createCustomMarkerIcon(inc.priority_tier)}
                  eventHandlers={{
                    click: () => handleSelectIncident(inc),
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1.5 text-xs max-w-xs">
                      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-1">
                        <PriorityBadge tier={inc.priority_tier} score={inc.effective_score} />
                        <StatusBadge status={inc.status} />
                      </div>
                      <h4 className="font-semibold text-white leading-tight">{inc.title}</h4>
                      <p className="text-[11px] text-slate-300">{inc.district || inc.location_text}</p>
                      <p className="font-mono text-[10px] text-slate-400 tabular-nums">
                        {inc.latitude?.toFixed(4)}, {inc.longitude?.toFixed(4)}
                      </p>
                      <div className="pt-1 border-t border-[var(--border-subtle)]">
                        <Link
                          to={`/incidents/${inc.id}`}
                          className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold"
                        >
                          <span>Open Details</span>
                          <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        )}
      </div>

      {/* 2. Floating Filter & Legend Panel (Desktop Top-Left - Layer 2) */}
      <div className="absolute top-4 left-4 z-20 surface-z2 p-3 space-y-2.5 max-w-xs shadow-xl animate-spatial-enter">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-rose-500" strokeWidth={1.5} />
            <span className="text-xs font-semibold text-[var(--text-primary)]">Map Canvas</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--border-subtle)] text-[var(--text-secondary)] tabular-nums">
            {locatedIncidents.length} Located
          </span>
        </div>

        {/* Layer Mode Segmented Switcher */}
        <div className="bg-[var(--surface-1-solid)] p-1 rounded-lg border border-[var(--border-subtle)] flex items-center justify-between gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setMapViewMode('all')}
            className={`flex-1 py-1 rounded font-medium transition-colors ${
              mapViewMode === 'all'
                ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setMapViewMode('pins')}
            className={`flex-1 py-1 rounded font-medium transition-colors ${
              mapViewMode === 'pins'
                ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Pins
          </button>
          <button
            type="button"
            onClick={() => setMapViewMode('heat')}
            className={`flex-1 py-1 rounded font-medium transition-colors ${
              mapViewMode === 'heat'
                ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Heat
          </button>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={1.5} />
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as any)}
            className="w-full bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)] focus-visible:ring-1"
          >
            <option value="all">All Tiers ({locatedIncidents.length})</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-1 text-[10px] text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
            <span>Low</span>
          </div>
        </div>
      </div>

      {/* 3. Floating Incident Details & Unlocated Drawer (Desktop Right Side - Layer 2) */}
      <div className="hidden md:flex flex-col absolute top-4 right-4 bottom-4 w-80 surface-z2 z-20 shadow-xl overflow-hidden animate-spatial-enter">
        <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" strokeWidth={1.5} />
            <span>{selectedIncident ? 'Incident Inspector' : `Unlocated Reports (${unlocatedIncidents.length})`}</span>
          </h3>
          {selectedIncident && (
            <button
              onClick={() => setSelectedIncident(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Close inspector"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {selectedIncident ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <PriorityBadge tier={selectedIncident.priority_tier} score={selectedIncident.effective_score} />
                <StatusBadge status={selectedIncident.status} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">{selectedIncident.title}</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{selectedIncident.location_text || selectedIncident.district || 'Incident details logged.'}</p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--border-subtle)] text-xs space-y-1">
                <p className="text-[var(--text-primary)] font-medium">📍 {selectedIncident.district || 'Unassigned District'}</p>
                <p className="text-[var(--text-muted)]">{selectedIncident.location_text}</p>
                <p className="font-mono text-[10px] text-[var(--text-muted)] tabular-nums">
                  Lat: {selectedIncident.latitude?.toFixed(4)}, Lng: {selectedIncident.longitude?.toFixed(4)}
                </p>
              </div>
              <Link
                to={`/incidents/${selectedIncident.id}`}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <span>Open Full Incident Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </Link>
            </div>
          ) : unlocatedIncidents.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] text-center py-8">
              All active reports have confirmed coordinates.
            </p>
          ) : (
            unlocatedIncidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => handleSelectIncident(inc)}
                className="p-2.5 rounded-lg bg-[var(--surface-1)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <PriorityBadge tier={inc.priority_tier} score={inc.effective_score} />
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                    {inc.incident_type}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">{inc.title}</h4>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  {inc.location_text || inc.district || 'No location description'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Mobile Bottom Sheet with 3 Detents (Section D: peek, half, full reachable via buttons) */}
      <div
        className={`md:hidden absolute left-0 right-0 bottom-0 z-30 surface-z2 rounded-t-2xl shadow-2xl transition-transform duration-300 ${
          mobileDetent === 'peek'
            ? 'translate-y-[calc(100%-54px)]'
            : mobileDetent === 'half'
            ? 'translate-y-[calc(100%-280px)]'
            : 'translate-y-0'
        }`}
        style={{ maxHeight: '85vh', height: '85vh' }}
      >
        {/* Detent Control Bar */}
        <div className="p-2 border-b border-[var(--border-subtle)] flex items-center justify-between select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-1 rounded-full bg-[var(--border-strong)] mx-auto block md:hidden" />
            <span className="text-xs font-semibold text-[var(--text-primary)] pl-2">
              {selectedIncident ? 'Incident Details' : `Reports (${locatedIncidents.length + unlocatedIncidents.length})`}
            </span>
          </div>

          {/* 3 Explicit Detent Buttons (Section D: Each detent reachable via buttons, not only drag) */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMobileDetent('peek')}
              aria-label="Set sheet to peek mode"
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                mobileDetent === 'peek'
                  ? 'bg-rose-500 text-white'
                  : 'bg-[var(--border-subtle)] text-[var(--text-secondary)]'
              }`}
            >
              Peek
            </button>
            <button
              onClick={() => setMobileDetent('half')}
              aria-label="Set sheet to half mode"
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                mobileDetent === 'half'
                  ? 'bg-rose-500 text-white'
                  : 'bg-[var(--border-subtle)] text-[var(--text-secondary)]'
              }`}
            >
              Half
            </button>
            <button
              onClick={() => setMobileDetent('full')}
              aria-label="Set sheet to full mode"
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                mobileDetent === 'full'
                  ? 'bg-rose-500 text-white'
                  : 'bg-[var(--border-subtle)] text-[var(--text-secondary)]'
              }`}
            >
              Full
            </button>
          </div>
        </div>

        {/* Sheet Content Area */}
        <div className="p-3 overflow-y-auto" style={{ height: 'calc(100% - 44px)' }}>
          {selectedIncident ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <PriorityBadge tier={selectedIncident.priority_tier} score={selectedIncident.effective_score} />
                <StatusBadge status={selectedIncident.status} />
              </div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">{selectedIncident.title}</h4>
              <p className="text-xs text-[var(--text-secondary)]">{selectedIncident.location_text || selectedIncident.district || 'Incident details logged.'}</p>
              <div className="p-2 rounded bg-[var(--border-subtle)] text-xs">
                <p className="font-medium text-[var(--text-primary)]">{selectedIncident.district || 'Unassigned District'}</p>
                <p className="text-[var(--text-muted)] text-[11px]">{selectedIncident.location_text}</p>
              </div>
              <Link
                to={`/incidents/${selectedIncident.id}`}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-600 text-white text-xs font-semibold"
              >
                <span>Open Incident</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-[var(--text-secondary)]">
                Select an incident pin on the map or choose an unlocated report below:
              </p>
              {unlocatedIncidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className="p-2.5 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <PriorityBadge tier={inc.priority_tier} score={inc.effective_score} />
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono">{inc.incident_type}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">{inc.title}</h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
