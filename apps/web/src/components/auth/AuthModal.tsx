"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@carekin/validation";
import { PhoneNumber } from "@carekin/validation";
import { createClient } from "@/lib/supabase/client";
import { useAuthModal } from "./AuthModalProvider";

type Step = "phone" | "otp";

// The only way to log in or sign up — a dismissible popup, not a forced
// full-page redirect. Opened from the navbar (or any future "log in to
// continue" prompt) via useAuthModal().open().
export function AuthModal() {
  const { isOpen, close } = useAuthModal();
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState<Step>("phone");
  const [role, setRole] = useState<UserRole>("family");
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function reset() {
    setStep("phone");
    setPhone("+91");
    setOtp("");
    setError(null);
    setLoading(false);
  }

  function handleCancel() {
    reset();
    close();
  }

  async function handleSendOtp(e: React.FormEvent) {
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
    setStep("otp");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    if (verifyError) {
      setLoading(false);
      setError(verifyError.message);
      return;
    }

    // Only meaningful on first login — claim_initial_role() is a no-op
    // (raises, which we swallow) if this user already has a role, and can
    // never assign 'admin' — see the migration's own guardrail.
    await supabase.rpc("claim_initial_role", { p_role: role === "provider" ? "provider" : "family" });

    setLoading(false);
    reset();
    close();
    router.push("/welcome");
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={handleCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Log in or sign up"
      >
        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <h2 className="font-display-latin text-lg font-semibold text-text-primary">Log in / Sign up</h2>

            <div className="flex gap-2">
              <RoleButton label="I need care" active={role === "family"} onClick={() => setRole("family")} />
              <RoleButton label="I provide care" active={role === "provider"} onClick={() => setRole("provider")} />
            </div>

            <label className="flex flex-col gap-1 text-sm text-text-secondary">
              Phone number
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="min-h-tap rounded-md border border-border bg-bg-canvas px-4 text-base text-text-primary"
              />
            </label>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="min-h-tap flex-1 rounded-md border border-border text-base font-medium text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="min-h-tap flex-1 rounded-md bg-accent text-base font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send OTP"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-text-primary">Enter the code</h2>
            <p className="-mt-2 text-sm text-text-secondary">Sent to {phone}</p>

            <label className="flex flex-col gap-1 text-sm text-text-secondary">
              6-digit OTP
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                inputMode="numeric"
                placeholder="123456"
                className="min-h-tap rounded-md border border-border bg-bg-canvas px-4 text-center text-lg tracking-widest text-text-primary"
              />
            </label>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="min-h-tap flex-1 rounded-md border border-border text-base font-medium text-text-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="min-h-tap flex-1 rounded-md bg-accent text-base font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Verify"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
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
