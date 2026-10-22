import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, ZoomControl } from 'react-leaflet';
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
  Crosshair,
  Loader2,
  Compass,
  ArrowLeft,
} from 'lucide-react';
import { dataService } from '../lib/dataService.ts';
import { calculateHaversineMeters } from '../shared/duplicate.ts';
import type { Incident, PriorityTier } from '../shared/types.ts';
import { PriorityBadge, StatusBadge } from '../components/ui/Badge.tsx';
import { useToast } from '../components/ui/Toast.tsx';
import { config } from '../config/env.ts';

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

function createUserLocationIcon() {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(20, 184, 166, 0.4);
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: relative;
          width: 18px;
          height: 18px;
          margin: 3px;
          border-radius: 50%;
          background: #0d9488;
          border: 3px solid #ffffff;
          box-shadow: 0 0 10px rgba(13, 148, 136, 0.8), 0 2px 6px rgba(0,0,0,0.4);
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
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

// Automatically fits map bounds to incident markers upon opening and invalidates container size
function MapAutoInitializer({
  incidents,
  userLocation,
}: {
  incidents: Incident[];
  userLocation: { lat: number; lng: number; accuracy: number } | null;
}) {
  const map = useMap();
  const containerRef = useRef<HTMLElement | null>(null);
  const initialFitDoneRef = useRef(false);
  const prevIncidentsLengthRef = useRef(0);

  // Invalidate map size so Leaflet renders tiles immediately on open without requiring a click
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

  useEffect(() => {
    // If the map has already fitted bounds and the number of incidents hasn't changed,
    // do not re-fit bounds when userLocation changes (which would reset the zoom level after clicking Locate Me)
    if (initialFitDoneRef.current && incidents.length === prevIncidentsLengthRef.current) {
      return;
    }

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

      // Only extend bounds if user location is nearby (< 100km)
      if (userLocation) {
        const center = bounds.getCenter();
        const dist = calculateHaversineMeters(userLocation.lat, userLocation.lng, center.lat, center.lng);
        if (dist < 100_000) {
          bounds.extend([userLocation.lat, userLocation.lng]);
        }
      }

      if (valid.length === 1 && !userLocation) {
        map.setView([valid[0].latitude!, valid[0].longitude!], 13);
      } else {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
      initialFitDoneRef.current = true;
      prevIncidentsLengthRef.current = incidents.length;
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
      initialFitDoneRef.current = true;
      prevIncidentsLengthRef.current = incidents.length;
    } else {
      const defaultCenter = config.map.defaultCenter || [12.9716, 77.5946];
      map.setView([defaultCenter[0], defaultCenter[1]], 12);
    }
  }, [incidents, userLocation, map]);

  return null;
}

// Map center controller for selecting an incident
function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

// Floating target/crosshair Locate Me control like Google Maps
function LocateMeControl({
  userLocation,
  setUserLocation,
  locateRequested,
}: {
  userLocation: { lat: number; lng: number; accuracy: number } | null;
  setUserLocation: (loc: { lat: number; lng: number; accuracy: number } | null) => void;
  locateRequested: number;
}) {
  const map = useMap();
  const toast = useToast();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocateMe = () => {
    // If we already have a location (in state or localStorage), immediately zoom in to street level (zoom 16)
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, { animate: true, duration: 1.2 });
    } else {
      const cachedLat = parseFloat(localStorage.getItem('relieflens_user_lat') || '');
      const cachedLng = parseFloat(localStorage.getItem('relieflens_user_lng') || '');
      if (!isNaN(cachedLat) && !isNaN(cachedLng)) {
        map.flyTo([cachedLat, cachedLng], 16, { animate: true, duration: 1.2 });
      }
    }

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
        setUserLocation(loc);
        localStorage.setItem('relieflens_user_lat', latitude.toString());
        localStorage.setItem('relieflens_user_lng', longitude.toString());
        localStorage.setItem('relieflens_user_accuracy', Math.round(accuracy).toString());
        dataService.checkAndAnchorToNearby(latitude, longitude);
        // Zoom in close to user location (zoom 16)
        map.flyTo([latitude, longitude], 16, { animate: true, duration: 1.2 });
        toast.success(
          'Location Detected',
          `Zoomed in to your current GPS coordinates (±${loc.accuracy}m).`
        );
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          toast.error(
            'Location Permission Denied',
            'Please allow location access in your browser address bar to use Locate Me.'
          );
        } else {
          toast.error('Location Unavailable', err.message || 'Unable to retrieve GPS coordinates.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );
  };

  useEffect(() => {
    if (locateRequested > 0) {
      handleLocateMe();
    }
  }, [locateRequested]);

  return (
    <div className="absolute bottom-6 right-4 md:right-[348px] z-[1000] pointer-events-auto">
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={isLocating}
        title="Locate My Current Position and Zoom In"
        aria-label="Locate My Current Position and Zoom In"
        className="h-11 px-4 rounded-full bg-[var(--surface-1-solid)] hover:bg-[var(--surface-2-solid)] border-2 border-teal-500/80 hover:border-teal-400 text-teal-400 shadow-2xl flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer"
      >
        {isLocating ? (
          <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
        ) : (
          <Crosshair className="w-5 h-5 text-teal-400 group-hover:rotate-45 transition-transform" />
        )}
        <span className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-teal-300">
          {isLocating ? 'Detecting Location...' : 'My Location'}
        </span>
      </button>
    </div>
  );
}

export function MapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tileError, setTileError] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PriorityTier | 'all'>('all');
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number | null>(null);
  const [mapViewMode, setMapViewMode] = useState<'all' | 'pins' | 'heat'>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
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
  const [locateRequested, setLocateRequested] = useState(0);
  
  // Mobile sheet detents: 'peek' | 'half' | 'full'
  const [mobileDetent, setMobileDetent] = useState<'peek' | 'half' | 'full'>('peek');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const tileUrl = config.map.tileUrl;

  const fetchIncidents = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const res = await dataService.getIncidents({ pageSize: 500 });
      setIncidents(res.incidents);
    } catch (err: any) {
      console.error('Failed to load map incidents', err);
      if (!silent) setError(err.message || 'Unable to load incident map data.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Automatic data loading and real-time live synchronization
  useEffect(() => {
    fetchIncidents();

    // 1. Subscribe to incident updates (localDB or Supabase real-time)
    const unsubscribe = dataService.subscribeToIncidents(() => {
      fetchIncidents(true);
    });

    // 2. Refresh every 25 seconds to keep map coordinates continuously fresh
    const refreshInterval = setInterval(() => {
      fetchIncidents(true);
    }, 25000);

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const locatedIncidents = incidents.filter((i) => {
    const hasCoords =
      typeof i.latitude === 'number' &&
      typeof i.longitude === 'number' &&
      !isNaN(i.latitude) &&
      !isNaN(i.longitude);
    if (!hasCoords) return false;

    if (selectedTier !== 'all' && i.priority_tier !== selectedTier) {
      return false;
    }

    if (selectedRadiusKm !== null && userLocation) {
      const distMeters = calculateHaversineMeters(
        userLocation.lat,
        userLocation.lng,
        i.latitude!,
        i.longitude!
      );
      if (distMeters > selectedRadiusKm * 1000) {
        return false;
      }
    }

    return true;
  });

  const unlocatedIncidents = incidents.filter(
    (i) => i.latitude === null || i.longitude === null
  );

  const defaultLat = config.map.defaultCenter?.[0] ?? 12.9716;
  const defaultLng = config.map.defaultCenter?.[1] ?? 77.5946;

  const centerLat =
    locatedIncidents.length > 0
      ? locatedIncidents.reduce((acc, cur) => acc + cur.latitude!, 0) /
        locatedIncidents.length
      : (userLocation?.lat ?? defaultLat);

  const centerLng =
    locatedIncidents.length > 0
      ? locatedIncidents.reduce((acc, cur) => acc + cur.longitude!, 0) /
        locatedIncidents.length
      : (userLocation?.lng ?? defaultLng);

  const handleSelectIncident = (inc: Incident) => {
    setSelectedIncident(inc);
    if (window.innerWidth < 768) {
      setMobileDetent('half');
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] min-h-[500px] rounded-2xl overflow-hidden surface-z1 border border-[var(--border-subtle)]">
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
            zoomControl={false}
            attributionControl={false}
            className="w-full h-full"
          >
            <ZoomControl position="bottomleft" />
            <TileLayer
              url={tileUrl}
              eventHandlers={{
                tileerror: () => setTileError(true),
              }}
            />

            {/* Automatically adjust bounds to fit loaded incidents and invalidate container size */}
            <MapAutoInitializer incidents={locatedIncidents} userLocation={userLocation} />

            {/* Google Maps style floating Locate Me control */}
            <LocateMeControl
              userLocation={userLocation}
              setUserLocation={setUserLocation}
              locateRequested={locateRequested}
            />

            {/* User Location Marker & Accuracy Radius */}
            {userLocation && (
              <>
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={createUserLocationIcon()}
                  eventHandlers={{
                    click: (e) => {
                      const targetMap = e.target?._map;
                      if (targetMap) {
                        targetMap.flyTo([userLocation.lat, userLocation.lng], 16, { animate: true, duration: 1.0 });
                      }
                    },
                  }}
                >
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-teal-400 font-semibold">
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>Your Current Position</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        GPS Accuracy: ±{userLocation.accuracy} meters
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">
                        {userLocation.lat.toFixed(5)}°, {userLocation.lng.toFixed(5)}°
                      </p>
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

                {/* Range Perimeter Radius Circle */}
                {selectedRadiusKm && (
                  <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={selectedRadiusKm * 1000}
                    pathOptions={{
                      color: '#0d9488',
                      fillColor: '#14b8a6',
                      fillOpacity: 0.08,
                      weight: 2,
                      dashArray: '6, 6',
                    }}
                  />
                )}
              </>
            )}

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
                      {userLocation && (
                        <p className="text-[10px] text-teal-400 font-mono font-medium">
                          📍 {(calculateHaversineMeters(userLocation.lat, userLocation.lng, inc.latitude!, inc.longitude!) / 1000).toFixed(1)} km from your position
                        </p>
                      )}
                      <p className="font-mono text-[10px] text-slate-400 tabular-nums">
                        {inc.latitude?.toFixed(4)}, {inc.longitude?.toFixed(4)}
                      </p>
                      <div className="pt-1 border-t border-[var(--border-subtle)]">
                        <Link
                          to={`/incidents/${inc.id}`}
                          className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 font-semibold"
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
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 surface-z2 p-2.5 sm:p-3 space-y-2.5 max-w-[calc(100vw-24px)] sm:max-w-xs shadow-xl animate-spatial-enter">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Link
              to="/dashboard"
              className="p-1 -ml-1 rounded hover:bg-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white transition-colors"
              title="Return to Command Center Dashboard"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <MapPin className="w-4 h-4 text-rose-500" strokeWidth={1.5} />
            <span className="text-xs font-semibold text-[var(--text-primary)]">Map Canvas</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isLoading && (
              <span className="flex items-center gap-1 text-[10px] text-teal-400 font-mono">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                Live
              </span>
            )}
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--border-subtle)] text-[var(--text-secondary)] tabular-nums">
              {locatedIncidents.length} Located
            </span>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="sm:hidden p-1 rounded hover:bg-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white transition-colors"
              aria-label="Toggle map filters on mobile"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        <div className={`${mobileFiltersOpen ? 'block' : 'hidden'} sm:block space-y-2.5`}>
          {error && (
            <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
              <span className="truncate">{error}</span>
              <button
                onClick={() => fetchIncidents()}
                className="text-[11px] underline font-semibold text-rose-400 hover:text-rose-200 shrink-0"
              >
                Retry
              </button>
            </div>
          )}

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

          {/* Locate My Current Position Action Button */}
          <button
            type="button"
            onClick={() => setLocateRequested((c) => c + 1)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 text-xs font-semibold transition-all shadow-sm active:scale-95 group focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
            title="Center map on your current GPS coordinates"
          >
            <Crosshair className="w-3.5 h-3.5 text-teal-400 group-hover:rotate-45 transition-transform" />
            <span>My Current Location</span>
          </button>

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

          {/* Proximity / Within Range Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Compass className="w-3.5 h-3.5 text-teal-400 shrink-0" strokeWidth={1.5} />
            <select
              value={selectedRadiusKm ?? 'all'}
              onChange={(e) =>
                setSelectedRadiusKm(e.target.value === 'all' ? null : Number(e.target.value))
              }
              aria-label="Filter incidents within range of your current location"
              className="w-full bg-[var(--surface-1-solid)] border border-[var(--border-strong)] rounded-md px-2 py-1 text-xs text-[var(--text-primary)] focus-visible:ring-1 cursor-pointer"
            >
              <option value="all">Range: All Distances</option>
              <option value={5}>Within 5 km of Me</option>
              <option value={10}>Within 10 km of Me</option>
              <option value={25}>Within 25 km of Me</option>
              <option value={50}>Within 50 km of Me</option>
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
                <div className="flex items-center justify-between gap-1">
                  <p className="text-[var(--text-primary)] font-medium truncate">📍 {selectedIncident.district || 'Unassigned District'}</p>
                  {userLocation && selectedIncident.latitude && selectedIncident.longitude && (
                    <span className="text-[10px] text-teal-400 font-mono font-medium shrink-0">
                      {(calculateHaversineMeters(userLocation.lat, userLocation.lng, selectedIncident.latitude, selectedIncident.longitude) / 1000).toFixed(1)} km away
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">{selectedIncident.location_text}</p>
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
        className={`md:hidden absolute left-0 right-0 bottom-[60px] md:bottom-0 z-30 surface-z2 rounded-t-2xl shadow-2xl transition-transform duration-300 ${
          mobileDetent === 'peek'
            ? 'translate-y-[calc(100%-52px)]'
            : mobileDetent === 'half'
            ? 'translate-y-[calc(100%-280px)]'
            : 'translate-y-0'
        }`}
        style={{ maxHeight: 'calc(85vh - 60px)', height: 'calc(85vh - 60px)' }}
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
