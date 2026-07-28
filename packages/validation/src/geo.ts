import { z } from "zod";

// z.coerce so this also validates raw query-string / form-data values, not
// just JSON bodies where numbers already arrive as numbers.
export const GeoPoint = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});
export type GeoPoint = z.infer<typeof GeoPoint>;
