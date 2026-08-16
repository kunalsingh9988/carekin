"use client";

import { use, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { addChildRecipientWithConsent } from "@/lib/storage/repositories/families";
import { setPendingBooking } from "@/lib/storage/session";
import { Card } from "@/components/ui/Card";

// Guardian consent, minors only — Section 6.9: "Not a CRO page — no
// persuasive design pressure." No urgency styling, no pre-ticked box, no
// upsell nearby, by design (Guardrails). StepProgress and the booking
// summary are deliberately NOT shown here either — this page stands alone.
function ConsentForm({ providerId }: { providerId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const user = getCurrentUser();
  const familyId = params.get("familyId") ?? "";
  const childName = params.get("name") ?? "this child";
  const notes = params.get("notes") ?? "";

  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  async function handleContinue() {
    setSubmitting(true);
    const recipient = await addChildRecipientWithConsent(
      familyId,
      { name: childName, notes: notes || undefined },
      { consentedBy: user!.id, method: "in_app_checkbox", consentedByName: user!.phone },
    );
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
          className="min-h-tap rounded-md bg-accent text-base font-semibold text-white disabled:opacity-50"
        >
          Continue
        </button>
      </Card>
    </main>
  );
}

export default function ConsentPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = use(params);
  return (
    <Suspense>
      <ConsentForm providerId={providerId} />
    </Suspense>
  );
}
