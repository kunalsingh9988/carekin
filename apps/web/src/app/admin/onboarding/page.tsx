"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, ShieldCheck, Wallet } from "lucide-react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { set } from "@/lib/storage/client";
import { OnboardingFrame } from "@/components/onboarding/OnboardingFrame";
import { Button } from "@/components/ui/Button";

const STAGES = [
  { title: "Welcome to care operations", body: "Your workspace brings the decisions that matter into one place. Start with a quick tour of the tools you’ll use to support families and care professionals.", image: "hero-family-care" },
  { title: "Put trust at the centre of every decision", body: "Review documents and background-check information before approving a provider. Pending and rejected profiles stay out of family search results.", image: "caregiver-arrival" },
  { title: "You’re ready to support the care journey", body: "Use the operations dashboard to find open verification requests, bookings, disputes and pending payouts. Each queue keeps the next action clear.", image: "elder-care-checkin" },
];

export default function AdminOnboardingPage() {
  const user = useRequireRole("admin");
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [acknowledged, setAcknowledged] = useState(false);
  if (!user) return null;
  const stage = STAGES[step - 1];

  function finish() {
    if (!acknowledged || !user) return;
    set(`adminOnboarding:${user.id}`, true);
    router.push("/admin");
  }

  return <OnboardingFrame steps={["Your operations workspace", "Review with confidence", "Ready to begin"]} step={step} title="Behind every good visit is a thoughtful team." description="A calm workspace for the human decisions that keep care moving." image={stage.image}>
    <div><h1 className="text-3xl font-bold leading-3xl text-text-primary" tabIndex={-1}>{stage.title}</h1><p className="mt-4 text-base leading-base text-text-secondary">{stage.body}</p></div>
    <div className="flex flex-col divide-y divide-border">
      {[
        { icon: ShieldCheck, title: "Verification queue", body: "Review each application and record a clear approval or rejection reason." },
        { icon: ClipboardCheck, title: "Bookings and disputes", body: "Understand visit status and investigate the issues that need attention." },
        { icon: Wallet, title: "Payout overview", body: "Track pending and paid amounts in the demo ledger." },
      ].map(({ icon: Icon, title, body }) => <div key={title} className="flex gap-3 py-5"><Icon className="mt-1 h-5 w-5 shrink-0 text-accent" /><div><h2 className="font-body-latin text-base font-semibold text-text-primary">{title}</h2><p className="mt-1 text-sm leading-sm text-text-secondary">{body}</p></div></div>)}
    </div>
    {step === 3 && <label className="flex items-start gap-3 rounded-md bg-surface-secondary p-4 text-sm leading-sm text-text-secondary"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-accent" />I understand this is a demo workspace. Identity checks and payouts are simulated, and no real administrative access is provisioned here.</label>}
    <div className="mt-auto flex gap-3">{step > 1 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>}{step < 3 ? <Button onClick={() => setStep(step + 1)} fullWidth>Continue</Button> : <Button onClick={finish} disabled={!acknowledged} fullWidth>Open operations dashboard</Button>}</div>
  </OnboardingFrame>;
}
