"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { UserRole } from "@carekin/validation";
import { createClient } from "@/lib/supabase/client";

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const phone = params.get("phone") ?? "";
  const role = (params.get("role") as UserRole) ?? "family";

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
    if (verifyError) {
      setLoading(false);
      setError(verifyError.message);
      return;
    }

    // Only meaningful on first login — claim_initial_role() is a no-op
    // (raises, which we swallow) if this user already has a role. It can
    // never assign 'admin' — see the migration's own guardrail.
    await supabase.rpc("claim_initial_role", { p_role: role === "provider" ? "provider" : "family" });

    setLoading(false);
    // (family)/(provider) route groups aren't built yet (Section 9 build
    // order steps 8-9 come after the admin queue) — this stub is honest
    // about that rather than linking to routes that don't exist.
    router.push("/welcome");
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-sm flex-1 flex-col justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Enter the code</h1>
        <p className="mt-1 text-text-secondary">Sent to {phone}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          6-digit OTP
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            maxLength={6}
            inputMode="numeric"
            placeholder="123456"
            className="min-h-tap rounded-md border border-border bg-surface px-4 text-center text-lg tracking-widest text-text-primary"
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading || token.length !== 6}
          className="min-h-tap rounded-md bg-accent text-base font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify"}
        </button>
      </form>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}
