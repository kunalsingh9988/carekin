export interface CityInfo {
  name: string;
  slug: string;
  neighborhoods: string;
  live: boolean;
  center: { latitude: number; longitude: number };
}

// Suggested locations, not a service-area whitelist. Development is open everywhere.
export const CITIES: CityInfo[] = [
  {
    name: "Bengaluru",
    slug: "bengaluru",
    neighborhoods: "All areas · development access",
    live: true,
    center: { latitude: 12.9352, longitude: 77.6146 },
  },
  { name: "Mumbai", slug: "mumbai", neighborhoods: "All areas · development access", live: true, center: { latitude: 19.076, longitude: 72.8777 } },
  { name: "Delhi NCR", slug: "delhi-ncr", neighborhoods: "All areas · development access", live: true, center: { latitude: 28.6139, longitude: 77.209 } },
  { name: "Hyderabad", slug: "hyderabad", neighborhoods: "All areas · development access", live: true, center: { latitude: 17.385, longitude: 78.4867 } },
  { name: "Chennai", slug: "chennai", neighborhoods: "All areas · development access", live: true, center: { latitude: 13.0827, longitude: 80.2707 } },
  { name: "Kolkata", slug: "kolkata", neighborhoods: "All areas · development access", live: true, center: { latitude: 22.5726, longitude: 88.3639 } },
  { name: "Pune", slug: "pune", neighborhoods: "All areas · development access", live: true, center: { latitude: 18.5204, longitude: 73.8567 } },
  { name: "Ahmedabad", slug: "ahmedabad", neighborhoods: "All areas · development access", live: true, center: { latitude: 23.0225, longitude: 72.5714 } },
  { name: "Jaipur", slug: "jaipur", neighborhoods: "All areas · development access", live: true, center: { latitude: 26.9124, longitude: 75.7873 } },
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
