import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";

const CITIES = [
  { name: "Bengaluru", neighborhoods: "Koramangala", status: "Live" },
  { name: "Mumbai", neighborhoods: "—", status: "Coming soon" },
  { name: "Delhi NCR", neighborhoods: "—", status: "Coming soon" },
];

export default function CitiesPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-text-primary">Cities we serve</h1>
        <p className="mt-2 text-text-secondary">
          We launch one neighborhood at a time — trust and retention matter more than coverage this early.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {CITIES.map((city) => (
          <Card key={city.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium text-text-primary">{city.name}</p>
                <p className="text-sm text-text-secondary">{city.neighborhoods}</p>
              </div>
            </div>
            <span className={`text-xs font-semibold ${city.status === "Live" ? "text-success-generic" : "text-text-secondary"}`}>
              {city.status}
            </span>
          </Card>
        ))}
      </div>
    </main>
  );
}
