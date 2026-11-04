import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CITIES } from "@/lib/cities";

export default function CitiesPage() {
  return (
    <main className="flex flex-1 flex-col"><section className="bg-surface-secondary px-6 py-10 sm:py-14"><div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_0.8fr] md:items-center"><div><h1 className="text-4xl font-bold leading-4xl tracking-[-0.02em] text-text-primary">Open in every location for testing</h1><p className="mt-4 text-text-secondary">
          Explore CareKin from any city or area during development. The cities below are shortcuts; your location does not need to be on this list. Provider availability depends on approved profiles.
        </p></div><div className="relative min-h-56 overflow-hidden rounded-2xl"><Image src="/images/carekin/brand-v2/hero-family-care.webp" alt="A family receiving care together at home" fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" /></div></div></section><div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16">

      <form action="/search" className="flex flex-col gap-3"><label className="flex flex-col gap-2 text-sm font-medium">Your city or area<input name="area" required maxLength={200} placeholder="Enter any city or area" className="min-h-tap rounded-md border border-border bg-surface px-3 text-base text-text-primary" /></label><button type="submit" className="min-h-tap rounded-md bg-accent px-5 text-sm font-semibold text-white">Browse from this location</button></form>
      <div className="flex flex-col gap-3">
        {CITIES.map((city) => {
          const content = (
            <Card className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-text-primary">{city.name}</p>
                  <p className="text-sm text-text-secondary">{city.neighborhoods}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${city.live ? "bg-verified/10 text-verified" : "bg-surface-secondary text-text-secondary"}`}>
                {city.live ? "Open for testing" : "Coming soon"}
              </span>
            </Card>
          );
          return city.live ? (
            <Link key={city.name} href={`/cities/${city.slug}`}>
              {content}
            </Link>
          ) : (
            <div key={city.name}>{content}</div>
          );
        })}
      </div>
    </div></main>
  );
}
