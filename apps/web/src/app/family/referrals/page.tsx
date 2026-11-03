"use client";

import { useEffect, useState } from "react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import { getReferralCode, listReferralStats, REFERRAL_BONUS_PAISE } from "@/lib/storage/repositories/referrals";
import { Card } from "@/components/ui/Card";

export default function ReferralsPage() {
  const user = useRequireRole("family");
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState({ referredCount: 0, completedCount: 0, earnedPaise: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    getFamilyProfile(user.id).then((f) => {
      if (!f) return;
      setCode(getReferralCode(f.id));
      listReferralStats(f.id).then(setStats);
    });
  }, [user]);

  if (!user) return null;

  const bonus = (REFERRAL_BONUS_PAISE / 100).toFixed(0);
  const link = code ? `${typeof window !== "undefined" ? window.location.origin : ""}/search?ref=${code}` : "";

  function handleCopy() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text-primary">
          Give ₹{bonus}, get ₹{bonus}.
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Share your link. When a friend completes their first booking, you both get ₹{bonus} off.
        </p>
      </div>

      {code && (
        <Card className="flex flex-col gap-3">
          <p className="break-all rounded-md bg-surface-secondary px-3 py-2 text-sm text-text-secondary">{link}</p>
          <div className="flex gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Found a great verified caregiver platform — use my link for ₹${bonus} off: ${link}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-tap flex flex-1 items-center justify-center rounded-md bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Share on WhatsApp
            </a>
            <button onClick={handleCopy} className="min-h-tap flex-1 rounded-md border border-border text-sm font-medium text-text-primary">
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </Card>
      )}

      <p className="text-center text-sm text-text-secondary">
        {stats.referredCount} friend{stats.referredCount === 1 ? "" : "s"} referred · {stats.completedCount} booking
        {stats.completedCount === 1 ? "" : "s"} completed · ₹{(stats.earnedPaise / 100).toFixed(0)} earned
      </p>
    </main>
  );
}
