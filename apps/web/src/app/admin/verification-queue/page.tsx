"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface PendingVerification {
  id: string;
  providerId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  kycProviderRef: string | null;
  policeVerificationRef: string | null;
  createdAt: string;
  provider: {
    type: "CAREGIVER" | "BABYSITTER";
    bio: string | null;
    user: { phone: string };
  };
}

export default function VerificationQueuePage() {
  // Dev-only: a real build needs an admin login flow. This takes a bearer
  // token directly so the queue is testable against the API before that
  // flow exists — replace once Auth module ships an admin session.
  const [token, setToken] = useState("");
  const [records, setRecords] = useState<PendingVerification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/verification/queue/pending", token);
      setRecords(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    const notes = window.prompt(`Notes for ${status.toLowerCase()} (optional):`) ?? undefined;
    try {
      await apiFetch(`/verification/${id}/review`, token, {
        method: "POST",
        body: JSON.stringify({ verificationRecordId: id, status, notes }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Verification queue</h1>

      <label className="flex flex-col gap-1 text-sm">
        Admin bearer token
        <input
          className="rounded border border-neutral-300 px-3 py-2 font-mono text-xs"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste an ADMIN JWT from /auth/otp/verify"
        />
      </label>

      {loading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && token && records.length === 0 && (
        <p className="text-sm text-neutral-500">No pending providers.</p>
      )}

      <ul className="flex flex-col gap-3">
        {records.map((r) => (
          <li key={r.id} className="rounded border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{r.provider.type} · {r.provider.user.phone}</p>
                <p className="text-xs text-neutral-500">
                  KYC ref: {r.kycProviderRef ?? "—"} · Police ref: {r.policeVerificationRef ?? "—"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white"
                  onClick={() => review(r.id, "APPROVED")}
                >
                  Approve
                </button>
                <button
                  className="rounded bg-red-600 px-3 py-1.5 text-sm text-white"
                  onClick={() => review(r.id, "REJECTED")}
                >
                  Reject
                </button>
              </div>
            </div>
            {r.provider.bio && <p className="mt-2 text-sm text-neutral-600">{r.provider.bio}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
