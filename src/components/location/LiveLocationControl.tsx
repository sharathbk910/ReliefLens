import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  Radio,
  StopCircle,
  AlertTriangle,
  Clock,
  Crosshair,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import type { DetectedLocation } from './CurrentLocationControl.tsx';

interface LiveLocationControlProps {
  onLocationUpdate: (location: DetectedLocation) => void;
  onLiveSharingStopped?: () => void;
}

export function LiveLocationControl({
  onLocationUpdate,
  onLiveSharingStopped,
}: LiveLocationControlProps) {
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [latestPosition, setLatestPosition] = useState<DetectedLocation | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  const stopLiveTracking = () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveActive(false);
    if (onLiveSharingStopped) {
      onLiveSharingStopped();
    }
  };

  const startLiveTracking = () => {
    setErrorMessage(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrorMessage('Geolocation API is not available on this browser.');
      return;
    }

    try {
      setIsLiveActive(true);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const capturedAt = new Date(pos.timestamp || Date.now()).toISOString();

          const detected: DetectedLocation = {
            latitude: parseFloat(latitude.toFixed(6)),
            longitude: parseFloat(longitude.toFixed(6)),
            accuracy: accuracy ? Math.round(accuracy) : null,
            capturedAt,
            isConfirmedIncidentLocation: true,
          };

          setLatestPosition(detected);
          setUpdateCount((c) => c + 1);
          onLocationUpdate(detected);
        },
        (err) => {
          console.error('Live location watch error', err);
          setErrorMessage(err.message || 'Error occurred while streaming live GPS coordinates.');
          stopLiveTracking();
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to activate GPS watch listener');
      setIsLiveActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="p-3.5 rounded-xl surface-z2 border border-[var(--border-subtle)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Navigation className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[var(--text-primary)]">
              Continuous Live Location Sharing
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              Streams real-time updates as you move through dynamic disaster zones.
            </p>
          </div>
        </div>

        {isLiveActive ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={stopLiveTracking}
            leftIcon={<StopCircle className="w-3.5 h-3.5 text-rose-400" />}
            className="text-xs text-rose-400 hover:bg-rose-950/20"
          >
            Stop Sharing
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startLiveTracking}
            leftIcon={<Radio className="w-3.5 h-3.5 text-teal-400" />}
            className="text-xs border-teal-500/30 text-teal-300 hover:bg-teal-950/20"
          >
            Start Live Stream
          </Button>
        )}
      </div>

      {isLiveActive && (
        <div className="p-3 rounded-lg bg-teal-950/20 border border-teal-500/30 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-teal-300">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              Streaming Active
            </span>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              {updateCount} coordinate pings emitted
            </span>
          </div>

          {latestPosition && (
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-[var(--text-secondary)]">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">CURRENT LAT/LON</span>
                <span className="text-white font-semibold">
                  {latestPosition.latitude}°, {latestPosition.longitude}°
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[var(--text-muted)] block">ACCURACY</span>
                <span className="text-teal-300 font-semibold">
                  ±{latestPosition.accuracy || 10}m
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] pt-1 border-t border-teal-500/20">
            <Clock className="w-3 h-3 text-teal-400" />
            <span>Transmitting every 5 seconds or upon significant physical displacement.</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-950/25 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
