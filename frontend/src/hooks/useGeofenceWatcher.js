import { useEffect, useRef, useCallback } from 'react';
import api from '../api/axiosConfig';

/**
 * useGeofenceWatcher
 *
 * Monitors the user's GPS position every 30 seconds.
 * If the user moves OUTSIDE the institute radius AND is currently punched in,
 * it automatically calls /api/qr/auto-checkout to close the session.
 *
 * @param {boolean}  isPunchedIn  - Whether the user currently has an active session
 * @param {function} onAutoCheckout - Callback when auto-checkout fires (to refresh UI)
 * @param {function} onLocationError - Callback when location permission is denied
 */
export default function useGeofenceWatcher(isPunchedIn, onAutoCheckout, onLocationError) {
  const watchIdRef        = useRef(null);
  const pollingRef        = useRef(null);
  const didCheckoutRef    = useRef(false);   // prevent double-firing
  const instituteInfoRef  = useRef(null);    // { lat, lng, radius }
  const isPunchedInRef    = useRef(isPunchedIn);

  // Keep ref in sync with prop
  useEffect(() => {
    isPunchedInRef.current = isPunchedIn;
    // Reset checkout flag on new punch-in
    if (isPunchedIn) didCheckoutRef.current = false;
  }, [isPunchedIn]);

  // ── Load institute settings once ────────────────────────────────────────
  const loadInstituteInfo = useCallback(async () => {
    try {
      const res = await api.get('/qr/punch-settings');
      const { latitude, longitude, radiusMeters } = res.data;
      if (latitude && longitude && latitude !== 0 && longitude !== 0) {
        instituteInfoRef.current = {
          lat:    parseFloat(latitude),
          lng:    parseFloat(longitude),
          radius: parseFloat(radiusMeters) || 200,
        };
      }
    } catch {
      // Settings not configured — watcher stays dormant
    }
  }, []);

  // ── Haversine distance (metres) ──────────────────────────────────────────
  const haversine = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ── Core check: am I outside? ────────────────────────────────────────────
  const checkPosition = useCallback((lat, lng) => {
    const info = instituteInfoRef.current;
    if (!info || !isPunchedInRef.current || didCheckoutRef.current) return;

    const dist = haversine(lat, lng, info.lat, info.lng);

    if (dist > info.radius) {
      didCheckoutRef.current = true;
      // Trigger auto-checkout
      api
        .post('/qr/auto-checkout', { reason: 'GEOFENCE_EXIT' })
        .then((res) => {
          if (res.data?.status === 'CHECKED_OUT') {
            // Show browser notification if supported
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('EtMS — Auto Check-Out', {
                body: `You left the institute. Session closed. Duration: ${res.data.duration}`,
                icon: '/favicon.ico',
              });
            }
            if (onAutoCheckout) onAutoCheckout(res.data);
          }
        })
        .catch(() => {
          didCheckoutRef.current = false; // allow retry
        });
    }
  }, [onAutoCheckout]);

  // ── Start watching ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;

    // Load settings once
    loadInstituteInfo();

    // Request notification permission for auto-checkout alerts
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // 1. Layer 2: On-Load re-entry check (immediate check)
    navigator.geolocation.getCurrentPosition(
      (pos) => checkPosition(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        if (onLocationError) onLocationError(err.message);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );

    // 2. Layer 1: watchPosition fires on significant movement
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => checkPosition(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        if (err.code === 1 && onLocationError) onLocationError("PERMISSION_DENIED");
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
    );

    // Also poll every 30s as a safety net
    pollingRef.current = setInterval(() => {
      if (!isPunchedInRef.current) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => checkPosition(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }, 30_000);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [loadInstituteInfo, checkPosition]);
}
