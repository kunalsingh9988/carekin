"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarX } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import { listBookingsForFamily } from "@/lib/storage/repositories/bookings";
import { getProvider } from "@/lib/storage/repositories/providers";
import type { Booking, Provider } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookingStatusBadge } from "@/components/ui/BookingStatusBadge";

const UPCOMING: Booking["status"][] = ["requested", "confirmed", "in_progress"];

export default function FamilyBookingsPage() {
  const user = useRequireRole("family");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<Record<string, Provider>>({});
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    if (!user) return;
    getFamilyProfile(user.id).then(async (family) => {
      if (!family) return;
      const list = await listBookingsForFamily(family.id);
      setBookings(list);
      const entries = await Promise.all(
        [...new Set(list.map((b) => b.provider_id))].map(async (id) => [id, await getProvider(id)] as const),
      );
      setProviders(Object.fromEntries(entries.filter(([, p]) => p) as [string, Provider][]));
    });
  }, [user]);

  if (!user) return null;

  const filtered = bookings.filter((b) => (tab === "upcoming" ? UPCOMING.includes(b.status) : !UPCOMING.includes(b.status)));

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-4 px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary">My bookings</h1>

      <div className="flex gap-2 border-b border-border">
        <TabButton label="Upcoming" active={tab === "upcoming"} onClick={() => setTab("upcoming")} />
        <TabButton label="Past" active={tab === "past"} onClick={() => setTab("past")} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title={tab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
          body={tab === "upcoming" ? "Search for a verified provider to book your first visit." : "Completed and cancelled bookings will show up here."}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((b) => (
            <Link key={b.id} href={`/family/bookings/${b.id}`}>
              <Card className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">{providers[b.provider_id]?.name ?? "Provider"}</p>
                  <p className="text-sm text-text-secondary">{new Date(b.scheduled_at).toLocaleString()}</p>
                </div>
                <BookingStatusBadge status={b.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-tap border-b-2 px-2 text-sm font-medium ${active ? "border-accent text-text-primary" : "border-transparent text-text-secondary"}`}
    >
      {label}
    </button>
  );
}
