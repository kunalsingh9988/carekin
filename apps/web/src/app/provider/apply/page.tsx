"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HandCoins, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getMyProvider, getDocuments } from "@/lib/storage/repositories/providers";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { Card } from "@/components/ui/Card";
import { OnboardingFrame } from "@/components/onboarding/OnboardingFrame";

// Public landing, account required to submit (Section 5.2) — pre-qualifies
// applicants rather than maximizing raw signup volume.
export default function ProviderApplyPage() {
  const { open } = useAuthModal();
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.role === "provider") {
      getMyProvider(user.id).then(async (p) => {
        if (!p) { router.replace("/provider/onboarding"); return; }
        const documents = await getDocuments(p.id);
        router.replace(documents.some((doc) => doc.type === "id_proof") && documents.some((doc) => doc.type === "address_proof") ? "/provider/verification-status" : "/provider/onboarding/documents");
      });
    }
  }, [router]);

  function handleStart() {
    const user = getCurrentUser();
    if (user?.role === "provider") {
      router.push("/provider/onboarding");
    } else {
      open("provider");
    }
  }

  return (
    <OnboardingFrame steps={["Meet CareKin", "Your profile", "Documents", "Application review"]} step={1} title="Care is your calling. Let’s take the next step." description="A guided application for elder caregivers and babysitters, with a human review before your profile goes live." image="caregiver-arrival">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-text-primary">
          Turn your caregiving experience into steady, dignified work.
        </h1>
        <p className="mt-2 text-text-secondary">
          CareKin connects verified caregivers and babysitters with families who are ready to pay fairly for
          trustworthy care.
        </p>
      </div>

      <Card className="flex items-start gap-3">
        <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-verified" />
        <p className="text-sm text-text-primary">
          Every application goes through ID verification, a police check, and a short interview with our team. It
          usually takes about 5 business days.
        </p>
      </Card>

      <button onClick={handleStart} className="min-h-tap rounded-md bg-accent text-base font-semibold text-white">
        Start my application
      </button>

      <Card className="flex items-center gap-3">
        <HandCoins className="h-5 w-5 shrink-0 text-accent" />
        <p className="text-sm text-text-secondary">
          Caregivers on CareKin typically earn ₹500–₹800 per visit, paid directly to your account.
        </p>
      </Card>
    </OnboardingFrame>
  );
}
