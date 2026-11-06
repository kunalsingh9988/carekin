"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";
import { useCurrentLocation } from "@/lib/hooks/useCurrentLocation";
import { confirmedAddress, reverseAddress, searchAddresses, type AddressPlace } from "@/lib/maps";
import type { LocationCoordinates } from "@/lib/locations";
import { AddressMap, type MapView } from "./AddressMap";

type Props = { value: LocationCoordinates | null; address?: string; onChange: (at: LocationCoordinates | null) => void; onAddressConfirmed?: (address: string) => void };

export function AddressPicker({ value, address, onChange, onAddressConfirmed }: Props) {
  const [open, setOpen] = useState(false), [useGps, setUseGps] = useState(false), [confirmed, setConfirmed] = useState("");
  const summary = confirmed || address;
  return <fieldset className="grid min-w-0 gap-3">
    <legend className="mb-2 text-sm font-medium">Your location</legend>
    <p className="text-sm text-text-secondary">Choose the address where care is needed. You can search, use your device location, or adjust the map pin.</p>
    {value && <div className="flex min-w-0 items-start gap-3 rounded-md border border-border p-4"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" /><div className="min-w-0"><p className="font-medium">{summary ? "Selected care address" : "Location selected"}</p><p className="mt-1 break-words text-sm text-text-secondary">{summary || "Choose on the map to review and confirm the street address."}</p></div></div>}
    <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => { setUseGps(true); setOpen(true); }}><LocateFixed size={18} />Use current location</Button><Button type="button" variant="secondary" onClick={() => { setUseGps(false); setOpen(true); }}><Search size={18} />{value ? "Change address" : "Search address or choose on map"}</Button></div>
    <p className="text-sm text-text-secondary">Opening the picker shares your searches and selected map area with <a href="https://www.geoapify.com/privacy-policy/" target="_blank" rel="noreferrer" className="text-accent-text underline">Geoapify</a>. Flat and landmark details stay in CareKin.</p>
    {open && <AddressDialog initial={value} autoLocate={useGps} onClose={() => setOpen(false)} onConfirm={(place, details) => { onChange({ latitude: place.latitude, longitude: place.longitude }); setConfirmed(details); onAddressConfirmed?.(details); setOpen(false); }} />}
  </fieldset>;
}

function AddressDialog({ initial, autoLocate, onClose, onConfirm }: { initial: LocationCoordinates | null; autoLocate: boolean; onClose: () => void; onConfirm: (place: AddressPlace, address: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { loading: gpsLoading, error: gpsError, fetchLocation, clearLocationRequest } = useCurrentLocation();
  const [view, setView] = useState<MapView>({ ...(initial || { latitude: 20.5937, longitude: 78.9629 }), zoom: initial ? 16 : 5, revision: 0 });
  const [place, setPlace] = useState<AddressPlace | null>(null), [resolving, setResolving] = useState(false);
  const [lookupError, setLookupError] = useState(""), [accuracy, setAccuracy] = useState<number | null>(null);
  const [query, setQuery] = useState(""), [suggestions, setSuggestions] = useState<AddressPlace[]>([]), [searchBusy, setSearchBusy] = useState(false), [searchError, setSearchError] = useState("");
  const [unit, setUnit] = useState(""), [landmark, setLandmark] = useState("");
  const reverseController = useRef<AbortController | null>(null), generation = useRef(0);
  const cancelLookup = useCallback(() => { generation.current++; reverseController.current?.abort(); }, []);
  const resolvePoint = useCallback(async (at: LocationCoordinates) => {
    cancelLookup(); const request = generation.current;
    const controller = new AbortController(); reverseController.current = controller;
    setResolving(true); setPlace(null); setLookupError("");
    try { const found = await reverseAddress(at, controller.signal); if (request === generation.current) setPlace(found); }
    catch (error) { if (request === generation.current && !controller.signal.aborted) setLookupError(error instanceof Error ? error.message : "We couldn’t find this address. Try searching instead."); }
    finally { if (request === generation.current) setResolving(false); }
  }, [cancelLookup]);
  const detect = useCallback(async () => {
    cancelLookup(); setResolving(false); setPlace(null); setLookupError(""); setQuery(""); setSuggestions([]); setSearchBusy(false);
    const at = await fetchLocation();
    if (!at) return;
    setAccuracy(at.accuracyMeters);
    setView(current => ({ latitude: at.latitude, longitude: at.longitude, zoom: 17, revision: current.revision + 1 }));
    await resolvePoint({ latitude: at.latitude, longitude: at.longitude });
  }, [cancelLookup, fetchLocation, resolvePoint]);
  useEffect(() => {
    dialog.current?.showModal();
    const previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    let active = true;
    queueMicrotask(() => { if (!active) return; if (autoLocate) void detect(); else if (initial) void resolvePoint(initial); });
    return () => { active = false; cancelLookup(); document.body.style.overflow = previousOverflow; };
  }, [autoLocate, initial, detect, resolvePoint, cancelLookup]);
  useEffect(() => {
    if (query.trim().length < 3) return;
    let active = true; const controller = new AbortController();
    const timer = setTimeout(async () => {
      try { const results = await searchAddresses(query, controller.signal); if (active) { setSuggestions(results); setSearchError(results.length ? "" : "No matching address. Try a nearby road, area or landmark."); } }
      catch (error) { if (active && !controller.signal.aborted) setSearchError(error instanceof Error ? error.message : "Search is unavailable. Please try again."); }
      finally { if (active) setSearchBusy(false); }
    }, 500);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [query]);
  function editQuery(value: string) {
    clearLocationRequest(); cancelLookup(); setResolving(false); setPlace(null); setQuery(value); setSuggestions([]); setSearchBusy(value.trim().length >= 3); setSearchError(""); setLookupError("");
  }
  function choose(found: AddressPlace) {
    clearLocationRequest(); cancelLookup(); setResolving(false); setAccuracy(null); setPlace(found); setLookupError(""); setQuery(""); setSuggestions([]); setSearchBusy(false);
    setView(current => ({ latitude: found.latitude, longitude: found.longitude, zoom: 17, revision: current.revision + 1 }));
  }
  function mapMoving() { clearLocationRequest(); cancelLookup(); setResolving(true); setPlace(null); setLookupError(""); setAccuracy(null); }
  function mapMoved(at: LocationCoordinates, zoom: number) { setQuery(""); setSearchBusy(false); setSuggestions([]); setView(current => ({ ...at, zoom, revision: current.revision + 1 })); void resolvePoint(at); }
  return <dialog ref={dialog} aria-labelledby="address-picker-title" onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => { if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault(); }} className="m-auto max-h-[92dvh] w-[calc(100%_-_1rem)] max-w-4xl overflow-y-auto overscroll-contain rounded-lg bg-surface p-0 text-text-primary backdrop:bg-black/50 sm:w-[calc(100%_-_3rem)]">
    <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 sm:px-6"><h2 id="address-picker-title" className="text-xl font-semibold">Choose your care address</h2><button type="button" aria-label="Close address picker without changes" onClick={onClose} className="flex min-h-tap min-w-tap items-center justify-center"><X size={20} /></button></div>
    <div className="grid gap-5 p-4 sm:p-6">
      <div><label className="flex flex-col gap-2 text-sm font-medium">Search for an area, street or landmark<div className="flex items-center gap-3 rounded-md border border-border bg-surface px-3"><Search className="h-5 w-5 shrink-0 text-text-secondary" /><input type="search" autoComplete="off" value={query} onChange={event => editQuery(event.target.value)} maxLength={200} placeholder="Try a road, apartment or neighbourhood" className="min-h-tap w-full min-w-0 border-0 bg-transparent text-base text-text-primary" aria-describedby="address-search-help" aria-controls="address-search-results" /></div></label><p id="address-search-help" className="mt-2 text-sm text-text-secondary">Type at least 3 characters, then choose an address from the results.</p>
        {searchBusy && <p role="status" className="mt-2 text-sm text-text-secondary">Searching addresses…</p>}{searchError && <p role="status" className="mt-2 text-sm text-danger">{searchError}</p>}
        <ul id="address-search-results" className="divide-y divide-border">{suggestions.map(found => <li key={found.id}><button type="button" onClick={() => choose(found)} className="flex min-h-tap w-full items-start gap-3 py-3 text-left hover:bg-surface-secondary"><MapPin className="mt-1 h-5 w-5 shrink-0 text-accent-text" /><span className="min-w-0"><span className="block break-words font-medium">{found.line1}</span><span className="block break-words text-sm text-text-secondary">{found.line2 || found.formatted}</span></span></button></li>)}</ul>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2"><Button type="button" variant="secondary" disabled={gpsLoading} onClick={() => void detect()}><LocateFixed size={18} />{gpsLoading ? "Finding your location…" : "Use current location"}</Button><p className="text-sm text-text-secondary">Move the map to adjust the pin.</p></div>
      {gpsLoading && <div className="text-sm text-text-secondary"><p role="status">Allow location in your browser. This can take up to 35 seconds.</p><button type="button" onClick={() => { clearLocationRequest(); setResolving(false); }} className="min-h-tap text-accent-text">Cancel location request</button></div>}
      {gpsError && <p role="alert" className="text-sm text-danger">{gpsError} You can still search or move the map.</p>}
      <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <AddressMap view={view} onMoving={mapMoving} onMoved={mapMoved} />
        <div className="grid min-w-0 content-start gap-4">
          <div aria-live="polite"><h3 className="text-lg font-semibold">Care will be arranged here</h3>{resolving ? <p className="mt-2 text-sm text-text-secondary">Finding the address under the pin…</p> : place ? <><p className="mt-2 break-words font-medium">{place.line1}</p><p className="mt-1 break-words text-sm text-text-secondary">{place.line2 || place.formatted}</p></> : <p className="mt-2 text-sm text-text-secondary">Search for an address, use GPS or move the map to select a location.</p>}</div>
          {lookupError && <div><p role="alert" className="text-sm text-danger">{lookupError}</p><Button type="button" variant="ghost" onClick={() => void resolvePoint(view)}>Retry address lookup</Button></div>}
          {accuracy !== null && <p className="text-sm text-text-secondary">Device accuracy: approximately {Math.ceil(accuracy)} metres. Adjust the pin to the correct entrance{accuracy > 1000 ? "—your device supplied only an approximate position" : ""}.</p>}
          <TextField label="Flat, house number or floor (optional)" value={unit} maxLength={120} onChange={event => setUnit(event.target.value)} autoComplete="address-line2" />
          <TextField label="Nearby landmark (optional)" value={landmark} maxLength={120} onChange={event => setLandmark(event.target.value)} />
          <p className="text-sm text-text-secondary">Check the address and entrance before confirming. GPS cannot identify your flat or floor.</p>
          <Button type="button" disabled={!place || resolving || gpsLoading} onClick={() => { if (place) onConfirm(place, confirmedAddress(place, unit, landmark)); }} fullWidth>Confirm location</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel—keep previous location</Button>
        </div>
      </div>
      <p className="text-sm text-text-secondary">Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer" className="text-accent-text underline">Geoapify</a> · © <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer" className="text-accent-text underline">OpenMapTiles</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="text-accent-text underline">OpenStreetMap contributors</a>. Confirming updates this form only; save the form to update your profile.</p>
    </div>
  </dialog>;
}
