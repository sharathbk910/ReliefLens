import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from './ui/Button.tsx';
import { Badge } from './ui/Badge.tsx';

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null; // In meters
  capturedAt: string; // ISO string
  isConfirmedIncidentLocation: boolean;
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
      (pos) => {
        setIsLoading(false);
        const { latitude, longitude, accuracy } = pos.coords;
        const capturedAt = new Date(pos.timestamp || Date.now()).toISOString();

        onLocationDetected({
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6)),
          accuracy: accuracy ? Math.round(accuracy) : null,
          capturedAt,
          isConfirmedIncidentLocation: false, // Must be confirmed explicitly by user
        });
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

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-3">
      {/* Action / Trigger Button if no location yet */}
      {!location ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchCurrentLocation}
              disabled={isLoading}
              className="gap-2 border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  Acquiring Device GPS...
                </>
              ) : (
                <>
                  <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                  Use My Current Location
                </>
              )}
            </Button>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/40 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
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
