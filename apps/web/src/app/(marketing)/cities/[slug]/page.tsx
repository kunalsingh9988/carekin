import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCityBySlug } from "@/lib/cities";
import { Card } from "@/components/ui/Card";

// SEO acquisition + hyperlocal trust (Section 5.2) — organic traffic
// should land here, not on the generic homepage, and convert straight
// into /search scoped to this city.
export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city || !city.live) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Elder care and babysitting",
    provider: { "@type": "LocalBusiness", name: "CareKin", areaServed: city.name },
    areaServed: { "@type": "City", name: city.name },
  };

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="text-center">
        <h1 className="text-4xl font-bold leading-4xl text-text-primary">Verified caregivers &amp; babysitters in {city.name}</h1>
        <p className="mt-2 text-text-secondary">
          Live in {city.neighborhoods} — every provider passes ID verification, a police check, and an in-person
          interview before appearing here.
        </p>
      </div>

      <Card className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 shrink-0 text-verified" />
        <p className="text-sm text-text-primary">Every provider in {city.name} is verified the same way, no exceptions.</p>
      </Card>

      <Link
        href={`/search?city=${city.slug}`}
        className="min-h-tap mx-auto flex items-center rounded-md bg-accent px-6 text-base font-semibold text-white transition-colors hover:bg-accent-text"
      >
        Search verified caregivers in {city.name}
      </Link>
    </main>
  );
}
