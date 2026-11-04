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
  if (!slug.trim() || slug.length > 120) notFound();
  const locationName = city?.name ?? slug.replaceAll("-", " ");

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="text-center">
        <h1 className="break-words text-4xl font-bold leading-4xl text-text-primary">Explore CareKin from {locationName}</h1>
        <p className="mt-2 text-text-secondary">
          {locationName} is open for development testing, along with every other location. Browse approved profiles and try the care booking journey.
        </p>
      </div>

      <Card className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 shrink-0 text-verified" />
        <p className="text-sm text-text-primary">Only approved profiles appear in search. Development access does not guarantee a provider is available in your area.</p>
      </Card>

      <Link
        href={`/search?area=${encodeURIComponent(locationName)}`}
        className="min-h-tap mx-auto flex items-center rounded-md bg-accent px-6 text-base font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Browse approved profiles
      </Link>
    </main>
  );
}
