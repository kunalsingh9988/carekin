"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getMyProvider, getDocuments, submitDocuments } from "@/lib/storage/repositories/providers";
import type { DocumentType, Provider } from "@/lib/storage/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OnboardingFrame } from "@/components/onboarding/OnboardingFrame";

const REQUIRED: { type: DocumentType; label: string }[] = [
  { type: "id_proof", label: "Government ID (Aadhaar, PAN, etc.)" },
  { type: "address_proof", label: "Address proof" },
  { type: "certificate", label: "Any relevant certificates (optional)" },
];

// Real-world: Aadhaar eKYC + police verification via a KYC vendor.
// Prototype: "upload" just stores a filename + timestamp — no real file
// storage, no real vendor call (Guardrails, Section 2/8).
export default function DocumentUploadPage() {
  const user = useRequireRole("provider");
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploaded, setUploaded] = useState<Record<DocumentType, string | null>>({
    id_proof: null,
    address_proof: null,
    certificate: null,
  });

  useEffect(() => {
    if (!user) return;
    getMyProvider(user.id).then(async (profile) => {
      if (!profile) { router.replace("/provider/onboarding"); return; }
      setProvider(profile);
      const documents = await getDocuments(profile.id);
      setUploaded((previous) => ({ ...previous, ...Object.fromEntries(documents.map((document) => [document.type, document.filename])) }));
    });
  }, [user, router]);

  if (!user) return null;

  function handleSimulatedUpload(type: DocumentType) {
    setUploaded((prev) => ({ ...prev, [type]: `${type}-${Date.now()}.pdf` }));
  }

  async function handleFinish() {
    if (!provider || submitting || !uploaded.id_proof || !uploaded.address_proof) return;
    setSubmitting(true);
    const docs = (Object.entries(uploaded) as [DocumentType, string | null][])
      .filter(([, filename]) => filename)
      .map(([type, filename]) => ({ type, filename: filename! }));
    if (docs.length > 0) await submitDocuments(provider.id, docs);
    router.push("/provider/verification-status");
  }

  const requiredDone = uploaded.id_proof && uploaded.address_proof;

  return (
    <OnboardingFrame steps={["Your care profile", "Documents and identity", "Application status"]} step={2} title="Trust starts with the small details." description="Complete your application with identity and address documents. Our review process keeps families and care professionals connected with confidence." image={provider?.type === "babysitter" ? "babysitting-storytime" : "elder-care-checkin"}>
      <div>
        <h1 className="text-2xl font-bold leading-2xl text-text-primary">Upload your documents</h1>
        <p className="mt-1 text-sm leading-sm text-text-secondary">Our team reviews these before you go live.</p>
      </div>

      <p className="demo-note rounded-md px-3 py-2 text-xs">
        Demo mode: this just records a filename, no real file is uploaded anywhere.
      </p>

      <div className="flex flex-col gap-3">
        {REQUIRED.map((doc) => (
          <Card key={doc.type} className="flex flex-col items-stretch justify-between gap-3 xl:flex-row xl:items-center">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-5 w-5 shrink-0 text-text-secondary" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{doc.label}</p>
                {uploaded[doc.type] && <p className="break-all text-xs font-medium text-verified">{uploaded[doc.type]} uploaded</p>}
              </div>
            </div>
            <Button variant="secondary" onClick={() => handleSimulatedUpload(doc.type)} className="shrink-0">
              <Upload className="h-4 w-4" /> {uploaded[doc.type] ? "Replace" : "Upload"}
            </Button>
          </Card>
        ))}
      </div>

      <Button onClick={handleFinish} disabled={!requiredDone || !provider || submitting} fullWidth>
        {submitting ? "Submitting…" : "Submit for review"}
      </Button>
    </OnboardingFrame>
  );
}
