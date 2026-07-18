import { useState } from "react";
import * as Location from "expo-location";

export function useCurrentLocation() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchLocation() {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied — enter your address manually.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch {
      setError("Could not get location — enter your address manually.");
    } finally {
      setLoading(false);
    }
  }

  return { coords, error, loading, fetchLocation };
}
