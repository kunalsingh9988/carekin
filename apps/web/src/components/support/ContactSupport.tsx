"use client";
import { backendEnabled } from "@/lib/backend/config";
import { useState } from "react";
import { PageShell, Notice } from "@/components/workspace/PageShell";
import { TextField, TextAreaField, SelectField } from "@/components/ui/FormField";
import { Button, LinkButton } from "@/components/ui/Button";
import { saveSupportDraft } from "@/lib/storage/repositories/workspace";

export function ContactSupport() {
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try { const draft = await saveSupportDraft({ name: String(form.get("name")), email: String(form.get("email")), topic: String(form.get("topic")), message: String(form.get("message")) }); setSaved(draft.id); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to save this draft."); }
    finally { setBusy(false); }
  }
  return <PageShell title="Let’s work through it." description={backendEnabled ? "Sign in to submit a private support request. Operations can review it in the dashboard." : "Prepare a support draft on this device."} image="elder-care-checkin" back={{ href: "/help", label: "Help centre" }}>
    <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]"><section>{saved ? <div className="flex flex-col gap-5"><h2 className="text-2xl font-semibold">{backendEnabled ? "Request saved" : "Draft saved on this device"}</h2><Notice>{backendEnabled ? "Your request is saved in the operations queue. No email or emergency service was notified." : "No request was sent; this draft is only on your device."} Reference: {saved}.</Notice><Button onClick={() => setSaved("")}>Start another request</Button><LinkButton href="/help" variant="secondary">Back to help</LinkButton></div> : <form onSubmit={save} className="flex flex-col gap-5"><TextField name="name" label="Your name" required maxLength={100} autoComplete="name" /><TextField name="email" label="Reply email" type="email" required autoComplete="email" /><SelectField name="topic" label="What is this about?"><option>Booking or schedule</option><option>Payment or refund</option><option>Provider application</option><option>Account and privacy</option><option>Other</option></SelectField><TextAreaField name="message" label="How can we help?" required minLength={10} maxLength={2000} placeholder="Describe the issue without identity documents, payment details or health information." /><Notice>This form is not monitored and is not an emergency contact. No sensitive information, please.</Notice>{error && <Notice error>{error}</Notice>}<Button disabled={busy} type="submit">{busy ? "Saving…" : backendEnabled ? "Submit support request" : "Save demo support draft"}</Button></form>}</section><aside className="flex flex-col gap-5 rounded-lg bg-surface-secondary p-6 self-start"><h2 className="text-xl font-semibold">Start with the details</h2><p className="text-sm leading-sm text-text-secondary">For an existing visit, open its booking details to view the schedule, chat and available issue-reporting actions.</p><LinkButton href="/family/bookings" variant="secondary">Open my bookings</LinkButton><p className="text-sm leading-sm text-text-secondary">Real support channels and response commitments must be configured before launch. This is not a live care or emergency service.</p></aside></div>
  </PageShell>;
}
