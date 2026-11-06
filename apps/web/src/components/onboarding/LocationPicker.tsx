"use client";
import { useState } from "react";
import { CITIES, getCityBySlug } from "@/lib/cities";
import { parseCoordinates, type LocationCoordinates } from "@/lib/locations";
import { useCurrentLocation } from "@/lib/hooks/useCurrentLocation";
import { Button } from "@/components/ui/Button";
import type { DeviceLocation } from "@/lib/geolocation";

export function LocationPicker({ value, onChange }: { value: LocationCoordinates | null; onChange: (value: LocationCoordinates | null) => void }) {
  const { loading, error, fetchLocation, clearLocationRequest } = useCurrentLocation();
  const [latitude, setLatitude] = useState(value ? String(value.latitude) : "");
  const [longitude, setLongitude] = useState(value ? String(value.longitude) : "");
  const [city, setCity] = useState("");
  const [deviceFix, setDeviceFix] = useState<DeviceLocation | null>(null);
  const [source, setSource] = useState<"device"|"city"|"manual"|"existing">("existing");
  function select(at: LocationCoordinates | null, origin: typeof source) {
    clearLocationRequest();
    setSource(origin); if(origin!=="device") setDeviceFix(null);
    setLatitude(at ? String(at.latitude) : ""); setLongitude(at ? String(at.longitude) : ""); onChange(at);
  }
  return <fieldset className="flex min-w-0 flex-col gap-3">
    <legend className="mb-2 text-sm font-medium text-text-primary">Your location</legend>
    <p className="text-sm text-text-secondary">All locations are open for development testing. Use GPS, choose a city centre, or enter coordinates for any other location.</p>
    <Button type="button" variant="secondary" disabled={loading} onClick={async () => { const at = await fetchLocation(); if (at) { setCity(""); setDeviceFix(at); select({latitude:at.latitude,longitude:at.longitude},"device"); } }}>{loading ? "Finding your location…" : error ? "Try current location again" : source==="device" && value ? "Refresh current location" : "Use my current location"}</Button>
    {loading && <div className="text-sm text-text-secondary"><p role="status">Your browser may ask permission. Finding a location can take up to 35 seconds after permission is granted.</p><button type="button" onClick={clearLocationRequest} className="min-h-tap text-accent-text">Cancel location request</button></div>}
    {error && <div className="grid gap-2 text-sm"><p role="alert" className="text-danger">{error}</p><details><summary className="min-h-tap cursor-pointer py-3 text-accent-text">Help enabling location</summary><p className="text-text-secondary">In Chrome, open site controls beside the address bar and set Location to Allow. On a Mac, also check System Settings → Privacy &amp; Security → Location Services for your browser. After changing permissions, try again. Save any typed details before reloading the page.</p></details></div>}
    {value && source==="device" && deviceFix && <div role="status" className="grid gap-2 rounded-md border border-border p-4"><p className="font-semibold text-text-primary">Device location detected</p><p className="text-sm text-text-secondary">{value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}{deviceFix.accuracyMeters!==null ? ` · Estimated accuracy: ±${Math.ceil(deviceFix.accuracyMeters)} metres` : ""}</p><p className="text-sm text-text-secondary">Captured at {new Date(deviceFix.capturedAt).toLocaleTimeString()}. This selects your coordinates; it does not fill a postal address. Confirm that the location is right before continuing.</p>{deviceFix.accuracyMeters!==null && deviceFix.accuracyMeters>1000 && <p className="text-sm text-text-secondary">Your device supplied an approximate location. Refresh on a device with precise location enabled, or enter the correct coordinates below.</p>}</div>}
    <label className="flex flex-col gap-2 text-sm">Choose a city centre<select value={city} onChange={event => { setCity(event.target.value); select(getCityBySlug(event.target.value)?.center ?? null,"city"); }} className="min-h-tap w-full rounded-md border border-border bg-surface px-3 text-base text-text-primary"><option value="">Select a city (optional)</option>{CITIES.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
    {city && <p className="text-sm text-text-secondary">This uses the approximate city centre. Use GPS or coordinates for a precise address.</p>}
    <details className="text-sm"><summary className="min-h-tap cursor-pointer py-3 text-accent-text">Enter coordinates for any location</summary><div className="grid gap-3 sm:grid-cols-2">
      <label className="flex min-w-0 flex-col gap-2">Latitude<input type="number" inputMode="decimal" min={-90} max={90} step="any" value={latitude} onChange={event => { clearLocationRequest(); setSource("manual"); setDeviceFix(null); setCity(""); setLatitude(event.target.value); onChange(parseCoordinates(event.target.value, longitude)); }} className="min-h-tap w-full rounded-md border border-border bg-surface px-3 text-base text-text-primary" /></label>
      <label className="flex min-w-0 flex-col gap-2">Longitude<input type="number" inputMode="decimal" min={-180} max={180} step="any" value={longitude} onChange={event => { clearLocationRequest(); setSource("manual"); setDeviceFix(null); setCity(""); setLongitude(event.target.value); onChange(parseCoordinates(latitude, event.target.value)); }} className="min-h-tap w-full rounded-md border border-border bg-surface px-3 text-base text-text-primary" /></label>
    </div></details>
    {source!=="device" && <p role="status" className="text-sm text-text-secondary">{value ? `${source==="city"?"Approximate city centre":source==="manual"?"Manually entered location":"Location selected"}: ${value.latitude.toFixed(4)}, ${value.longitude.toFixed(4)}` : "Choose a location to continue."}</p>}
  </fieldset>;
}
