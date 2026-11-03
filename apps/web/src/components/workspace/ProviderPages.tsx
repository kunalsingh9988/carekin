"use client";
import { useCallback, useState } from "react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { useResource } from "@/lib/hooks/useResource";
import { getMyProvider } from "@/lib/storage/repositories/providers";
import { getAvailability, saveAvailability, updatePublicProfile } from "@/lib/storage/repositories/workspace";
import type { AvailabilityDay } from "@/lib/storage/repositories/workspace";
import type { Provider } from "@/lib/storage/types";
import { PageShell, Notice } from "./PageShell";
import { Button, LinkButton } from "@/components/ui/Button";
import { TextField, TextAreaField } from "@/components/ui/FormField";
import { VerificationChip } from "@/components/verification/VerificationChip";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export function ProviderAvailability() {
  const user = useRequireRole("provider");
  const loader = useCallback(async () => { if (!user) return null; const provider = await getMyProvider(user.id); return provider ? { provider, days: await getAvailability(provider.id) } : null; }, [user]);
  const { data, error } = useResource(loader);
  return <PageShell title="A week that works for you." description="Set your usual hours for each day, in your device’s local time. Days begin unavailable until you choose them." back={{ href: "/provider", label: "Provider dashboard" }} image="caregiver-arrival">
    <Notice>Demo availability is saved on this browser only. It does not change public search, cancel existing bookings or automatically accept visits.</Notice>
    {error ? <Notice error>{error}</Notice> : data === undefined ? <Notice>Loading availability…</Notice> : !data || !user ? <><Notice>Complete your provider profile before setting hours.</Notice><LinkButton href="/provider/onboarding">Set up profile</LinkButton></> : <AvailabilityEditor userId={user.id} providerId={data.provider.id} initial={data.days} />}
  </PageShell>;
}
function AvailabilityEditor({ userId, providerId, initial }: { userId: string; providerId: string; initial: AvailabilityDay[] }) {
  const [days, setDays] = useState(initial), [message, setMessage] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  function update(day: number, changes: Partial<AvailabilityDay>) { setMessage(""); setDays((all) => all.map((d) => d.day === day ? { ...d, ...changes } : d)); }
  async function save(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { await saveAvailability(userId, providerId, days); setMessage("Your demo hours are saved. Existing bookings are unchanged."); } catch(e) { setError(e instanceof Error ? e.message : "Unable to save hours."); } finally { setBusy(false); } }
  return <form onSubmit={save} className="flex flex-col gap-5"><fieldset><legend className="mb-4 text-xl font-semibold">Weekly availability</legend>{days.map((d) => <div key={d.day} className="grid gap-4 border-b border-border py-5 sm:grid-cols-[1fr_1fr_1fr] sm:items-end"><label className="flex min-h-tap items-center gap-3 font-medium"><input type="checkbox" checked={d.enabled} onChange={(e) => update(d.day, { enabled: e.target.checked })} className="h-5 w-5 accent-accent" />{DAYS[d.day]}<span className="sr-only"> available</span></label>{d.enabled ? <><TextField label={`${DAYS[d.day]} start`} type="time" required value={d.start} onChange={(e) => update(d.day, { start: e.target.value })} /><TextField label={`${DAYS[d.day]} end`} type="time" required value={d.end} onChange={(e) => update(d.day, { end: e.target.value })} /></> : <p className="min-h-tap py-3 text-sm text-text-secondary sm:col-span-2">Unavailable</p>}</div>)}</fieldset>{message && <Notice>{message}</Notice>}{error && <Notice error>{error}</Notice>}<Button type="submit" disabled={busy} className="self-start">{busy ? "Saving…" : "Save demo hours"}</Button></form>;
}

export function EditProviderProfile() {
  const user = useRequireRole("provider");
  const loader = useCallback(async () => user ? getMyProvider(user.id) : null, [user]);
  const { data, error } = useResource(loader);
  return <PageShell title="Let families get to know you." description="Update your introduction and the area you serve. Keep sensitive personal details out of your public bio." back={{ href: "/provider/settings", label: "Provider settings" }} image="elder-care-checkin">
    {error ? <Notice error>{error}</Notice> : data === undefined ? <Notice>Loading profile…</Notice> : !data || !user ? <><Notice>Create a provider profile to continue.</Notice><LinkButton href="/provider/onboarding">Set up profile</LinkButton></> : <ProfileEditor initial={data} userId={user.id} />}
  </PageShell>;
}
function ProfileEditor({ initial, userId }: { initial: Provider; userId: string }) {
  const [profile, setProfile] = useState(initial), [name, setName] = useState(initial.name), [bio, setBio] = useState(initial.bio ?? ""), [radius, setRadius] = useState(initial.service_radius_km);
  const [message, setMessage] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  async function save(event: React.FormEvent) { event.preventDefault(); setBusy(true); setMessage(""); setError(""); try { setProfile(await updatePublicProfile(userId, { name, bio, radius })); setMessage("Your demo profile is saved. These edits do not perform a new identity or background check."); } catch(e) { setError(e instanceof Error ? e.message : "Unable to save profile."); } finally { setBusy(false); } }
  return <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]"><form onSubmit={save} className="flex flex-col gap-5"><TextField label="Public display name" value={name} maxLength={100} required onChange={(e) => setName(e.target.value)} /><TextAreaField label="Your care experience and approach" value={bio} maxLength={1200} onChange={(e) => setBio(e.target.value)} /><p className="text-xs text-text-secondary">{bio.length}/1,200 characters. Do not include phone numbers, addresses or client details.</p><TextField label="Service radius (km)" type="number" min={1} max={50} required value={radius} onChange={(e) => setRadius(Number(e.target.value))} /><Notice>Your service category is {profile.type === "caregiver" ? "elder care" : "babysitting"}. Category and verification changes belong to the review process, not public-profile editing.</Notice>{message && <Notice>{message}</Notice>}{error && <Notice error>{error}</Notice>}<Button disabled={busy} type="submit">{busy ? "Saving…" : "Save demo profile"}</Button></form><aside className="flex flex-col gap-4 self-start rounded-lg bg-surface-secondary p-6"><h2 className="text-xl font-semibold">Current saved profile</h2><h3 className="text-lg font-semibold">{profile.name}</h3><VerificationChip status={profile.verification_status} /><p className="whitespace-pre-wrap break-words text-sm leading-sm text-text-secondary">{profile.bio || "Add an introduction to help families understand your approach."}</p><p className="text-sm text-text-secondary">Within {profile.service_radius_km} km</p>{profile.verification_status === "approved" && <LinkButton href={`/providers/${profile.id}`} variant="secondary">View public profile</LinkButton>}<LinkButton href="/provider/verification-status" variant="secondary">Verification status</LinkButton></aside></div>;
}
