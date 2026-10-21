import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, ArrowRight, ExternalLink, Crosshair, Loader2 } from 'lucide-react';
import type { Incident, PriorityTier } from '../../shared/types.ts';
import { PriorityBadge, StatusBadge } from '../ui/Badge.tsx';
import { useToast } from '../ui/Toast.tsx';
import { config } from '../../config/env.ts';

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
  const prevCountRef = useRef<number>(-1);

  // Invalidate map size so Leaflet renders tiles immediately without requiring a click
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 80);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 800);

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);

  // If user location is detected, center on user location; otherwise fit to incidents
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 14);
      return;
    }

    const valid = incidents.filter(
      (i) =>
        typeof i.latitude === 'number' &&
        typeof i.longitude === 'number' &&
        !isNaN(i.latitude) &&
        !isNaN(i.longitude)
    );
    if (valid.length === 0) return;

    if (prevCountRef.current !== valid.length) {
      prevCountRef.current = valid.length;
      map.invalidateSize();
      if (valid.length === 1) {
        map.setView([valid[0].latitude!, valid[0].longitude!], 13);
      } else {
        const bounds = L.latLngBounds(
          valid.map((i) => [i.latitude!, i.longitude!] as [number, number])
        );
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
      }
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
  const autoLocatedRef = useRef(false);

  const handleLocate = (isAuto = false) => {
    if (isLocating) return;
    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (!isAuto) {
        toast.error('Not Supported', 'Geolocation is not supported by your browser.');
      }
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
        if (!isAuto) {
          if (err.code === 1) {
            toast.error('Location Access Denied', 'Please allow location access in your browser.');
          } else {
            toast.error('Location Unavailable', err.message || 'Unable to retrieve location.');
          }
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );
  };

  // Automatically detect and center on location upon mounting
  useEffect(() => {
    if (!autoLocatedRef.current) {
      autoLocatedRef.current = true;
      handleLocate(true);
    }
  }, []);

  // When locate button in header or external trigger is clicked
  useEffect(() => {
    if (locateRequested > 0) {
      handleLocate(false);
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
        onClick={() => handleLocate(false)}
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

export function DashboardMapPreview({ incidents }: DashboardMapPreviewProps) {
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

  const locatedIncidents = incidents.filter(
    (i) =>
      typeof i.latitude === 'number' &&
      typeof i.longitude === 'number' &&
      !isNaN(i.latitude) &&
      !isNaN(i.longitude)
  );

  const tileUrl = config.map.tileUrl;

  const centerLat =
    userLocation?.lat ??
    (locatedIncidents.length > 0
      ? locatedIncidents.reduce((acc, cur) => acc + cur.latitude!, 0) /
        locatedIncidents.length
      : 37.7749);

  const centerLng =
    userLocation?.lng ??
    (locatedIncidents.length > 0
      ? locatedIncidents.reduce((acc, cur) => acc + cur.longitude!, 0) /
        locatedIncidents.length
      : -122.4194);

  return (
    <div className="surface-z1 rounded-2xl flex flex-col h-[520px] overflow-hidden border border-[var(--border-subtle)] shadow-sm">
      {/* Header */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-1)]">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-teal-400" strokeWidth={1.5} />
          <h3 className="text-xs font-semibold text-[var(--text-primary)]">
            Spatial Distribution
          </h3>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--border-subtle)] text-teal-300 font-semibold tabular-nums">
            {locatedIncidents.length} pinned
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLocateRequested((prev) => prev + 1)}
            className="text-[11px] text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 cursor-pointer"
            title="Center to current GPS location"
          >
            <Crosshair className="w-3 h-3" />
            <span>My Location</span>
          </button>
          <Link
            to="/map"
            className="text-[11px] text-slate-400 hover:text-slate-200 font-medium flex items-center gap-1 transition-colors ml-1"
          >
            <span>Full Canvas</span>
            <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={11}
          scrollWheelZoom={false}
          zoomControl={false}
          attributionControl={false}
          className="w-full h-full"
        >
          <TileLayer
            url={tileUrl}
          />

          {/* Auto-fit bounds on load or center on user location, invalidates size immediately */}
          <MapAutoInitializer incidents={locatedIncidents} userLocation={userLocation} />

          {/* Floating Target Button */}
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
                    className="inline-flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 font-medium pt-1"
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
