"use client";
import { useState } from "react";
import { CITIES, getCityBySlug } from "@/lib/cities";
import { parseCoordinates, type LocationCoordinates } from "@/lib/locations";
import { useCurrentLocation } from "@/lib/hooks/useCurrentLocation";
import { Button } from "@/components/ui/Button";

export function LocationPicker({ value, onChange }: { value: LocationCoordinates | null; onChange: (value: LocationCoordinates | null) => void }) {
  const { loading, error, fetchLocation } = useCurrentLocation();
  const [latitude, setLatitude] = useState(value ? String(value.latitude) : "");
  const [longitude, setLongitude] = useState(value ? String(value.longitude) : "");
  const [city, setCity] = useState("");
  function select(at: LocationCoordinates | null) {
    setLatitude(at ? String(at.latitude) : ""); setLongitude(at ? String(at.longitude) : ""); onChange(at);
  }
  return <fieldset className="flex min-w-0 flex-col gap-3">
    <legend className="mb-2 text-sm font-medium text-text-primary">Your location</legend>
    <p className="text-sm text-text-secondary">All locations are open for development testing. Use GPS, choose a city centre, or enter coordinates for any other location.</p>
    <Button type="button" variant="secondary" disabled={loading} onClick={async () => { const at = await fetchLocation(); if (at) { setCity(""); select(at); } }}>{loading ? "Locating…" : "Use my current location"}</Button>
    <label className="flex flex-col gap-2 text-sm">Choose a city centre<select value={city} onChange={event => { setCity(event.target.value); select(getCityBySlug(event.target.value)?.center ?? null); }} className="min-h-tap w-full rounded-md border border-border bg-surface px-3 text-base text-text-primary"><option value="">Select a city (optional)</option>{CITIES.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
    {city && <p className="text-sm text-text-secondary">This uses the approximate city centre. Use GPS or coordinates for a precise address.</p>}
    <details className="text-sm"><summary className="min-h-tap cursor-pointer py-3 text-accent-text">Enter coordinates for any location</summary><div className="grid gap-3 sm:grid-cols-2">
      <label className="flex min-w-0 flex-col gap-2">Latitude<input type="number" inputMode="decimal" min={-90} max={90} step="any" value={latitude} onChange={event => { setCity(""); setLatitude(event.target.value); onChange(parseCoordinates(event.target.value, longitude)); }} className="min-h-tap w-full rounded-md border border-border bg-surface px-3 text-base text-text-primary" /></label>
      <label className="flex min-w-0 flex-col gap-2">Longitude<input type="number" inputMode="decimal" min={-180} max={180} step="any" value={longitude} onChange={event => { setCity(""); setLongitude(event.target.value); onChange(parseCoordinates(latitude, event.target.value)); }} className="min-h-tap w-full rounded-md border border-border bg-surface px-3 text-base text-text-primary" /></label>
    </div></details>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <p role="status" className="text-sm text-text-secondary">{value ? `Location selected: ${value.latitude.toFixed(4)}, ${value.longitude.toFixed(4)}` : "Choose a location to continue."}</p>
  </fieldset>;
}
