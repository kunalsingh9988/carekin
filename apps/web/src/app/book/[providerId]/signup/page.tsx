"use client";

import { use, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginAsRole } from "@/lib/auth";
import { getPendingBooking } from "@/lib/storage/session";
import { getProviderPublic, type GuestSafeProvider } from "@/lib/storage/repositories/providers";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import { findFamilyIdByReferralCode, recordReferral } from "@/lib/storage/repositories/referrals";
import { get } from "@/lib/storage/client";
import type { FamilyProfile, PendingBooking } from "@/lib/storage/types";
import { PhoneNumber } from "@/lib/validation/schemas";
import { StepProgress } from "@/components/ui/StepProgress";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";

type Step = "phone" | "otp";

// The conversion gate (Section 4, Step 4) — and the single most important
// behavior in this build: pendingBooking (set on the previous, guest-only
// page) is read here but deliberately NEVER cleared. It's only consumed
// for real at /pay, on a successful payment.
function SignupForm({ providerId }: { providerId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [provider, setProvider] = useState<GuestSafeProvider | null>(null);
  const [pending, setPending] = useState<PendingBooking | null>(null);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("+91");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProviderPublic(providerId).then(setProvider);
    const existing = getPendingBooking();
    if (!existing || existing.providerId !== providerId) {
      // Lost or missing guest selection — nothing to convert, send them
      // back to choose again rather than showing a broken signup step.
      router.replace(`/book/${providerId}`);
      return;
    }
    setPending(existing);
  }, [providerId, router]);

  if (!provider || !pending) return null;

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

    const user = loginAsRole(phone, "family");

    // Referral capture, if this visit arrived via a share link — one credit
    // per new family, never for yourself.
    const refCode = searchParams.get("ref");
    if (refCode) {
      const allFamilies = get<FamilyProfile[]>("families", []);
      const referrerFamilyId = await findFamilyIdByReferralCode(allFamilies.map((f) => f.id), refCode);
      const myFamily = await getFamilyProfile(user.id);
      if (referrerFamilyId && myFamily) {
        await recordReferral(referrerFamilyId, myFamily.id);
      }
    }

    // pendingBooking is intentionally left untouched — see file header.
    router.push(`/book/${providerId}/profile`);
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <StepProgress step={2} total={4} label="Sign up" />
      <BookingSummaryCard providerName={provider.name} pending={pending} />

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Almost there — let&apos;s confirm this booking.</h1>
            <p className="mt-1 text-sm text-text-secondary">
              We just need your phone number so {provider.name} and CareKin can reach you about this visit.
            </p>
          </div>

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

          <button type="submit" className="min-h-tap rounded-md bg-accent text-base font-semibold text-white">
            Send OTP
          </button>
          <p className="text-center text-xs text-text-secondary">
            Your number is only shared with {provider.name} once your booking is confirmed — never before.
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Enter the code</h1>
            <p className="mt-1 text-sm text-text-secondary">Sent to {phone}</p>
          </div>
          <p className="demo-note rounded-md px-3 py-2 text-xs">Demo mode: enter any 6 digits — no real SMS is sent.</p>

          <label className="flex flex-col gap-1 text-sm text-text-secondary">
            6-digit code
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              inputMode="numeric"
              placeholder="123456"
              className="min-h-tap rounded-md border border-border bg-surface px-4 text-center text-lg tracking-widest text-text-primary"
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button type="submit" disabled={otp.length !== 6} className="min-h-tap rounded-md bg-accent text-base font-semibold text-white disabled:opacity-50">
            Verify
          </button>
        </form>
      )}
    </main>
  );
}

export default function BookingSignupPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = use(params);
  return (
    <Suspense>
      <SignupForm providerId={providerId} />
    </Suspense>
  );
}
