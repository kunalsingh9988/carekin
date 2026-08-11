"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { addChildRecipientWithConsent } from "@/lib/storage/repositories/families";
import type { ParentalConsentMethod } from "@/lib/storage/types";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";
import { Card } from "@/components/ui/Card";

// Shown only when adding a child care-recipient — verifiable guardian
// consent as a distinct, logged step (DPDP Act Section 9), never inferred
// from the parent's own account signup (Guardrails).
function ConsentForm() {
  const user = useRequireRole("family");
  const router = useRouter();
  const params = useSearchParams();
  const familyId = params.get("familyId") ?? "";
  const name = params.get("name") ?? "";
  const notes = params.get("notes") ?? "";

  const [consentedByName, setConsentedByName] = useState("");
  const [method, setMethod] = useState<ParentalConsentMethod>("in_app_checkbox");
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  async function handleConfirm() {
    setSubmitting(true);
    await addChildRecipientWithConsent(
      familyId,
      { name, notes: notes || undefined },
      { consentedBy: user!.id, method, consentedByName },
    );
    router.push("/family/search");
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-verified" />
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Guardian consent</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Because {name || "this child"} is a minor, we need explicit consent from a parent or guardian before
            creating their profile. This is a distinct, logged step — not inferred from your account.
          </p>
        </div>
      </div>

      <Card className="flex flex-col gap-4">
        <TextField
          label="Your full name (guardian)"
          placeholder="Lakshmi Iyer"
          value={consentedByName}
          onChange={(e) => setConsentedByName(e.target.value)}
        />

        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Consent method
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as ParentalConsentMethod)}
            className="min-h-tap rounded-md border border-border bg-bg-canvas px-4 text-base text-text-primary"
          >
            <option value="in_app_checkbox">In-app checkbox (this form)</option>
            <option value="digital_signature">Digital signature</option>
            <option value="otp_confirmation">OTP confirmation</option>
          </select>
        </label>

        <label className="flex items-start gap-2 text-sm text-text-primary">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1 h-4 w-4" />
          I am {name || "this child"}&apos;s parent or legal guardian, and I consent to creating their care profile on
          CareKin. I understand I can withdraw this consent at any time from Family settings.
        </label>

        <Button onClick={handleConfirm} disabled={!checked || !consentedByName || submitting} fullWidth>
          {submitting ? "Saving…" : "Give consent and continue"}
        </Button>
      </Card>
    </main>
  );
}

export default function ConsentPage() {
  return (
    <Suspense>
      <ConsentForm />
    </Suspense>
  );
}
