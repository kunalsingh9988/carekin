import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CITIES } from "@/lib/cities";

export default function CitiesPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold leading-4xl text-text-primary">Cities we serve</h1>
        <p className="mt-2 text-text-secondary">
          We launch one neighborhood at a time — trust and retention matter more than coverage this early.
        </p>
      </div>

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
                {city.live ? "Live" : "Coming soon"}
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
    </main>
  );
}
