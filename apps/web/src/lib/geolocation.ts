import { parseCoordinates, type LocationCoordinates } from "./locations";

export type LocationFailureReason = "denied" | "unavailable" | "timeout" | "unsupported" | "insecure";
export class LocationFailure extends Error {
  constructor(public readonly reason: LocationFailureReason) { super(reason); }
}

export function locationErrorMessage(error: unknown): string {
  const reason = error instanceof LocationFailure ? error.reason : "unavailable";
  if (reason === "denied") return "Location access is blocked. Open this site's settings beside the address bar, allow Location, then try again. Your device's Location Services must also be on.";
  if (reason === "timeout") return "Finding your location took too long. Try again, or choose a city or enter coordinates.";
  if (reason === "insecure") return "Location requires a secure connection. Open CareKin using https://, then try again.";
  if (reason === "unsupported") return "This browser does not support location access. Try another browser, or choose a city or enter coordinates.";
  return "Your device couldn’t determine your location. Turn on Location Services for your browser in your device settings, then try again. You can also choose a city or enter coordinates.";
}

function locate(geolocation: Geolocation, options: PositionOptions): Promise<LocationCoordinates> {
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(position => {
      const coordinates = parseCoordinates(String(position.coords.latitude), String(position.coords.longitude));
      if (coordinates) resolve(coordinates);
      else reject(new LocationFailure("unavailable"));
    }, error => reject(new LocationFailure(error.code === 1 ? "denied" : error.code === 3 ? "timeout" : "unavailable")), options);
  });
}

// No IP lookup, remote geocoder, logging or invented fallback coordinates.
export async function requestCurrentLocation(geolocation: Geolocation | undefined, secureContext: boolean): Promise<LocationCoordinates> {
  if (!secureContext) throw new LocationFailure("insecure");
  if (!geolocation) throw new LocationFailure("unsupported");
  try {
    return await locate(geolocation, { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 });
  } catch (error) {
    if (!(error instanceof LocationFailure) || error.reason === "denied") throw error;
    // A first network/cached fix can fail while a fresh device fix succeeds.
    return locate(geolocation, { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 });
  }
}
