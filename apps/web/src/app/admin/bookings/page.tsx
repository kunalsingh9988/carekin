"use client";

import { useEffect, useState } from "react";
import { CalendarX } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { listAllBookings } from "@/lib/storage/repositories/bookings";
import { getFamilyProfileById } from "@/lib/storage/repositories/families";
import { getProvider } from "@/lib/storage/repositories/providers";
import type { Booking, FamilyProfile, Provider } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookingStatusBadge } from "@/components/ui/BookingStatusBadge";

export default function AdminBookingsPage() {
  const user = useRequireRole("admin");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [families, setFamilies] = useState<Record<string, FamilyProfile>>({});
  const [providers, setProviders] = useState<Record<string, Provider>>({});

  useEffect(() => {
    if (!user) return;
    listAllBookings().then(async (list) => {
      setBookings(list);
      const f = await Promise.all([...new Set(list.map((b) => b.family_id))].map(async (id) => [id, await getFamilyProfileById(id)] as const));
      setFamilies(Object.fromEntries(f.filter(([, v]) => v) as [string, FamilyProfile][]));
      const p = await Promise.all([...new Set(list.map((b) => b.provider_id))].map(async (id) => [id, await getProvider(id)] as const));
      setProviders(Object.fromEntries(p.filter(([, v]) => v) as [string, Provider][]));
    });
  }, [user]);

  if (!user) return null;

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold text-text-primary">All bookings</h1>

      {bookings.length === 0 ? (
        <EmptyState icon={CalendarX} title="No bookings yet" />
      ) : (
        <div className="flex flex-col gap-2">
          {bookings.map((b) => (
            <Card key={b.id} className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {families[b.family_id]?.name ?? "Family"} → {providers[b.provider_id]?.name ?? "Provider"}
                </p>
                <p className="text-xs text-text-secondary">
                  {new Date(b.scheduled_at).toLocaleString()} · ₹{(b.amount_paise / 100).toFixed(0)} · commission ₹
                  {(b.commission_paise / 100).toFixed(0)}
                </p>
              </div>
              <BookingStatusBadge status={b.status} />
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
