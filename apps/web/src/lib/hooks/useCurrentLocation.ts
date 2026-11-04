"use client";

import { useCallback, useState } from "react";
import type { LocationCoordinates } from "@/lib/locations";

export function useCurrentLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fetchLocation = useCallback(async (): Promise<LocationCoordinates | null> => {
    setLoading(true); setError("");
    try {
      if (!("geolocation" in navigator)) throw new Error("Location unavailable");
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 }));
      return { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch {
      setError("We couldn’t access your location. Choose a city or enter coordinates below.");
      return null;
    } finally { setLoading(false); }
  }, []);
  return { loading, error, fetchLocation };
}
