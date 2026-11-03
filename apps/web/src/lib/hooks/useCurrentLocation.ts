"use client";

import { useCallback, useState } from "react";

// Koramangala, Bengaluru — used as a same-neighborhood fallback so the
// "Use my location" button always produces something plausible even when
// browser geolocation is denied (common in sandboxed/demo environments).
const FALLBACK = { latitude: 12.9352, longitude: 77.6146 };

export function useCurrentLocation() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const fetchLocation = useCallback(() => {
    setLoading(true);
    setUsedFallback(false);
    if (!("geolocation" in navigator)) {
      setCoords(FALLBACK);
      setUsedFallback(true);
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLoading(false);
      },
      () => {
        setCoords(FALLBACK);
        setUsedFallback(true);
        setLoading(false);
      },
      { timeout: 5000 },
    );
  }, []);

  return { coords, loading, usedFallback, fetchLocation };
}
