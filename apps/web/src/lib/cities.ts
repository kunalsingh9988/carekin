export interface CityInfo {
  name: string;
  slug: string;
  neighborhoods: string;
  live: boolean;
  center: { latitude: number; longitude: number };
}

// Pilot-city data (Section 5.2: "SEO acquisition + hyperlocal trust").
// Only Bengaluru/Koramangala is actually live, matching the seed data's
// provider locations.
export const CITIES: CityInfo[] = [
  {
    name: "Bengaluru",
    slug: "bengaluru",
    neighborhoods: "Koramangala",
    live: true,
    center: { latitude: 12.9352, longitude: 77.6146 },
  },
  { name: "Mumbai", slug: "mumbai", neighborhoods: "—", live: false, center: { latitude: 19.076, longitude: 72.8777 } },
  { name: "Delhi NCR", slug: "delhi-ncr", neighborhoods: "—", live: false, center: { latitude: 28.6139, longitude: 77.209 } },
];

export function getCityBySlug(slug: string): CityInfo | undefined {
  return CITIES.find((c) => c.slug === slug);
}

// Fuzzy match for the homepage "enter your area" box — matches a free-text
// query against city names, slugs, and neighborhood names so "koramangala"
// or "Bangalore" both land somewhere sensible.
export function findCityByAreaText(query: string): CityInfo | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  const ALIASES: Record<string, string> = { bangalore: "bengaluru", delhi: "delhi-ncr", ncr: "delhi-ncr", bombay: "mumbai" };
  const slug = ALIASES[q] ?? q;
  return CITIES.find(
    (c) =>
      c.slug === slug ||
      c.name.toLowerCase() === q ||
      c.name.toLowerCase().includes(q) ||
      c.neighborhoods.toLowerCase().includes(q),
  );
}
