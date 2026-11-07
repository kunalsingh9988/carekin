"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getBooking } from "@/lib/storage/repositories/bookings";
import { getProvider } from "@/lib/storage/repositories/providers";
import { getReferralCode, REFERRAL_BONUS_PAISE } from "@/lib/storage/repositories/referrals";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import type { Booking, Provider } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";

// Section 4, Step 7: "the single highest-propensity moment for a second
// 'yes' in the whole funnel." Cross-sell card is single, not a full list —
// per Section 6.11, exactly one upsell here, plus a smaller referral nudge.
function ConfirmedContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") ?? "";
  const user = useRequireRole("family");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    getBooking(bookingId).then((b) => {
      setBooking(b);
      if (b) getProvider(b.provider_id).then(setProvider).catch(() => {});
    }).catch(() => {});
    if (user) {
      getFamilyProfile(user.id).then((f) => {
        if (f) setReferralCode(getReferralCode(f.id));
      }).catch(() => {});
    }
  }, [bookingId, user]);

  if (!booking || !provider || !user) return null;

  const crossSell =
    provider.type === "caregiver"
      ? { text: "Also need a babysitter sometimes?", cta: "Browse verified sitters →", href: "/search?type=babysitter" }
      : { text: "Caring for an aging parent too?", cta: "Browse verified caregivers →", href: "/search?type=caregiver" };

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <CircleCheck className="h-10 w-10 text-verified" />
        <h1 className="text-3xl font-bold leading-3xl text-text-primary">You&apos;re booked with {provider.name}.</h1>
        <p className="text-sm text-text-secondary">
          {booking.type === "subscription" ? "Weekly plan" : new Date(booking.scheduled_at).toLocaleString()} · Confirmation sent to{" "}
          {user.phone}
        </p>
      </div>

      <Link href={`/family/bookings/${booking.id}/chat`} className="min-h-tap flex items-center justify-center rounded-md bg-accent text-base font-semibold text-white transition-colors hover:bg-accent-hover">
        Message {provider.name}
      </Link>

      <Card className="flex flex-col gap-2 text-center">
        <p className="text-sm text-text-primary">{crossSell.text}</p>
        <Link href={crossSell.href} className="text-sm font-semibold text-accent-text underline">
          {crossSell.cta}
        </Link>
      </Card>

      {referralCode && (
        <Card className="flex flex-col gap-1 text-center">
          <p className="text-xs text-text-secondary">
            Know another family who&apos;d want this? Share CareKin and you both get ₹{(REFERRAL_BONUS_PAISE / 100).toFixed(0)} off
            your next booking.
          </p>
          <Link href="/family/referrals" className="text-xs font-semibold text-accent-text underline">
            Refer a friend
          </Link>
        </Card>
      )}
    </main>
  );
}

export default function ConfirmedPage() {
  return (
    <Suspense>
      <ConfirmedContent />
    </Suspense>
  );
}
