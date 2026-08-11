"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAsRole } from "@/lib/auth";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import { getMyProvider } from "@/lib/storage/repositories/providers";
import { PhoneNumber, UserRole, type UserRoleValue } from "@/lib/validation/schemas";
import { useAuthModal } from "./AuthModalProvider";

type Step = "phone" | "otp";

// Demo mode: no real SMS provider exists in this prototype (Guardrails,
// Section 2/8) — any 6-digit code is accepted, and the on-screen note says
// so explicitly rather than silently auto-passing.
export function AuthModal() {
  const { isOpen, close } = useAuthModal();
  const router = useRouter();

  const [step, setStep] = useState<Step>("phone");
  const [role, setRole] = useState<UserRoleValue>("family");
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function reset() {
    setStep("phone");
    setPhone("+91");
    setOtp("");
    setError(null);
  }

  function handleCancel() {
    reset();
    close();
  }

  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = PhoneNumber.safeParse(phone);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid phone number");
      return;
    }
    setStep("otp");
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter any 6 digits — this is demo mode.");
      return;
    }

    const parsedRole = UserRole.safeParse(role);
    const user = loginAsRole(phone, parsedRole.success ? parsedRole.data : "family");
    reset();
    close();

    if (user.role === "admin") {
      router.push("/admin/verification-queue");
    } else if (user.role === "provider") {
      const provider = await getMyProvider(user.id);
      router.push(provider ? "/provider/verification-status" : "/provider/onboarding");
    } else {
      const family = await getFamilyProfile(user.id);
      router.push(family ? "/family/search" : "/family/onboarding");
    }
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={handleCancel} role="presentation">
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
              <RoleButton label="Admin" active={role === "admin"} onClick={() => setRole("admin")} />
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
              <button type="button" onClick={handleCancel} className="min-h-tap flex-1 rounded-md border border-border text-base font-medium text-text-secondary">
                Cancel
              </button>
              <button type="submit" className="min-h-tap flex-1 rounded-md bg-accent text-base font-semibold text-white">
                Send OTP
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-text-primary">Enter the code</h2>
            <p className="-mt-2 text-sm text-text-secondary">Sent to {phone}</p>
            <p className="demo-note rounded-md px-3 py-2 text-xs">Demo mode: enter any 6 digits — no real SMS is sent.</p>

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
              <button type="button" onClick={handleCancel} className="min-h-tap flex-1 rounded-md border border-border text-base font-medium text-text-secondary">
                Cancel
              </button>
              <button type="submit" disabled={otp.length !== 6} className="min-h-tap flex-1 rounded-md bg-accent text-base font-semibold text-white disabled:opacity-50">
                Verify
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
      className={`min-h-tap flex-1 rounded-md border px-2 text-xs font-medium ${active ? "border-accent bg-accent text-white" : "border-border text-text-secondary"}`}
    >
      {label}
    </button>
  );
}
