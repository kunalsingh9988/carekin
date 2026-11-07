"use client";

import { useEffect, useState } from "react";
import { CalendarX } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { listAllBookings } from "@/lib/storage/repositories/bookings";
import { getFamilyProfileById } from "@/lib/storage/repositories/families";
import { getProvider } from "@/lib/storage/repositories/providers";
import type { Booking, FamilyProfile, Provider } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";
import { LoadError } from "@/components/ui/LoadError";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookingStatusBadge } from "@/components/ui/BookingStatusBadge";

export default function AdminBookingsPage() {
  const user = useRequireRole("admin");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [families, setFamilies] = useState<Record<string, FamilyProfile>>({});
  const [providers, setProviders] = useState<Record<string, Provider>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    listAllBookings().then(async (list) => {
      setBookings(list);
      const f = await Promise.all([...new Set(list.map((b) => b.family_id))].map(async (id) => [id, await getFamilyProfileById(id)] as const));
      setFamilies(Object.fromEntries(f.filter(([, v]) => v) as [string, FamilyProfile][]));
      const p = await Promise.all([...new Set(list.map((b) => b.provider_id))].map(async (id) => [id, await getProvider(id)] as const));
      setProviders(Object.fromEntries(p.filter(([, v]) => v) as [string, Provider][]));
    }).catch((e) => setError(e instanceof Error ? e.message : "Unable to load bookings."));
  }, [user]);

  if (!user) return null;
  if (error) return <LoadError error={error} />;

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold text-text-primary">All bookings</h1>

      {bookings.length === 0 ? (
        <EmptyState icon={CalendarX} title="No bookings yet" />
      ) : (
        <div className="flex flex-col gap-2">
          {bookings.map((b) => (
            <Card key={b.id} className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {families[b.family_id]?.name ?? "Family"} → {providers[b.provider_id]?.name ?? "Provider"}
                </p>
                <p className="text-xs text-text-secondary">
                  {new Date(b.scheduled_at).toLocaleString()} · ₹{(b.amount_paise / 100).toFixed(0)} · commission ₹
                  {(b.commission_paise / 100).toFixed(0)}
                </p>
              </div>
              <BookingStatusBadge status={b.status} />
              <LinkButton href={`/admin/bookings/${b.id}`} variant="secondary">Manage booking</LinkButton>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
