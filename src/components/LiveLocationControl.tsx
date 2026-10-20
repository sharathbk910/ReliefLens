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
import { Button } from './ui/Button.tsx';
import { Badge } from './ui/Badge.tsx';
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

  // Stop watching function
  const stopLiveTracking = () => {
    if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveActive(false);
    if (onLiveSharingStopped) {
      onLiveSharingStopped();
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const startLiveTracking = () => {
    setErrorMessage(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrorMessage('Browser Geolocation is not supported on this device.');
      return;
    }

    try {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const capturedAt = new Date(pos.timestamp || Date.now()).toISOString();

          const loc: DetectedLocation = {
            latitude: parseFloat(latitude.toFixed(6)),
            longitude: parseFloat(longitude.toFixed(6)),
            accuracy: accuracy ? Math.round(accuracy) : null,
            capturedAt,
            isConfirmedIncidentLocation: true, // In live mode, user actively tracks report location
          };

          setLatestPosition(loc);
          setUpdateCount((c) => c + 1);
          onLocationUpdate(loc);
        },
        (err) => {
          stopLiveTracking();
          switch (err.code) {
            case err.PERMISSION_DENIED:
              setErrorMessage('Location permission was denied. Cannot track live position.');
              break;
            case err.POSITION_UNAVAILABLE:
              setErrorMessage('Live location position is currently unavailable.');
              break;
            case err.TIMEOUT:
              setErrorMessage('Live location request timed out.');
              break;
            default:
              setErrorMessage(`Live location error: ${err.message || 'Position tracking error'}`);
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      );

      watchIdRef.current = id;
      setIsLiveActive(true);
      setUpdateCount(0);
    } catch (e: any) {
      setErrorMessage(`Failed to start live tracking: ${e.message}`);
    }
  };

  return (
    <div className="space-y-2">
      {!isLiveActive ? (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={startLiveTracking}
            className="gap-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30 text-xs border border-cyan-800/40"
          >
            <Radio className="w-3.5 h-3.5" />
            Share Live Location While Preparing Report
          </Button>

          {errorMessage && (
            <div className="mt-2 p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/40 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        /* Live Tracking Active Banner */
        <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-700/50 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <span className="text-xs font-semibold text-cyan-200">
                Live Location Tracking Active
              </span>
              <Badge variant="outline" className="text-[10px] text-cyan-300 border-cyan-600/40 font-mono">
                {updateCount} updates received
              </Badge>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={stopLiveTracking}
              className="gap-1.5 text-xs text-rose-300 border-rose-800/50 hover:bg-rose-950/40 h-7"
            >
              <StopCircle className="w-3.5 h-3.5" />
              Stop Sharing
            </Button>
          </div>

          {latestPosition && (
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2 bg-slate-950/60 p-2 rounded border border-cyan-900/40">
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span>LAT: {latestPosition.latitude}°</span>
                <span>LNG: {latestPosition.longitude}°</span>
                {latestPosition.accuracy !== null && (
                  <span className="text-cyan-400">±{latestPosition.accuracy}m</span>
                )}
              </div>

              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                Updated {new Date(latestPosition.capturedAt).toLocaleTimeString()}
              </span>
            </div>
          )}

          <p className="text-[10px] text-slate-400">
            Live tracking will automatically stop when you submit or leave this form. Location coordinates are only
            saved with your final submitted report.
          </p>
        </div>
      )}
    </div>
  );
}
