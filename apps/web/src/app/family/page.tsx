"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Search } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import { listBookingsForFamily } from "@/lib/storage/repositories/bookings";
import { getProvider } from "@/lib/storage/repositories/providers";
import type { Booking, FamilyProfile, Provider } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";
import { ActiveCareEntry } from "@/components/care/ActiveCareEntry";
import { BookingStatusBadge } from "@/components/ui/BookingStatusBadge";

const UPCOMING: Booking["status"][] = ["requested", "confirmed", "in_progress"];

// Returning-user dashboard (Section 5.2) — surfaces the next relevant
// action rather than being a static landing page.
export default function FamilyDashboardPage() {
  const user = useRequireRole("family");
  const [family, setFamily] = useState<FamilyProfile | null | undefined>(undefined);
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);

  useEffect(() => {
    if (!user) return;
    getFamilyProfile(user.id).then(async (f) => {
      setFamily(f);
      if (f) {
        const bookings = await listBookingsForFamily(f.id);
        const upcoming = bookings.filter((b) => UPCOMING.includes(b.status)).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];
        if (upcoming) {
          setNextBooking(upcoming);
          getProvider(upcoming.provider_id).then(setProvider);
        }
      }
    });
  }, [user]);

  if (!user || family === undefined) return null;

  if (!family) {
    return (
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <Search className="h-10 w-10 text-text-secondary" strokeWidth={1.5} />
        <h1 className="text-xl font-semibold text-text-primary">Let&apos;s find you someone you trust.</h1>
        <p className="text-sm text-text-secondary">You haven&apos;t booked with CareKin yet — start with a search.</p>
        <Link href="/search" className="min-h-tap flex items-center rounded-md bg-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-accent-hover">
          Search now
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary">Welcome back, {family.name.split(" ")[0]}.</h1>
      <ActiveCareEntry role="family" />

      {nextBooking && provider ? (
        <Card className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-text-secondary">Next visit</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text-primary">{provider.name}</p>
              <p className="text-sm text-text-secondary">{new Date(nextBooking.scheduled_at).toLocaleString()}</p>
            </div>
            <BookingStatusBadge status={nextBooking.status} />
          </div>
          <Link href={`/family/bookings/${nextBooking.id}`} className="text-sm font-medium text-accent-text">
            View booking →
          </Link>
        </Card>
      ) : (
        <Card className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">No upcoming visits.</p>
          <Link href="/search" className="text-sm font-medium text-accent-text">
            Book again →
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/family/bookings" className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-4">
          <CalendarCheck className="h-5 w-5 text-accent" />
          <span className="text-sm font-medium text-text-primary">All bookings</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-4">
          <Search className="h-5 w-5 text-accent" />
          <span className="text-sm font-medium text-text-primary">Search providers</span>
        </Link>
      </div>
    </main>
  );
}
