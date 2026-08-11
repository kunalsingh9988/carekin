"use client";

import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { listDisputes, resolveDispute } from "@/lib/storage/repositories/admin";
import { getBooking } from "@/lib/storage/repositories/bookings";
import type { Booking, Dispute } from "@/lib/storage/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AdminDisputesPage() {
  const user = useRequireRole("admin");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [bookings, setBookings] = useState<Record<string, Booking>>({});

  async function load() {
    const list = await listDisputes();
    setDisputes(list);
    const entries = await Promise.all(list.map(async (d) => [d.booking_id, await getBooking(d.booking_id)] as const));
    setBookings(Object.fromEntries(entries.filter(([, b]) => b) as [string, Booking][]));
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;

  async function handleResolve(dispute: Dispute) {
    const notes = window.prompt("Resolution notes:");
    if (!notes) return;
    await resolveDispute(dispute.id, notes);
    load();
  }

  const open = disputes.filter((d) => d.status === "open");
  const resolved = disputes.filter((d) => d.status === "resolved");

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold text-text-primary">Disputes</h1>

      {open.length === 0 ? (
        <EmptyState icon={CircleAlert} title="No open disputes" />
      ) : (
        <div className="flex flex-col gap-3">
          {open.map((d) => (
            <Card key={d.id} className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text-primary">
                Booking {bookings[d.booking_id]?.id.slice(-6) ?? d.booking_id.slice(-6)} — ₹
                {bookings[d.booking_id] ? (bookings[d.booking_id].amount_paise / 100).toFixed(0) : "—"}
              </p>
              <p className="text-sm text-text-secondary">{d.reason}</p>
              <Button variant="secondary" onClick={() => handleResolve(d)}>
                Mark resolved
              </Button>
            </Card>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-text-secondary">Resolved</p>
          <div className="flex flex-col gap-2">
            {resolved.map((d) => (
              <Card key={d.id} className="opacity-70">
                <p className="text-sm text-text-primary">{d.reason}</p>
                <p className="text-xs text-text-secondary">Resolution: {d.resolution_notes}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
