"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { LocationCoordinates } from "@/lib/locations";

export type MapView = LocationCoordinates & { zoom: number; revision: number };
export function AddressMap({ view, onMoving, onMoved }: { view: MapView; onMoving: () => void; onMoved: (at: LocationCoordinates, zoom: number) => void }) {
  const container = useRef<HTMLDivElement>(null), map = useRef<LeafletMap | null>(null);
  const callbacks = useRef({ onMoving, onMoved }), latestView = useRef(view), programmatic = useRef(false), programmaticTimer = useRef(0);
  const [failed, setFailed] = useState(false), [ready, setReady] = useState(false);
  useEffect(() => { callbacks.current = { onMoving, onMoved }; latestView.current = view; });
  // Leaflet debounces moveend (and invalidateSize's move) asynchronously, so a
  // flag cleared synchronously never covers the echo. Hold it through the
  // debounce window after every programmatic change, or each echo reports a
  // slightly different centre and retriggers the lookup that caused it.
  const runProgrammatic = (run: () => void) => {
    programmatic.current = true; run();
    window.clearTimeout(programmaticTimer.current);
    programmaticTimer.current = window.setTimeout(() => { programmatic.current = false; }, 250);
  };
  useEffect(() => {
    let disposed = false;
    void import("leaflet").then(L => {
      if (disposed || !container.current) return;
      const initial = latestView.current;
      const instance = L.map(container.current, { scrollWheelZoom: false, zoomControl: true, keyboard: true, dragging: true }).setView([initial.latitude, initial.longitude], initial.zoom);
      map.current = instance;
      const tiles = L.tileLayer(`/api/maps/tiles/{z}/{x}/{y}?retina=${L.Browser.retina ? "1" : "0"}`, { maxZoom: 20, keepBuffer: 1, updateWhenIdle: true, updateWhenZooming: false, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors | Tiles: Geoapify / <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer">OpenStreetMap</a>' });
      tiles.on("tileerror", () => { if (!disposed) setFailed(true); });
      tiles.on("tileload", () => { if (!disposed) { setReady(true); setFailed(false); } });
      tiles.addTo(instance);
      let userMoved = false;
      instance.on("movestart", () => { if (!programmatic.current) { userMoved = true; callbacks.current.onMoving(); } });
      instance.on("moveend", () => {
        // Only a moveend paired with a user-initiated movestart is real —
        // programmatic setView/invalidateSize echoes arrive debounced and
        // must never start another lookup, or the loop restarts forever.
        if (!userMoved) return;
        userMoved = false;
        const at = instance.getCenter().wrap();
        callbacks.current.onMoved({ latitude: at.lat, longitude: at.lng }, instance.getZoom());
      });
      const observer = new ResizeObserver(() => runProgrammatic(() => instance.invalidateSize({ pan: false })));
      observer.observe(container.current);
      instance.on("unload", () => observer.disconnect());
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; map.current?.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    runProgrammatic(() => map.current!.setView([view.latitude, view.longitude], view.zoom, { animate: false }));
  }, [view]);
  return <div className="relative isolate min-h-72 overflow-hidden rounded-lg bg-surface-secondary sm:min-h-96">
    <div ref={container} tabIndex={0} role="region" aria-label="Address map. Drag the map or use arrow keys to position the pin." className="absolute inset-0 z-0" />
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full text-accent" aria-hidden="true"><MapPin className="h-10 w-10 fill-accent stroke-white" strokeWidth={1.5} /></div>
    {!ready && !failed && <p role="status" className="pointer-events-none absolute bottom-9 left-3 right-3 rounded-md bg-surface p-3 text-sm text-text-primary">Loading map…</p>}
    {failed && <p role="alert" className="absolute bottom-9 left-3 right-3 z-10 rounded-md bg-surface p-3 text-sm text-danger">The map couldn’t load. Search for an address or use the manual location options.</p>}
  </div>;
}
