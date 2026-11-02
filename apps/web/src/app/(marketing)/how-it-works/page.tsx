import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { VerificationTrail } from "@/components/verification/VerificationTrail";

export default function HowItWorksPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="bg-surface-secondary px-6 py-10 sm:py-14"><div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_0.9fr] md:items-center"><div><h1 className="text-4xl font-bold leading-4xl tracking-[-0.02em] text-text-primary">Trust isn&apos;t a feature here. It&apos;s the whole product.</h1><p className="mt-4 text-text-secondary">
          Before anyone appears in a search result, they&apos;ve been through four separate checks — not just a
          background-check API call.
        </p><Link href="/search" className="mt-5 inline-block text-sm font-semibold text-accent-text">
          See who&apos;s verified near you →
        </Link></div><div className="relative min-h-64 overflow-hidden rounded-2xl"><Image src="/images/carekin/caregiver-arrival.webp" alt="A caregiver arriving at a family home" fill sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" /></div></div></section>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16">

      <Card>
        <VerificationTrail status="approved" size="full" />
      </Card>

      <div className="flex flex-col gap-4">
        <VerificationDetail
          title="Identity verification"
          body="Aadhaar-based ID check, confirmed against government records."
        />
        <VerificationDetail
          title="Police verification"
          body="A formal police background check, not a self-declared form."
        />
        <VerificationDetail
          title="In-person interview"
          body="A real conversation with our team — not an automated approval."
        />
        <VerificationDetail title="Manual approval" body="A human reviews every application. Passing the checks isn't automatic approval." />
      </div>

      <div className="flex flex-col items-center gap-1 text-center text-sm text-text-secondary">
        <p className="font-medium text-text-primary">If any step fails, they don&apos;t go live. No exceptions.</p>
        <p className="max-w-md">
          We&apos;d rather have fewer caregivers on CareKin than one we&apos;re not sure about. That&apos;s also why
          it can take a few days to see new providers in a smaller area — we&apos;re not cutting the process short to
          grow faster.
        </p>
      </div>

      <Link
        href="/search"
        className="min-h-tap mx-auto flex items-center rounded-md bg-accent px-6 text-base font-semibold text-white transition-colors hover:bg-accent-text"
      >
        See who&apos;s verified near you
      </Link>
      </div>
    </main>
  );
}

function VerificationDetail({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="font-medium text-text-primary">{title}</p>
      <p className="text-sm text-text-secondary">{body}</p>
    </div>
  );
}
