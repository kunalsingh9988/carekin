"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LocationCoordinates } from "@/lib/locations";
import { locationErrorMessage, requestCurrentLocation } from "@/lib/geolocation";

export function useCurrentLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const pending = useRef<Promise<LocationCoordinates | null> | null>(null);
  useEffect(() => () => { generation.current++; }, []);
  const clearLocationRequest = useCallback(() => {
    generation.current++; pending.current=null; setLoading(false); setError("");
  }, []);
  const fetchLocation = useCallback((): Promise<LocationCoordinates | null> => {
    if (pending.current) return pending.current;
    const requestId=++generation.current;
    setLoading(true); setError("");
    const request=requestCurrentLocation(navigator.geolocation, window.isSecureContext).then(location =>
      requestId === generation.current ? location : null
    ).catch(error => {
      if (requestId === generation.current) setError(locationErrorMessage(error));
      return null;
    }).finally(() => {
      if (requestId === generation.current) { pending.current=null; setLoading(false); }
    });
    pending.current=request;
    return request;
  }, []);
  return { loading, error, fetchLocation, clearLocationRequest };
}
