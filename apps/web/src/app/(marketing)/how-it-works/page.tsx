import { CircleCheck, MessageCircle, Search, ShieldCheck, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/Card";

const STEPS = [
  { icon: Search, title: "Search nearby", body: "Filter by elder care or babysitting, see only verified providers within your radius." },
  { icon: ShieldCheck, title: "Every provider is verified first", body: "Aadhaar eKYC, police verification, and a human admin review — before they're ever visible to you." },
  { icon: CircleCheck, title: "Book and pay in-app", body: "One-off visits or a recurring weekly/monthly plan. Payment is collected securely at booking." },
  { icon: MessageCircle, title: "Chat once confirmed", body: "In-app messaging unlocks the moment your booking is confirmed — no need to share personal numbers." },
];

export default function HowItWorksPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-text-primary">How CareKin works</h1>
        <p className="mt-2 text-text-secondary">From search to a trusted caregiver at your door.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {STEPS.map((step, i) => (
          <Card key={step.title} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <step.icon className="h-6 w-6 text-accent" />
              <span className="text-xs font-semibold text-text-secondary">STEP {i + 1}</span>
            </div>
            <p className="font-medium text-text-primary">{step.title}</p>
            <p className="text-sm text-text-secondary">{step.body}</p>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col items-center gap-2 text-center">
        <UserPlus className="h-6 w-6 text-accent" />
        <p className="font-medium text-text-primary">Are you a caregiver or babysitter?</p>
        <p className="text-sm text-text-secondary">
          Apply on CareKin, upload your documents, and our team reviews you before you go live — usually within a
          few days.
        </p>
      </Card>
    </main>
  );
}
