import Link from "next/link";
import { PageShell, Notice } from "@/components/workspace/PageShell";

const DOCUMENTS = {
  privacy: { title: "Privacy information", description: "How the current CareKin prototype handles the information you enter.", sections: [
    ["The prototype today", "Profiles, demo bookings, messages and support drafts are stored in this browser’s local storage. These demo records are not a shared production database and do not sync across devices."],
    ["Information to avoid entering", "Use fictional details while testing. Do not enter identity numbers, real verification documents, payment credentials, sensitive health details or identifying information about children."],
    ["Images and documents", "Lifestyle scenes are illustrative. Document submission stores a filename and timestamp rather than uploading the actual file. These records do not establish identity or a completed background check."],
    ["Removing local demo records", "You can clear this site’s data in your browser settings. This removes locally saved demo records and preferences on that browser; it does not make a deletion request to the hosting provider."],
    ["Production notice still required", "Before launch, the business must publish its approved identity and contact details, processing purposes, service-provider disclosures, retention periods, consent and rights-request procedures, and the final privacy notice. Hosting and other infrastructure may process technical request information separately from these demo records."],
  ] },
  terms: { title: "Terms of service", description: "A transparent description of this demo—not an approved agreement for a live care service.", sections: [
    ["Demo use only", "CareKin currently demonstrates a marketplace for elder care and babysitting. Accounts, verification, booking payments, payouts and administrative actions are simulations. This prototype does not arrange real visits."],
    ["No real payment or service commitment", "Prices and plan selections demonstrate a booking flow. No actual payment is collected, and a confirmation screen does not guarantee a real caregiver or appointment."],
    ["Respectful testing", "Use fictional details. Do not post abusive content, other people’s private information, real financial credentials or sensitive documents."],
    ["Before a live service launches", "The business must approve the contracting entity, eligibility rules, responsibilities of families and providers, verification standards, service limitations, fees, disputes and applicable agreement terms. None of these are established by this draft page."],
  ] },
  cancellation: { title: "Cancellation and refunds", description: "What can be tested today, and which live-service rules still need approval.", sections: [
    ["No money moves in the demo", "Checkout and payouts are simulated. Cancelling a local booking or plan does not charge a fee, send a refund or change a real bank balance."],
    ["Changing a visit", "The reschedule screen supports future requested or confirmed demo visits. It checks for overlapping stored bookings, but does not contact the provider or guarantee real availability."],
    ["Managing a care plan", "Pausing or cancelling updates the local plan record. Existing visits are unchanged, and automatic billing is not connected. Manage individual visits separately."],
    ["Recording an issue", "A booking’s issue-reporting action records a local demo dispute where available. Support drafts are not sent to a live team."],
    ["Rules awaiting business approval", "Cancellation deadlines, cancellation fees, provider no-shows, refund eligibility, partial refunds, rescheduling limits and refund-processing timelines must be approved and published before accepting real bookings. No refund entitlement or timeline is promised on this draft page."],
  ] },
} as const;

export function PolicyDocument({ kind }: { kind: keyof typeof DOCUMENTS }) {
  const doc = DOCUMENTS[kind];
  return <PageShell title={doc.title} description={doc.description} back={{ href: "/help", label: "Help centre" }}><Notice>Prototype information · Production policy pending business and legal review. This page is not a final legal policy.</Notice><div className="grid gap-8 md:grid-cols-[0.6fr_1.4fr]"><nav aria-label="On this page" className="flex flex-col gap-2 md:sticky md:top-24 md:self-start">{doc.sections.map(([title], i) => <a key={title} href={`#section-${i}`} className="flex min-h-tap items-center text-sm text-accent-text">{title}</a>)}</nav><article className="max-w-prose">{doc.sections.map(([title, body], i) => <section key={title} id={`section-${i}`} className="mb-8 scroll-mt-28"><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-3 text-base leading-lg text-text-secondary">{body}</p></section>)}<Link href="/contact" className="inline-flex min-h-tap items-center font-semibold text-accent-text">Prepare a support draft →</Link></article></div></PageShell>;
}
