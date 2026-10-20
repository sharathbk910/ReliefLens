import React from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ArrowRight, ExternalLink } from 'lucide-react';
import type { Incident, PriorityTier } from '../../shared/types.ts';
import { PriorityBadge, StatusBadge } from '../ui/Badge.tsx';

interface DashboardMapPreviewProps {
  incidents: Incident[];
}

function createMiniMarkerIcon(tier: PriorityTier) {
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
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
  });
}

export function DashboardMapPreview({ incidents }: DashboardMapPreviewProps) {
  const locatedIncidents = incidents.filter(
    (i) =>
      typeof i.latitude === 'number' &&
      typeof i.longitude === 'number' &&
      !isNaN(i.latitude) &&
      !isNaN(i.longitude)
  );

  const tileUrl =
    import.meta.env.VITE_MAP_TILE_URL ||
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

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
    <div className="surface-z1 flex flex-col h-[520px] overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rose-500" strokeWidth={1.5} />
          <h3 className="text-xs font-semibold text-[var(--text-primary)]">
            Spatial Distribution
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--border-subtle)] text-[var(--text-secondary)] tabular-nums">
            {locatedIncidents.length} pinned
          </span>
        </div>
        <Link
          to="/map"
          className="text-[11px] text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
        >
          <span>Full Canvas</span>
          <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
        </Link>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={11}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            url={tileUrl}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {locatedIncidents.map((inc) => (
            <Marker
              key={inc.id}
              position={[inc.latitude!, inc.longitude!]}
              icon={createMiniMarkerIcon(inc.priority_tier)}
            >
              <Popup>
                <div className="p-1 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-1.5">
                    <PriorityBadge tier={inc.priority_tier} score={inc.effective_score} />
                    <StatusBadge status={inc.status} />
                  </div>
                  <p className="font-semibold text-white line-clamp-1">{inc.title}</p>
                  <p className="text-[11px] text-slate-300 truncate">{inc.district || inc.location_text}</p>
                  <Link
                    to={`/incidents/${inc.id}`}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium pt-1"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
