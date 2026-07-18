import { z } from "zod";
import { ProviderType } from "./enums";
import { GeoPoint } from "./geo";

// Browse/search is scoped to a single launch city/neighborhood in Phase 1 —
// no multi-city routing (Section 1, Section 11). radiusKm is capped to keep
// results local by construction, not just by convention.
export const SearchProvidersInput = z.object({
  serviceType: ProviderType,
  radiusKm: z.coerce.number().positive().max(25).default(10),
}).merge(GeoPoint);
export type SearchProvidersInput = z.infer<typeof SearchProvidersInput>;
