import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Crosshair,
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCcw,
  Clock,
  ShieldCheck,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from './ui/Button.tsx';
import { Badge } from './ui/Badge.tsx';
import { reverseGeocodeCoordinates } from '../lib/reverseGeocode.ts';

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null; // In meters
  capturedAt: string; // ISO string
  isConfirmedIncidentLocation: boolean;
  placeName?: string | null;
  district?: string | null;
  locationText?: string | null;
}

interface CurrentLocationControlProps {
  location: DetectedLocation | null;
  onLocationDetected: (loc: DetectedLocation) => void;
  onLocationCleared: () => void;
  onLocationConfirmedChange: (isConfirmed: boolean) => void;
  spokenLocationText?: string | null;
}

export function CurrentLocationControl({
  location,
  onLocationDetected,
  onLocationCleared,
  onLocationConfirmedChange,
  spokenLocationText,
}: CurrentLocationControlProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCurrentLocation = () => {
    setErrorMessage(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrorMessage('Browser Geolocation is not supported on this device.');
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const capturedAt = new Date(pos.timestamp || Date.now()).toISOString();
        const lat = parseFloat(latitude.toFixed(6));
        const lon = parseFloat(longitude.toFixed(6));

        try {
          // Reverse-geocode place name, district, and landmark automatically
          const geo = await reverseGeocodeCoordinates(lat, lon);
          onLocationDetected({
            latitude: lat,
            longitude: lon,
            accuracy: accuracy ? Math.round(accuracy) : null,
            capturedAt,
            isConfirmedIncidentLocation: true, // Auto-confirm GPS location
            placeName: geo.displayName,
            district: geo.district,
            locationText: geo.locationText,
          });
        } catch {
          onLocationDetected({
            latitude: lat,
            longitude: lon,
            accuracy: accuracy ? Math.round(accuracy) : null,
            capturedAt,
            isConfirmedIncidentLocation: true, // Auto-confirm GPS location
          });
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setIsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setErrorMessage(
              'Location permission denied. Please allow location access in your browser or enter coordinates manually.'
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setErrorMessage('Location information is currently unavailable from your device GPS/network.');
            break;
          case err.TIMEOUT:
            setErrorMessage('Location request timed out. Please retry or enter location manually.');
            break;
          default:
            setErrorMessage(`Geolocation error: ${err.message || 'Unable to retrieve position'}`);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  // Automatically fetch location on mount if not already acquired
  useEffect(() => {
    if (!location && typeof window !== 'undefined' && navigator.geolocation) {
      fetchCurrentLocation();
    }
  }, []);

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  const [showManualInputs, setShowManualInputs] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  const PRESET_ZONES = [
    { name: 'Central Basin', lat: 37.7749, lng: -122.4194, text: 'Central District Station' },
    { name: 'North Ridge', lat: 37.7950, lng: -122.4050, text: 'North Zone Overlook' },
    { name: 'Mission Corridor', lat: 37.7599, lng: -122.4148, text: 'Mission Valley Plaza' },
    { name: 'Sunset Coastal', lat: 37.7535, lng: -122.4820, text: 'Sunset Beach Terminal' },
    { name: 'Bayview Hub', lat: 37.7312, lng: -122.3888, text: 'Bayview Logistics Center' },
  ];

  const handleSelectPreset = (zone: typeof PRESET_ZONES[0]) => {
    onLocationDetected({
      latitude: zone.lat,
      longitude: zone.lng,
      accuracy: 25,
      capturedAt: new Date().toISOString(),
      isConfirmedIncidentLocation: true,
      placeName: `${zone.name} (${zone.text})`,
      district: zone.name,
      locationText: zone.text,
    });
    setErrorMessage(null);
  };

  const handleApplyManualCoords = () => {
    setManualError(null);
    const parsedLat = parseFloat(manualLat);
    const parsedLng = parseFloat(manualLng);

    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setManualError('Latitude must be a valid number between -90 and 90');
      return;
    }
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      setManualError('Longitude must be a valid number between -180 and 180');
      return;
    }

    onLocationDetected({
      latitude: parsedLat,
      longitude: parsedLng,
      accuracy: 50,
      capturedAt: new Date().toISOString(),
      isConfirmedIncidentLocation: true,
      placeName: `Manual GPS (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)})`,
      district: 'Manual Location',
      locationText: `Coordinates: ${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)}`,
    });
    setErrorMessage(null);
  };

  return (
    <div className="space-y-3">
      {/* Action / Trigger Button if no location yet */}
      {!location ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchCurrentLocation}
              disabled={isLoading}
              className="gap-2 border-[var(--border-strong)] bg-[var(--surface-1-solid)] hover:bg-[var(--surface-2-solid)] text-[var(--text-primary)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                  <span>Acquiring Device GPS...</span>
                </>
              ) : (
                <>
                  <Crosshair className="w-3.5 h-3.5 text-teal-400" />
                  <span>Use My Current Location</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowManualInputs((prev) => !prev)}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              {showManualInputs ? 'Hide Manual Entry' : 'Manual Location Fallback'}
            </Button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-300">Automatic Geolocation Notice</p>
                <p className="text-[11px] text-amber-200/90">{errorMessage}</p>
                <p className="text-[11px] text-teal-300 font-medium pt-0.5">
                  Fallback options: Select an emergency district preset below or enter coordinates manually.
                </p>
              </div>
            </div>
          )}

          {/* Manual Location Selection Fallback (Presets + Custom Coords) */}
          {(errorMessage || showManualInputs) && (
            <div className="p-3.5 rounded-xl bg-[var(--surface-1-solid)] border border-[var(--border-strong)] space-y-3 animate-slide-down">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  Manual Location Selection Fallback
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">Select Zone or Type Lat/Lng</span>
              </div>

              {/* Preset Chips */}
              <div className="space-y-1.5">
                <label className="block text-[11px] text-[var(--text-muted)]">
                  Quick District Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_ZONES.map((zone) => (
                    <button
                      key={zone.name}
                      type="button"
                      onClick={() => handleSelectPreset(zone)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--surface-2-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-teal-500/50 hover:bg-teal-950/20 transition-colors"
                    >
                      {zone.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Coordinate Input */}
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                <label className="block text-[11px] text-[var(--text-muted)]">
                  Or enter exact geographic coordinates:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="any"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    placeholder="Latitude (e.g. 37.7749)"
                    className="bg-[var(--surface-2-solid)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[var(--text-muted)] font-mono"
                  />
                  <input
                    type="number"
                    step="any"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    placeholder="Longitude (e.g. -122.4194)"
                    className="bg-[var(--surface-2-solid)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-[var(--text-muted)] font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleApplyManualCoords}
                    className="text-xs col-span-2 sm:col-span-1 border-teal-500/40 text-teal-300 hover:bg-teal-950/30"
                  >
                    Set Location
                  </Button>
                </div>
                {manualError && (
                  <p className="text-[11px] text-rose-400">{manualError}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Detected Location Preview Card */
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Device GPS Position Detected</span>
              {location.accuracy !== null && (
                <Badge
                  variant={location.accuracy <= 30 ? 'default' : 'warning'}
                  className="text-[10px] font-mono"
                >
                  ±{location.accuracy}m accuracy
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={fetchCurrentLocation}
                disabled={isLoading}
                title="Refresh Location"
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onLocationCleared}
                title="Remove Location"
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Auto-Detected Place Name & District */}
          {location.placeName && (
            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-600/40 text-xs animate-fade-in">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-0.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Auto-Detected Location & District</span>
              </div>
              <p className="text-slate-100 font-medium leading-relaxed">{location.placeName}</p>
            </div>
          )}

          {/* Coordinates Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-slate-950/70 border border-slate-800/60 font-mono">
              <span className="text-slate-400 block text-[10px]">LATITUDE</span>
              <span className="text-white font-medium">{location.latitude}°</span>
            </div>
            <div className="p-2 rounded bg-slate-950/70 border border-slate-800/60 font-mono">
              <span className="text-slate-400 block text-[10px]">LONGITUDE</span>
              <span className="text-white font-medium">{location.longitude}°</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              Captured at {formatTimestamp(location.capturedAt)}
            </span>
            <span className="text-[10px] text-slate-500">Source: Browser Geolocation</span>
          </div>

          {/* Important Location-Safety Confirmation */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs group">
              <input
                type="checkbox"
                checked={location.isConfirmedIncidentLocation}
                onChange={(e) => onLocationConfirmedChange(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 shrink-0"
              />
              <span className="text-slate-300 leading-snug group-hover:text-white">
                <strong className="text-emerald-400">Confirm Incident Location:</strong> I confirm that this device GPS
                position represents the actual location of the emergency incident.
              </span>
            </label>

            {!location.isConfirmedIncidentLocation && (
              <p className="text-[11px] text-amber-400/90 pl-6 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                If you are reporting an incident away from your current position, please confirm or enter the incident
                coordinates manually.
              </p>
            )}

            {spokenLocationText && (
              <div className="p-2 rounded bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400">
                <span className="text-slate-300 font-medium">Spoken location mentioned: </span>
                <span className="text-cyan-300">"{spokenLocationText}"</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
