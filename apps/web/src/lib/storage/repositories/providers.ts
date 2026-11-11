import { backendEnabled } from "@/lib/backend/config";
import { remote } from "@/lib/backend/browser";
import { developmentProviderRecord, isDevelopmentProviderId } from "@/lib/development-providers";
import { get, newId, set } from "../client";
import type {
  DocumentType,
  Provider,
  ProviderDocument,
  ProviderType,
  VerificationReview,
  VerificationStatus,
} from "../types";

const PROVIDERS_KEY = "providers";
const DOCUMENTS_KEY = "providerDocuments";
const REVIEWS_KEY = "verificationReviews";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const bounded = Math.min(1, Math.max(0, a));
  return R * 2 * Math.atan2(Math.sqrt(bounded), Math.sqrt(1 - bounded));
}

export interface ProviderSearchFilters {
  type: ProviderType;
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

export interface ProviderWithDistance extends Provider {
  distance_km: number;
}

// Guest-safe projection — no phone, no exact coordinates. `/search` and
// `/providers/[slug]` are public routes; a provider's phone number and
// precise location must never reach the client on those pages, not just
// be hidden by the UI (Guardrails: "guest-safe data only on public routes").
export type GuestSafeProvider = Omit<Provider, "phone" | "latitude" | "longitude">;
export interface GuestSafeProviderWithDistance extends GuestSafeProvider {
  distance_km: number;
}

function toGuestSafe<T extends Provider>(p: T): Omit<T, "phone" | "latitude" | "longitude"> {
  const rest: Partial<T> = { ...p };
  delete rest.phone;
  delete rest.latitude;
  delete rest.longitude;
  return rest as Omit<T, "phone" | "latitude" | "longitude">;
}

// Mirrors the real RLS-gated search RPC: verification_status === 'approved'
// is filtered HERE, inside the data layer, never left to the UI to hide
// (Guardrails, Section 2/5 — the one rule that must survive unchanged).
 async function demo_listApprovedProviders(filters: ProviderSearchFilters): Promise<GuestSafeProviderWithDistance[]> {
  const radiusKm = filters.radiusKm ?? 10;
  const all = get<Provider[]>(PROVIDERS_KEY, []);
  return all
    .filter((p) => p.verification_status === "approved" && p.type === filters.type)
    .map((p) => ({ ...p, distance_km: haversineKm(filters.latitude, filters.longitude, p.latitude, p.longitude) }))
    .filter((p) => p.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km)
    .map(toGuestSafe);
}

// Guest-safe single-provider lookup for the public `/providers/[slug]` page.
// Returns null for anything not approved — same gating rule, single-record
// form (a guest must never see a pending/rejected provider by guessing an id).
 async function demo_getProviderPublic(id: string): Promise<GuestSafeProvider | null> {
  const provider = await getProvider(id);
  if (!provider || provider.verification_status !== "approved") return null;
  return toGuestSafe(provider);
}

// Full record — for authenticated/internal use only (booking creation,
// provider's own dashboard, admin). Never returned to a guest-facing page.
 async function demo_getProvider(id: string): Promise<Provider | null> {
  const all = get<Provider[]>(PROVIDERS_KEY, []);
  return all.find((p) => p.id === id) ?? null;
}

 async function demo_getMyProvider(userId: string): Promise<Provider | null> {
  const all = get<Provider[]>(PROVIDERS_KEY, []);
  return all.find((p) => p.user_id === userId) ?? null;
}

 async function demo_createProviderProfile(
  userId: string,
  input: {
    type: ProviderType;
    name: string;
    phone: string;
    bio?: string;
    serviceRadiusKm: number;
    latitude: number;
    longitude: number;
  },
): Promise<Provider> {
  const all = get<Provider[]>(PROVIDERS_KEY, []);
  const now = new Date().toISOString();
  const created: Provider = {
    id: newId(),
    user_id: userId,
    type: input.type,
    name: input.name,
    phone: input.phone,
    bio: input.bio ?? null,
    service_radius_km: input.serviceRadiusKm,
    latitude: input.latitude,
    longitude: input.longitude,
    verification_status: "pending",
    photo_seed: input.name,
    created_at: now,
    updated_at: now,
  };
  set(PROVIDERS_KEY, [...all, created]);

  const reviews = get<VerificationReview[]>(REVIEWS_KEY, []);
  const initialReview: VerificationReview = {
    id: newId(),
    provider_id: created.id,
    from_status: null,
    to_status: "pending",
    reviewed_by: null,
    reason: "Application submitted",
    created_at: now,
  };
  set(REVIEWS_KEY, [...reviews, initialReview]);

  return created;
}

 async function demo_submitDocuments(
  providerId: string,
  docs: { type: DocumentType; filename: string; storage_key?: string }[],
): Promise<ProviderDocument[]> {
  const all = get<ProviderDocument[]>(DOCUMENTS_KEY, []);
  const now = new Date().toISOString();
  const created = docs.map(
    (d): ProviderDocument => ({
      id: newId(),
      provider_id: providerId,
      type: d.type,
      filename: d.filename,
      status: "pending",
      uploaded_at: now,
    }),
  );
  set(DOCUMENTS_KEY, [...all, ...created]);
  return created;
}

 async function demo_getDocuments(providerId: string): Promise<ProviderDocument[]> {
  const all = get<ProviderDocument[]>(DOCUMENTS_KEY, []);
  return all.filter((d) => d.provider_id === providerId);
}

 async function demo_getVerificationStatus(
  providerId: string,
): Promise<{ status: VerificationStatus; reviews: VerificationReview[] }> {
  const provider = await getProvider(providerId);
  const reviews = get<VerificationReview[]>(REVIEWS_KEY, []).filter((r) => r.provider_id === providerId);
  return { status: provider?.verification_status ?? "pending", reviews: reviews.sort((a, b) => a.created_at.localeCompare(b.created_at)) };
}

// Backend adapters
export const listApprovedProviders: typeof demo_listApprovedProviders = (...args) => backendEnabled ? remote("providers.listApprovedProviders", args) : demo_listApprovedProviders(...args);
// Development fixtures resolve before any store lookup — demo ids can never
// exist in the database (they are not UUIDs), so the fixture projection is
// unambiguous in both modes.
export const getProviderPublic: typeof demo_getProviderPublic = async (id) => {
  if (isDevelopmentProviderId(id)) {
    const fixture = developmentProviderRecord(id);
    return fixture ? toGuestSafe(fixture) : null;
  }
  return backendEnabled ? remote("providers.getProviderPublic", [id]) : demo_getProviderPublic(id);
};
export const getProvider: typeof demo_getProvider = async (id) => {
  if (isDevelopmentProviderId(id)) return developmentProviderRecord(id);
  return backendEnabled ? remote("providers.getProvider", [id]) : demo_getProvider(id);
};
export const getMyProvider: typeof demo_getMyProvider = (...args) => backendEnabled ? remote("providers.getMyProvider", args) : demo_getMyProvider(...args);
export const createProviderProfile: typeof demo_createProviderProfile = (...args) => backendEnabled ? remote("providers.createProviderProfile", args) : demo_createProviderProfile(...args);
export const submitDocuments: typeof demo_submitDocuments = (...args) => backendEnabled ? remote("providers.submitDocuments", args) : demo_submitDocuments(...args);
export const getDocuments: typeof demo_getDocuments = (...args) => backendEnabled ? remote("providers.getDocuments", args) : demo_getDocuments(...args);
export const getVerificationStatus: typeof demo_getVerificationStatus = (...args) => backendEnabled ? remote("providers.getVerificationStatus", args) : demo_getVerificationStatus(...args);
