"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@carekin/validation";
import { PhoneNumber } from "@carekin/validation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<UserRole>("family");
  const [phone, setPhone] = useState("+91");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = PhoneNumber.safeParse(phone);
    if (!parsed.success) {
      setError("Enter a valid phone number in E.164 format, e.g. +919876543210");
      return;
    }

    setLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: parsed.data });
    setLoading(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }
    router.push(`/verify-otp?phone=${encodeURIComponent(parsed.data)}&role=${role}`);
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-sm flex-1 flex-col justify-center gap-6 px-6">
      <div className="text-center">
        <h1 className="font-display-latin text-3xl font-semibold text-text-primary">CareKin</h1>
        <p className="mt-2 text-text-secondary">Verified care, close to home.</p>
      </div>

      <div className="flex gap-2">
        <RoleButton label="I need care" active={role === "family"} onClick={() => setRole("family")} />
        <RoleButton label="I provide care" active={role === "provider"} onClick={() => setRole("provider")} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Phone number
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+919876543210"
            className="min-h-tap rounded-md border border-border bg-surface px-4 text-base text-text-primary"
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="min-h-tap rounded-md bg-accent text-base font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send OTP"}
        </button>
      </form>
    </main>
  );
}

function RoleButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-tap flex-1 rounded-md border px-3 text-sm font-medium ${
        active ? "border-accent bg-accent text-white" : "border-border text-text-secondary"
      }`}
    >
      {label}
    </button>
  );
}
