import { useState, useEffect, useRef, useCallback } from 'react';
import { reverseGeocodeCoordinates } from '../lib/reverseGeocode.ts';

export interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  capturedAt: string;
  isConfirmedIncidentLocation: boolean;
  placeName?: string | null;
  district?: string | null;
  locationText?: string | null;
}

export interface UseGeolocationOptions {
  autoFetch?: boolean;
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    autoFetch = false,
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000,
  } = options;

  const [location, setLocation] = useState<LocationState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [permissionState, setPermissionState] = useState<'granted' | 'prompt' | 'denied' | 'unknown'>('unknown');

  const watchIdRef = useRef<number | null>(null);

  // Check browser permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((perm) => {
          setPermissionState(perm.state as 'granted' | 'prompt' | 'denied');
          perm.onchange = () => {
            setPermissionState(perm.state as 'granted' | 'prompt' | 'denied');
          };
        })
        .catch(() => {
          setPermissionState('unknown');
        });
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<LocationState | null> => {
    setErrorMessage(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrorMessage('Browser Geolocation is not supported on this device.');
      return null;
    }

    setIsLoading(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const capturedAt = new Date(pos.timestamp || Date.now()).toISOString();
          const lat = parseFloat(latitude.toFixed(6));
          const lon = parseFloat(longitude.toFixed(6));

          let detected: LocationState = {
            latitude: lat,
            longitude: lon,
            accuracy: accuracy ? Math.round(accuracy) : null,
            capturedAt,
            isConfirmedIncidentLocation: true,
          };

          try {
            const geo = await reverseGeocodeCoordinates(lat, lon);
            detected = {
              ...detected,
              placeName: geo.displayName,
              district: geo.district,
              locationText: geo.locationText,
            };
          } catch (e) {
            console.warn('Reverse geocode in useGeolocation failed:', e);
          }

          setLocation(detected);
          setIsLoading(false);
          resolve(detected);
        },
        (err) => {
          setIsLoading(false);
          let msg = 'Unable to retrieve location coordinates.';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Location permission denied. Please allow location access in your browser.';
            setPermissionState('denied');
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = 'Location information is currently unavailable from your device GPS/network.';
          } else if (err.code === err.TIMEOUT) {
            msg = 'Location request timed out. Please retry or select location manually.';
          }
          setErrorMessage(msg);
          resolve(null);
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setErrorMessage(null);
  }, []);

  const confirmLocation = useCallback((isConfirmed: boolean) => {
    setLocation((prev) => (prev ? { ...prev, isConfirmedIncidentLocation: isConfirmed } : null));
  }, []);

  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveActive(false);
  }, []);

  const startLiveTracking = useCallback(() => {
    setErrorMessage(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrorMessage('Geolocation API is not available on this browser.');
      return;
    }

    setIsLiveActive(true);

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const capturedAt = new Date(pos.timestamp || Date.now()).toISOString();

          setLocation((prev) => ({
            latitude: parseFloat(latitude.toFixed(6)),
            longitude: parseFloat(longitude.toFixed(6)),
            accuracy: accuracy ? Math.round(accuracy) : null,
            capturedAt,
            isConfirmedIncidentLocation: true,
            placeName: prev?.placeName,
            district: prev?.district,
            locationText: prev?.locationText,
          }));
        },
        (err) => {
          setErrorMessage(err.message || 'Error occurred while streaming live GPS coordinates.');
          stopLiveTracking();
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to activate GPS watch listener');
      setIsLiveActive(false);
    }
  }, [stopLiveTracking]);

  useEffect(() => {
    if (autoFetch && !location) {
      getCurrentLocation();
    }
  }, [autoFetch, getCurrentLocation, location]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    location,
    setLocation,
    isLoading,
    errorMessage,
    permissionState,
    getCurrentLocation,
    clearLocation,
    confirmLocation,
    startLiveTracking,
    stopLiveTracking,
    isLiveActive,
  };
}
