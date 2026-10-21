import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ArrowRight, ExternalLink, Crosshair, Loader2, RefreshCw } from 'lucide-react';
import type { Incident, PriorityTier } from '../../shared/types.ts';
import { calculateHaversineMeters } from '../../shared/duplicate.ts';
import { dataService } from '../../lib/dataService.ts';
import { PriorityBadge, StatusBadge } from '../ui/Badge.tsx';
import { useToast } from '../ui/Toast.tsx';
import { config } from '../../config/env.ts';

interface DashboardMapPreviewProps {
  incidents: Incident[];
  allIncidents?: Incident[];
  isLoading?: boolean;
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

function createClusterMarkerIcon(count: number, tier: PriorityTier) {
  const colors: Record<PriorityTier, string> = {
    critical: '#e11d48',
    high: '#f59e0b',
    medium: '#3b82f6',
    low: '#64748b',
  };
  const color = colors[tier] || colors.low;

  return L.divIcon({
    className: 'custom-leaflet-cluster-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-family: monospace;
        font-size: 11px;
        font-weight: bold;
      ">${count}</div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function createUserLocationMiniIcon() {
  return L.divIcon({
    className: 'user-location-mini-marker',
    html: `
      <div style="position: relative; width: 20px; height: 20px;">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(20, 184, 166, 0.45);
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: relative;
          width: 14px;
          height: 14px;
          margin: 3px;
          border-radius: 50%;
          background: #0d9488;
          border: 2.5px solid #ffffff;
          box-shadow: 0 0 8px rgba(13, 148, 136, 0.9), 0 2px 4px rgba(0,0,0,0.5);
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
}

function MapAutoInitializer({
  incidents,
  userLocation,
}: {
  incidents: Incident[];
  userLocation: { lat: number; lng: number; accuracy: number } | null;
}) {
  const map = useMap();
  const containerRef = useRef<HTMLElement | null>(null);

  // Invalidate map size automatically on mount, resize, and layout changes
  useEffect(() => {
    containerRef.current = map.getContainer();
    map.invalidateSize();

    const raf = requestAnimationFrame(() => map.invalidateSize());
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 150);
    const t3 = setTimeout(() => map.invalidateSize(), 350);
    const t4 = setTimeout(() => map.invalidateSize(), 700);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => {
        map.invalidateSize();
      });
      ro.observe(containerRef.current);
    }

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [map]);

  // Fit bounds to include incident markers automatically without requiring clicks
  useEffect(() => {
    const valid = incidents.filter(
      (i) =>
        typeof i.latitude === 'number' &&
        typeof i.longitude === 'number' &&
        !isNaN(i.latitude) &&
        !isNaN(i.longitude)
    );

    map.invalidateSize();

    if (valid.length > 0) {
      const bounds = L.latLngBounds(
        valid.map((i) => [i.latitude!, i.longitude!] as [number, number])
      );

      // Only extend bounds if user location is nearby (< 100km) to keep focus on incident cluster
      if (userLocation) {
        const center = bounds.getCenter();
        const distMeters = calculateHaversineMeters(userLocation.lat, userLocation.lng, center.lat, center.lng);
        if (distMeters < 100_000) {
          bounds.extend([userLocation.lat, userLocation.lng]);
        }
      }

      if (valid.length === 1 && !userLocation) {
        map.setView([valid[0].latitude!, valid[0].longitude!], 13);
      } else {
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
      }
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
    } else {
      const defaultCenter = config.map.defaultCenter || [12.9716, 77.5946];
      map.setView([defaultCenter[0], defaultCenter[1]], 12);
    }
  }, [incidents, userLocation, map]);

  return null;
}

function MiniLocateMeControl({
  onLocated,
  locateRequested,
}: {
  onLocated: (loc: { lat: number; lng: number; accuracy: number }) => void;
  locateRequested: number;
}) {
  const map = useMap();
  const toast = useToast();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    if (isLocating) return;
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Not Supported', 'Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const loc = { lat: latitude, lng: longitude, accuracy: Math.round(accuracy) };
        try {
          localStorage.setItem('relieflens_user_lat', latitude.toString());
          localStorage.setItem('relieflens_user_lng', longitude.toString());
          localStorage.setItem('relieflens_user_accuracy', Math.round(accuracy).toString());
        } catch (_) {}
        onLocated(loc);
        map.flyTo([latitude, longitude], 14, { duration: 1.2 });
        toast.success('Location Found', `Map centered to your current position (±${loc.accuracy}m).`);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          toast.error('Location Access Denied', 'Please allow location access in your browser address bar.');
        } else {
          toast.error('Location Unavailable', err.message || 'Unable to retrieve location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    if (locateRequested > 0) {
      handleLocate();
    }
  }, [locateRequested]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '14px',
        right: '14px',
        zIndex: 1000,
        pointerEvents: 'auto',
      }}
    >
      <button
        type="button"
        onClick={handleLocate}
        disabled={isLocating}
        title="Locate My Current Position"
        aria-label="Locate My Current Position"
        className="h-9 px-3 rounded-full bg-[var(--surface-1-solid)] hover:bg-[var(--surface-2-solid)] border-2 border-teal-500/80 hover:border-teal-400 text-teal-400 shadow-2xl flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
      >
        {isLocating ? (
          <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
        ) : (
          <Crosshair className="w-4 h-4 text-teal-400 group-hover:rotate-45 transition-transform" />
        )}
        <span className="text-[11px] font-semibold text-[var(--text-primary)] group-hover:text-teal-300">
          {isLocating ? 'Locating...' : 'My Location'}
        </span>
      </button>
    </div>
  );
}

export function DashboardMapPreview({
  incidents,
  allIncidents,
  isLoading = false,
}: DashboardMapPreviewProps) {
  const [locateRequested, setLocateRequested] = useState<number>(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const lat = localStorage.getItem('relieflens_user_lat');
        const lng = localStorage.getItem('relieflens_user_lng');
        const acc = localStorage.getItem('relieflens_user_accuracy');
        if (lat && lng) {
          return {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            accuracy: acc ? parseInt(acc, 10) : 50,
          };
        }
      } catch (_) {}
    }
    return null;
  });

  // Prioritize allIncidents for map overview if provided and non-empty
  const sourceIncidents = (allIncidents && allIncidents.length > 0) ? allIncidents : incidents;

  // Deduplicate by ID and ensure valid coordinates
  const locatedIncidents = React.useMemo(() => {
    const seen = new Set<string>();
    const result: Incident[] = [];
    for (const inc of sourceIncidents) {
      if (
        typeof inc.latitude === 'number' &&
        typeof inc.longitude === 'number' &&
        !isNaN(inc.latitude) &&
        !isNaN(inc.longitude) &&
        !seen.has(inc.id)
      ) {
        seen.add(inc.id);
        result.push(inc);
      }
    }
    return result;
  }, [sourceIncidents]);

  // Group incidents into clusters if within ~700m to resolve overlap along dense zones (Issue #4)
  const clusteredNodes = React.useMemo(() => {
    const clusters: Array<{
      id: string;
      lat: number;
      lng: number;
      incidents: Incident[];
      highestTier: PriorityTier;
    }> = [];

    const tierPriority: Record<PriorityTier, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    for (const inc of locatedIncidents) {
      const match = clusters.find(
        (c) =>
          Math.abs(c.lat - inc.latitude!) < 0.007 &&
          Math.abs(c.lng - inc.longitude!) < 0.007
      );

      if (match) {
        match.incidents.push(inc);
        if (tierPriority[inc.priority_tier] > tierPriority[match.highestTier]) {
          match.highestTier = inc.priority_tier;
        }
      } else {
        clusters.push({
          id: inc.id,
          lat: inc.latitude!,
          lng: inc.longitude!,
          incidents: [inc],
          highestTier: inc.priority_tier,
        });
      }
    }

    return clusters;
  }, [locatedIncidents]);

  const tileUrl = config.map.tileUrl;

  const defaultLat = config.map.defaultCenter?.[0] ?? 12.9716;
  const defaultLng = config.map.defaultCenter?.[1] ?? 77.5946;

  const centerLat =
    locatedIncidents.length > 0
      ? locatedIncidents.reduce((acc, cur) => acc + cur.latitude!, 0) / locatedIncidents.length
      : (userLocation?.lat ?? defaultLat);

  const centerLng =
    locatedIncidents.length > 0
      ? locatedIncidents.reduce((acc, cur) => acc + cur.longitude!, 0) / locatedIncidents.length
      : (userLocation?.lng ?? defaultLng);

  return (
    <div className="surface-z1 rounded-xl flex flex-col h-[280px] sm:h-[380px] xl:h-[520px] overflow-hidden border border-[var(--border-subtle)] shadow-sm relative corner-cross">
      <div className="corner-bracket cross-tl"></div>
      <div className="corner-bracket cross-tr"></div>
      <div className="corner-bracket cross-bl"></div>
      <div className="corner-bracket cross-br"></div>

      {/* Header */}
      <div className="p-2.5 sm:p-3.5 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 bg-[var(--surface-1)]">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 shrink-0" strokeWidth={1.5} />
          <h3 className="text-xs font-semibold text-[var(--text-primary)] font-mono truncate">
            Spatial Distribution
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--border-subtle)] text-teal-300 font-semibold tabular-nums shrink-0">
            {locatedIncidents.length} pinned ({clusteredNodes.length} zones)
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-950/60 text-teal-300 border border-teal-500/30 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
            LIVE RADAR
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            to="/map"
            className="text-xs text-slate-400 hover:text-slate-200 font-medium flex items-center gap-1 transition-colors font-mono px-2 py-0.5 rounded bg-[var(--surface-2-solid)] border border-[var(--border-subtle)]"
          >
            <span>Full Canvas</span>
            <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-[#0B0F12]">
        {isLoading && locatedIncidents.length === 0 && (
          <div className="absolute inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141611] border border-teal-500/30 text-teal-300 font-mono text-xs shadow-xl">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
              <span>Loading incident coordinates...</span>
            </div>
          </div>
        )}

        <MapContainer
          center={[centerLat, centerLng]}
          zoom={12}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full"
        >
          <TileLayer url={tileUrl} />

          {/* Auto-fit bounds on load or updates without manual clicking */}
          <MapAutoInitializer incidents={locatedIncidents} userLocation={userLocation} />

          {/* Floating Target Button (Single authoritative location trigger - Issue #26) */}
          <MiniLocateMeControl
            onLocated={(loc) => setUserLocation(loc)}
            locateRequested={locateRequested}
          />

          {/* User Location Pulse Marker */}
          {userLocation && (
            <>
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={createUserLocationMiniIcon()}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <strong className="text-teal-400">Your Current Position</strong>
                    <p className="text-[11px] text-slate-300">Accuracy: ±{userLocation.accuracy}m</p>
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={userLocation.accuracy}
                pathOptions={{
                  color: '#0d9488',
                  fillColor: '#14b8a6',
                  fillOpacity: 0.18,
                  weight: 1.5,
                }}
              />
            </>
          )}

          {clusteredNodes.map((cluster) => {
            const isMulti = cluster.incidents.length > 1;
            const primaryInc = cluster.incidents[0];

            return (
              <Marker
                key={cluster.id}
                position={[cluster.lat, cluster.lng]}
                icon={
                  isMulti
                    ? createClusterMarkerIcon(cluster.incidents.length, cluster.highestTier)
                    : createMiniMarkerIcon(primaryInc.priority_tier)
                }
              >
                <Popup>
                  <div className="p-1 space-y-2 text-xs max-h-56 overflow-y-auto">
                    {isMulti && (
                      <div className="font-mono text-[10px] text-amber-300 font-bold border-b border-white/10 pb-1">
                        CLUSTERING: {cluster.incidents.length} INCIDENTS AT THIS ZONE
                      </div>
                    )}
                    {cluster.incidents.map((inc) => (
                      <div key={inc.id} className="space-y-1 pb-1.5 border-b border-white/10 last:border-b-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <PriorityBadge tier={inc.priority_tier} score={inc.effective_score} />
                          <StatusBadge status={inc.status} />
                        </div>
                        <p className="font-semibold text-white line-clamp-1">{inc.title}</p>
                        <p className="text-[11px] text-slate-300 truncate">{inc.district || inc.location_text}</p>
                        <Link
                          to={`/incidents/${inc.id}`}
                          className="inline-flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 font-medium pt-0.5"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                        </Link>
                      </div>
                    ))}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
