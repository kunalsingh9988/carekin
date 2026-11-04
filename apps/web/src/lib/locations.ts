export type LocationCoordinates = { latitude: number; longitude: number };

// Covers the maximum great-circle distance on Earth, for development discovery.
export const ALL_LOCATIONS_RADIUS_KM = 20040;

export function parseCoordinates(latitude: string, longitude: string): LocationCoordinates | null {
  if (!latitude.trim() || !longitude.trim()) return null;
  const lat = Number(latitude), lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    ? { latitude: lat, longitude: lng } : null;
}
