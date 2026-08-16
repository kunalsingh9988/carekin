export interface CityInfo {
  name: string;
  slug: string;
  neighborhoods: string;
  live: boolean;
}

// Pilot-city data (Section 5.2: "SEO acquisition + hyperlocal trust").
// Only Bengaluru/Koramangala is actually live, matching the seed data's
// provider locations.
export const CITIES: CityInfo[] = [
  { name: "Bengaluru", slug: "bengaluru", neighborhoods: "Koramangala", live: true },
  { name: "Mumbai", slug: "mumbai", neighborhoods: "—", live: false },
  { name: "Delhi NCR", slug: "delhi-ncr", neighborhoods: "—", live: false },
];

export function getCityBySlug(slug: string): CityInfo | undefined {
  return CITIES.find((c) => c.slug === slug);
}
