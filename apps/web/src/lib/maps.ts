import { parseCoordinates, type LocationCoordinates } from "./locations";

export type AddressPlace = LocationCoordinates & { id: string; formatted: string; line1: string; line2: string };
class LookupFailure extends Error {}

function text(value: unknown, limit = 1000) { return typeof value === "string" ? value.trim().slice(0, limit) : ""; }
export function parseAddressPlaces(payload: unknown): AddressPlace[] {
  if (!payload || typeof payload !== "object" || !("results" in payload) || !Array.isArray(payload.results)) return [];
  return payload.results.slice(0, 5).flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const at = parseCoordinates(String(record.lat ?? ""), String(record.lon ?? ""));
    const formatted = text(record.formatted);
    if (!at || !formatted) return [];
    return [{ ...at, id: text(record.place_id, 300) || `${at.latitude},${at.longitude}`, formatted, line1: text(record.address_line1, 300) || formatted, line2: text(record.address_line2, 500) }];
  });
}

export function confirmedAddress(place: AddressPlace, unit: string, landmark: string) {
  return [unit.trim().slice(0, 120), place.formatted, landmark.trim() ? `Near ${landmark.trim().slice(0, 120)}` : ""].filter(Boolean).join(", ");
}

async function lookup(kind: "autocomplete" | "reverse", params: Record<string, string>, signal: AbortSignal): Promise<AddressPlace[]> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) controller.abort();
  const timer = setTimeout(abort, 12000);
  try {
    const body = kind === "autocomplete" ? { kind, text: params.text } : { kind, latitude: Number(params.lat), longitude: Number(params.lon) };
    const response = await fetch("/api/maps/address", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal });
    if (!response.ok) throw new LookupFailure(response.status === 429 ? "Address lookup is busy. Wait a moment and try again." : response.status === 401 || response.status === 403 ? "Map access is unavailable. Please use manual location entry or contact support." : "We couldn’t look up this address. Please try again.");
    return parseAddressPlaces(await response.json());
  } catch (error) {
    if (signal.aborted) throw error;
    if (controller.signal.aborted) throw new Error("Address lookup timed out. Check your connection and try again.");
    throw error instanceof LookupFailure ? error : new Error("Address lookup is unavailable. Check your connection and try again.");
  } finally { clearTimeout(timer); signal.removeEventListener("abort", abort); }
}

export function searchAddresses(query: string, signal: AbortSignal) {
  return lookup("autocomplete", { text: query.trim().slice(0, 200) }, signal);
}
export async function reverseAddress(at: LocationCoordinates, signal: AbortSignal): Promise<AddressPlace> {
  const matches = await lookup("reverse", { lat: String(at.latitude), lon: String(at.longitude) }, signal);
  if (!matches[0]) throw new Error("No street address was found here. Move the pin nearer a road or search for your area.");
  // The confirmed pin remains where the user placed it. Reverse-geocoding
  // results may describe a nearby building; never silently snap the coordinates.
  return { ...matches[0], ...at };
}
