"use client";
import { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/workspace/PageShell";
import { TextField } from "@/components/ui/FormField";

const ANSWERS = [
  { category: "Finding care", question: "Can I browse before creating an account?", answer: "Yes. Search and approved provider profiles are public. Choose a visit before the signup step.", href: "/search", action: "Find care" },
  { category: "Finding care", question: "What does verified mean in this demo?", answer: "Only profiles marked approved appear in search. Documents and checks are simulated in this prototype; an approved demo profile is not evidence of a real background check.", href: "/how-it-works", action: "About the care journey" },
  { category: "Bookings", question: "Where can I see or change a visit?", answer: "Open My bookings, select a visit, and use its available actions. Only future requested or confirmed visits can be rescheduled in the demo.", href: "/family/bookings", action: "My bookings" },
  { category: "Bookings", question: "How do weekly care plans work?", answer: "Choosing a weekly plan in checkout creates a demo plan after simulated payment. You can pause, resume or cancel its local record. Automatic billing and future visit generation are not connected.", href: "/family/plans", action: "My care plans" },
  { category: "Payments", question: "Will I be charged when I book?", answer: "No. Checkout, receipts and provider payouts are simulated. Do not enter real card or bank information.", href: "/pricing", action: "View demo pricing" },
  { category: "Payments", question: "Can I get a refund or cancel?", answer: "No real money is collected in this prototype. Production cancellation windows, fees and refund timelines have not been approved. Booking issues can be recorded through the demo dispute flow.", href: "/cancellation-policy", action: "Cancellation and refunds" },
  { category: "Providers", question: "How do I apply to provide care?", answer: "Choose the provider path, complete your profile, add document filenames, and follow the demo review status. Files are not uploaded to a verification service.", href: "/provider/apply", action: "Provider application" },
  { category: "Privacy", question: "Where is my demo information stored?", answer: "Demo records are saved in this browser. They are not shared between devices. Avoid entering sensitive personal, identity or health information.", href: "/privacy", action: "Privacy information" },
];
export function HelpCenter() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All topics");
  const filtered = ANSWERS.filter((a) => (category === "All topics" || a.category === category) && `${a.question} ${a.answer}`.toLowerCase().includes(query.toLowerCase()));
  return <PageShell title="A little help, right here." description="Clear answers about finding care, managing visits and exploring the CareKin demo." image="family-peace">
    <div className="grid gap-7 md:grid-cols-[0.65fr_1.35fr]">
      <aside className="flex flex-col gap-5 md:self-start"><TextField label="Search help" placeholder="Try payments or weekly plans" value={query} onChange={(e) => setQuery(e.target.value)} /><nav aria-label="Help topics" className="flex flex-wrap gap-2 md:flex-col">{["All topics", ...new Set(ANSWERS.map((a) => a.category))].map((c) => <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)} className={`min-h-tap rounded-md px-4 text-left text-sm ${category === c ? "bg-accent-tint font-semibold text-accent-text" : "bg-surface-secondary text-text-secondary"}`}>{c}</button>)}</nav><Link href="/contact" className="min-h-tap py-3 text-sm font-semibold text-accent-text">Still need help? Open support →</Link></aside>
      <section aria-label="Help answers"><p role="status" className="mb-3 text-sm text-text-secondary">{filtered.length} {filtered.length === 1 ? "answer" : "answers"}</p>{filtered.map((a) => <details key={a.question} className="border-b border-border py-3"><summary className="cursor-pointer py-3 text-lg font-semibold">{a.question}</summary><p className="mt-2 max-w-prose text-base leading-base text-text-secondary">{a.answer}</p><Link href={a.href} className="mt-2 inline-flex min-h-tap items-center text-sm font-semibold text-accent-text">{a.action} →</Link></details>)}{!filtered.length && <p className="py-8 text-text-secondary">No matching answers. Try a shorter search or choose All topics.</p>}</section>
    </div>
  </PageShell>;
}
