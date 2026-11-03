"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { addChildRecipientWithConsent, getFamilyProfileById } from "@/lib/storage/repositories/families";
import { setPendingBooking, getPendingChildRecipient, clearPendingChildRecipient, type PendingChildRecipient } from "@/lib/storage/session";
import { Card } from "@/components/ui/Card";

// Guardian consent, minors only — Section 6.9: "Not a CRO page — no
// persuasive design pressure." No urgency styling, no pre-ticked box, no
// upsell nearby, by design (Guardrails). StepProgress and the booking
// summary are deliberately NOT shown here either — this page stands alone.
export default function ConsentPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = use(params);
  const router = useRouter();
  const user = useRequireRole("family");

  const [pending, setPending] = useState<PendingChildRecipient | null | undefined>(undefined);
  const [guardianName, setGuardianName] = useState("");
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const value = getPendingChildRecipient();
    Promise.resolve().then(() => setPending(value));
    if (value) {
      getFamilyProfileById(value.familyId).then((f) => setGuardianName(f?.name ?? ""));
    }
  }, []);

  useEffect(() => {
    // No pending child details means this page was reached directly or the
    // funnel state was lost — restart the booking flow rather than consent
    // to a blank record.
    if (pending === null) router.replace(`/book/${providerId}/profile`);
  }, [pending, providerId, router]);

  if (!user || !pending) return null;
  const childName = pending.name || "this child";

  async function handleContinue() {
    if (!user || !pending) return;
    setSubmitting(true);
    const recipient = await addChildRecipientWithConsent(
      pending.familyId,
      { name: pending.name, notes: pending.notes || undefined },
      { consentedBy: user.id, method: "in_app_checkbox", consentedByName: guardianName || user.phone },
    );
    clearPendingChildRecipient();
    setPendingBooking({ careRecipientId: recipient.id });
    router.push(`/book/${providerId}/pay`);
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">
          As {childName}&apos;s parent or guardian, please confirm your consent.
        </h1>
      </div>

      <Card className="flex flex-col gap-4">
        <p className="text-sm text-text-primary">
          CareKin will use {childName}&apos;s name, age, and care notes only to arrange and manage this booking. You
          can withdraw this consent at any time from your account settings.
        </p>

        <label className="flex items-start gap-2 text-sm text-text-primary">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1 h-4 w-4" />I
          confirm I am {childName}&apos;s parent or legal guardian and I consent to this.
        </label>

        <button
          onClick={handleContinue}
          disabled={!checked || submitting}
          className="min-h-tap rounded-md bg-accent text-base font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Continue
        </button>
      </Card>
    </main>
  );
}
