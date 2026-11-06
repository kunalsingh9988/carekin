"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Camera, Upload } from "lucide-react";
import { refreshCurrentUser, saveAccountDetails, saveAccountPhoto, useCurrentUser } from "@/lib/auth";
import { AccountDetailsSchema } from "@/lib/auth/profile";
import { preparePhoto } from "@/lib/auth/avatar";
import { backendEnabled } from "@/lib/backend/config";
import { getFamilyProfile, getCareRecipients, saveFamilyProfile } from "@/lib/storage/repositories/families";
import { getMyProvider } from "@/lib/storage/repositories/providers";
import { updatePublicProfile } from "@/lib/storage/repositories/workspace";
import type { CareRecipient, CurrentUser, FamilyProfile, Provider } from "@/lib/storage/types";
import type { LocationCoordinates } from "@/lib/locations";
import { AccountAvatar } from "@/components/ui/AccountAvatar";
import { Button, LinkButton } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/FormField";
import { LocationPicker } from "@/components/onboarding/LocationPicker";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { VerificationChip } from "@/components/verification/VerificationChip";

const ROLE_NAMES = { family: "Family account", provider: "Care provider account", admin: "Administrator account" };
function message(error: unknown) { return error instanceof Error ? error.message : "Something went wrong. Please try again."; }
function date(value?: string) { return value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Not available"; }

export function AccountProfile() {
  const user = useCurrentUser();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    refreshCurrentUser().then(current => {
      if (!active) return;
      if (!current) router.replace("/sign-in?next=%2Faccount");
      else { setReady(true); setError(""); }
    }).catch(() => { if (active) setError("We couldn’t load your account. Check your connection and retry."); });
    return () => { active = false; };
  }, [router, attempt]);
  if (!ready || !user) return <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">{error ? <><p role="alert">{error}</p><Button className="mt-4" onClick={() => setAttempt(value => value + 1)}>Retry loading profile</Button></> : <p role="status">Loading your profile…</p>}</main>;
  return <ProfileContent key={user.id} user={user} />;
}

function ProfileContent({ user }: { user: CurrentUser }) {
  const [family, setFamily] = useState<FamilyProfile | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [recipients, setRecipients] = useState<CareRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    (async () => {
      if (user.role === "family") {
        const record = await getFamilyProfile(user.id);
        const people = record ? await getCareRecipients(record.id) : [];
        if (active) { setFamily(record); setRecipients(people); }
      } else if (user.role === "provider") {
        const record = await getMyProvider(user.id);
        if (active) setProvider(record);
      }
      if (active) { setLoading(false); setError(""); }
    })().catch(() => { if (active) { setLoading(false); setError("Your care details couldn’t be loaded. Retry before editing."); } });
    return () => { active = false; };
  }, [user.id, user.role, attempt]);
  const displayName = user.display_name || family?.name || provider?.name || "Your CareKin account";
  return <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 text-text-primary sm:px-6 sm:py-12">
    <Link href={`/${user.role}`} className="mb-7 inline-flex min-h-tap items-center gap-2 text-sm text-accent-text"><ArrowLeft size={16} />Back to dashboard</Link>
    <div className="mb-10"><h1 className="text-3xl font-semibold sm:text-4xl">Your profile</h1><p className="mt-3 max-w-2xl text-text-secondary">Your account, your care details, all in one place. Keep them up to date so CareKin works better for you.</p></div>
    <div className="grid min-w-0 gap-8 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-12">
      <aside className="min-w-0 self-start rounded-lg bg-accent-tint p-6 lg:sticky lg:top-28">
        <AccountAvatar name={displayName} email={user.email} src={user.avatar_url} large />
        <h2 className="mt-4 break-words text-2xl font-semibold">{displayName}</h2>
        <p className="mt-2 text-sm text-accent-text">{ROLE_NAMES[user.role]}</p>
        <p className="mt-4 text-sm text-text-secondary">Member since {date(user.created_at)}</p>
        <nav aria-label="Profile sections" className="mt-6 grid border-t border-border pt-4">
          <a href="#personal" className="min-h-tap py-3 text-sm font-medium">Personal details &amp; photo</a>
          <a href="#care" className="min-h-tap py-3 text-sm font-medium">{user.role === "family" ? "Family & care details" : user.role === "provider" ? "Professional profile" : "Administration"}</a>
          <a href="#security" className="min-h-tap py-3 text-sm font-medium">Sign-in &amp; security</a>
          <a href="#preferences" className="min-h-tap py-3 text-sm font-medium">Preferences &amp; support</a>
        </nav>
        <p className="mt-5 text-sm text-text-secondary">Your account photo is private. It is not an identity or background verification.</p>
      </aside>
      <div className="min-w-0 space-y-10">
        <section id="personal" className="scroll-mt-32"><h2 className="text-2xl font-semibold">Personal details</h2><p className="mt-2 text-sm text-text-secondary">Only you can edit these account details.</p><PhotoEditor user={user} /><PersonalDetails user={user} initialName={displayName === "Your CareKin account" ? "" : displayName} /></section>
        <section id="care" className="scroll-mt-32 border-t border-border pt-8">
          <h2 className="mb-3 text-2xl font-semibold">{user.role === "family" ? "Family & care details" : user.role === "provider" ? "Professional profile" : "Administration"}</h2>
          {loading ? <p role="status">Loading care details…</p> : error ? <><p role="alert" className="text-danger">{error}</p><Button variant="secondary" onClick={() => setAttempt(value => value + 1)}>Retry care details</Button></> : user.role === "family" ? family ? <>
            <FamilyDetails initial={family} onSaved={setFamily} />
            <h3 className="mb-2 mt-8 text-lg font-semibold">People you arrange care for</h3>
            {recipients.length ? <ul className="divide-y divide-border">{recipients.map(person => <li key={person.id} className="flex flex-wrap items-center justify-between gap-2 py-4"><span className="break-words font-medium">{person.name}</span><span className="text-sm text-text-secondary">{person.type === "elder" ? "Elder care" : "Child care · guardian consent required"}</span></li>)}</ul> : <p className="text-sm text-text-secondary">No care recipients added yet.</p>}
            <LinkButton href="/family/settings" variant="secondary" className="mt-4">Manage care recipients &amp; consent</LinkButton>
          </> : <><p className="mb-4 text-text-secondary">Add your family and address to finish setting up your care profile.</p><LinkButton href="/family/onboarding">Complete family profile</LinkButton></> : user.role === "provider" ? provider ? <ProviderDetails initial={provider} /> : <><p className="mb-4 text-text-secondary">Introduce yourself and submit your documents to begin the provider review process.</p><LinkButton href="/provider/onboarding">Complete provider profile</LinkButton></> : <><p className="text-text-secondary">Your administrator role is assigned privately. It cannot be changed from this page.</p><div className="mt-4 flex flex-wrap gap-3"><LinkButton href="/admin/verification-queue" variant="secondary">Provider verification queue</LinkButton><LinkButton href="/admin/safety" variant="secondary">Safety reports</LinkButton></div></>}
        </section>
        <section id="security" className="scroll-mt-32 border-t border-border pt-8"><h2 className="text-2xl font-semibold">Sign-in &amp; security</h2>
          <dl className="mt-4 divide-y divide-border text-sm"><Detail label="Email address" value={user.email || "No email on this account"} /><Detail label="Email confirmation" value={user.email ? user.email_verified ? "Confirmed" : "Not confirmed" : "Not applicable"} /><Detail label="Sign-in methods" value={user.auth_providers?.join(", ") || (backendEnabled ? "Not available" : "Demo session")} /><Detail label="Last sign-in" value={date(user.last_sign_in_at)} /><Detail label="Account ID" value={user.id} /></dl>
          <p className="my-4 text-sm text-text-secondary">Google passwords are managed by Google. Open sign-in and choose “Forgot password?” to request email recovery. Delivery depends on the configured email service.</p><LinkButton href="/sign-in" variant="secondary">Email &amp; password help</LinkButton>
        </section>
        <section id="preferences" className="scroll-mt-32 border-t border-border pt-8"><h2 className="text-2xl font-semibold">Preferences &amp; support</h2><p className="mt-2 text-sm text-text-secondary">Appearance and language apply in this browser.</p><div className="mt-4 flex flex-wrap gap-3"><ThemeToggle /><LanguageToggle /></div>
          <div className="mt-6 divide-y divide-border"><ProfileLink href="/contact" label="Contact support or request account deletion" /><ProfileLink href="/privacy" label="How your information is used" /><ProfileLink href="/terms" label="Terms of service" /></div>
        </section>
      </div>
    </div>
  </main>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="grid gap-1 py-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4"><dt className="text-text-secondary">{label}</dt><dd className="min-w-0 break-words font-medium [overflow-wrap:anywhere]">{value}</dd></div>; }
function ProfileLink({ href, label }: { href: string; label: string }) { return <Link href={href} className="flex min-h-tap items-center justify-between gap-4 py-4 text-sm font-medium text-accent-text">{label}<ArrowUpRight className="h-4 w-4 shrink-0" /></Link>; }
function Feedback({ error, success }: { error: string; success: string }) { return <>{error && <p role="alert" className="text-sm text-danger">{error}</p>}{success && <p role="status" className="text-sm text-verified">{success}</p>}</>; }

function PhotoEditor({ user }: { user: CurrentUser }) {
  const uploadInput = useRef<HTMLInputElement>(null), cameraInput = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<Blob | null>(null), [preview, setPreview] = useState("");
  const [error, setError] = useState(""), [success, setSuccess] = useState(""), [busy, setBusy] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const cameraGeneration = useRef(0);
  useEffect(() => () => { cameraGeneration.current += 1; }, []);
  useEffect(() => {
    if (stream && video.current) { video.current.srcObject = stream; void video.current.play().catch(() => setError("Camera preview could not start. Upload a photo instead.")); }
    return () => { stream?.getTracks().forEach(track => track.stop()); };
  }, [stream]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function choose(file?: File) {
    if (!file) return;
    setBusy(true); setError(""); setSuccess("");
    try { const prepared = await preparePhoto(file); setPhoto(prepared); setPreview(URL.createObjectURL(prepared)); }
    catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }
  function closeCamera() { cameraGeneration.current += 1; stream?.getTracks().forEach(track => track.stop()); setStream(null); }
  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) { cameraInput.current?.click(); return; }
    const generation = ++cameraGeneration.current;
    setBusy(true); setError(""); setSuccess("");
    try {
      const camera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1024 }, height: { ideal: 1024 } }, audio: false });
      if (generation !== cameraGeneration.current) { camera.getTracks().forEach(track => track.stop()); return; }
      setStream(camera);
    } catch { setError("We couldn’t access your camera. Allow camera access in your browser, or upload a photo instead."); }
    finally { setBusy(false); }
  }
  async function takePicture() {
    const frame = video.current;
    if (!frame?.videoWidth || !frame.videoHeight) { setError("The camera is still starting. Try taking the picture again."); return; }
    const canvas = document.createElement("canvas"); canvas.width = frame.videoWidth; canvas.height = frame.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) { setError("Photo capture is unavailable. Upload a photo instead."); return; }
    context.drawImage(frame, 0, 0);
    canvas.toBlob(blob => { if (!blob) { setError("Unable to take this picture. Try again."); return; } closeCamera(); void choose(new File([blob], "camera-photo.webp", { type: "image/webp" })); }, "image/webp", 0.88);
  }
  async function save(remove = false) {
    setBusy(true); setError(""); setSuccess("");
    try { await saveAccountPhoto(remove ? null : photo); setPhoto(null); setPreview(""); setSuccess(remove ? "Photo removed. Your account now uses initials." : "Profile photo saved privately. Your header photo is updated too."); }
    catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  }
  return <div className="my-6 grid gap-4 rounded-lg border border-border p-5">
    <h3 className="font-semibold">Profile photo</h3><p className="text-sm text-text-secondary">Use your Google photo, take a new picture, or upload your own. JPG, PNG or WebP, up to 5 MB. Camera metadata is removed before upload.</p>
    {photo && preview && <div className="flex flex-wrap items-center gap-4">
      {/* Local blob preview is never sent until Save photo. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={preview} alt="New profile photo preview" className="h-24 w-24 rounded-full object-cover" />
      <p className="text-sm text-text-secondary">Preview only. Save to use this photo.</p>
    </div>}
    {stream && <div className="grid gap-3"><video ref={video} autoPlay muted playsInline aria-label="Live camera preview" className="aspect-video w-full rounded-md bg-surface-secondary object-contain" /><div className="flex flex-wrap gap-2"><Button type="button" onClick={takePicture}>Take picture</Button><Button type="button" variant="secondary" onClick={closeCamera}>Close camera</Button></div><p className="text-sm text-text-secondary">Camera preview stays on your device. Nothing is uploaded until you save the photo.</p></div>}
    <input ref={uploadInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-label="Upload profile photo" disabled={busy || !backendEnabled} onChange={e => { void choose(e.target.files?.[0]); e.target.value = ""; }} />
    <input ref={cameraInput} type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="sr-only" tabIndex={-1} aria-label="Take profile photo" disabled={busy || !backendEnabled} onChange={e => { void choose(e.target.files?.[0]); e.target.value = ""; }} />
    <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" disabled={busy || !!stream || !backendEnabled} onClick={openCamera}><Camera size={16} />Take a photo</Button><Button type="button" variant="secondary" disabled={busy || !!stream || !backendEnabled} onClick={() => uploadInput.current?.click()}><Upload size={16} />Upload photo</Button>{user.avatar_url && !photo && !stream && <Button type="button" variant="ghost" disabled={busy} onClick={() => save(true)}>Remove photo</Button>}</div>
    <p className="text-sm text-text-secondary">Camera access is optional; uploading works without it. {backendEnabled ? "Photos are visible only in your signed-in account." : "Photo uploads require a connected account; this is a demo session."}</p>
    {photo && <div className="flex flex-wrap gap-2"><Button type="button" disabled={busy} onClick={() => save()}>Save photo</Button><Button type="button" variant="secondary" disabled={busy} onClick={() => { setPhoto(null); setPreview(""); }}>Discard new photo</Button></div>}
    {busy && <p role="status" className="text-sm">Processing photo…</p>}<Feedback error={error} success={success} />
  </div>;
}

function PersonalDetails({ user, initialName }: { user: CurrentUser; initialName: string }) {
  const [name, setName] = useState(initialName), [phone, setPhone] = useState(user.contact_phone || (/^\+[1-9]\d{7,14}$/.test(user.phone) ? user.phone : ""));
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [success, setSuccess] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault(); setError(""); setSuccess("");
    const parsed = AccountDetailsSchema.safeParse({ displayName: name, contactPhone: phone });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setBusy(true);
    try { await saveAccountDetails(parsed.data); setSuccess(backendEnabled ? "Account details saved online." : "Demo account details saved in this browser."); }
    catch(e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <form onSubmit={save} className="grid gap-4"><TextField label="Account display name" autoComplete="name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} /><TextField label="Contact phone (optional)" type="tel" autoComplete="tel" placeholder="+919876543210" maxLength={16} value={phone} onChange={e => setPhone(e.target.value)} /><p className="text-sm text-text-secondary">This is an unverified contact number, not an SMS sign-in method. Changing it does not verify your phone or change a provider’s reviewed contact details.</p><Feedback error={error} success={success} /><Button disabled={busy} type="submit" className="justify-self-start">{busy ? "Saving…" : "Save account details"}</Button></form>;
}

function FamilyDetails({ initial, onSaved }: { initial: FamilyProfile; onSaved: (value: FamilyProfile) => void }) {
  const [name, setName] = useState(initial.name), [address, setAddress] = useState(initial.address);
  const [location, setLocation] = useState<LocationCoordinates | null>({ latitude: initial.latitude, longitude: initial.longitude });
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [success, setSuccess] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault(); setError(""); setSuccess("");
    if (!name.trim() || !address.trim() || !location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude) || Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) { setError("Add your family name, address and a valid location."); return; }
    setBusy(true);
    try { onSaved(await saveFamilyProfile(initial.user_id, { name: name.trim(), address: address.trim(), ...location })); setSuccess("Family details saved. Existing booking details are unchanged."); }
    catch(e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <form onSubmit={save} className="grid gap-4"><p className="text-sm text-text-secondary">Your home address and coordinates stay out of public search. Share only the information needed for care.</p><TextField label="Family contact name" value={name} required maxLength={100} onChange={e => setName(e.target.value)} /><TextAreaField label="Home address" autoComplete="street-address" value={address} required maxLength={500} onChange={e => setAddress(e.target.value)} /><LocationPicker value={location} onChange={setLocation} /><Feedback error={error} success={success} /><Button type="submit" disabled={busy} className="justify-self-start">{busy ? "Saving…" : "Save family details"}</Button></form>;
}

function ProviderDetails({ initial }: { initial: Provider }) {
  const [provider, setProvider] = useState(initial), [name, setName] = useState(initial.name), [bio, setBio] = useState(initial.bio || ""), [radius, setRadius] = useState(initial.service_radius_km);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [success, setSuccess] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault(); setError(""); setSuccess("");
    if (!name.trim() || !Number.isFinite(radius) || radius < 1 || radius > 50) { setError("Enter your public name and a service radius from 1 to 50 km."); return; }
    setBusy(true);
    try { setProvider(await updatePublicProfile(initial.user_id, { name: name.trim(), bio, radius })); setSuccess("Professional profile saved. Verification status is unchanged."); }
    catch(e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <div className="grid gap-5"><div className="flex flex-wrap items-center gap-3"><span>{provider.type === "caregiver" ? "Elder caregiver" : "Babysitter"}</span><VerificationChip status={provider.verification_status} /></div><p className="text-sm text-text-secondary">These professional details appear in search only after approval. Your private account photo does not replace identity documents or your public illustrative image.</p><form onSubmit={save} className="grid gap-4"><TextField label="Public display name" value={name} required maxLength={100} onChange={e => setName(e.target.value)} /><TextAreaField label="Care experience, languages & approach" value={bio} maxLength={1200} onChange={e => setBio(e.target.value)} /><p className="text-sm text-text-secondary">{bio.length}/1,200 characters. Keep addresses, private contact information and client details out of your bio.</p><TextField label="Service radius (km)" type="number" min={1} max={50} required value={radius} onChange={e => setRadius(Number(e.target.value))} /><Feedback error={error} success={success} /><Button type="submit" disabled={busy} className="justify-self-start">{busy ? "Saving…" : "Save professional profile"}</Button></form><dl className="divide-y divide-border text-sm"><Detail label="Provider ID" value={provider.id} /><Detail label="Reviewed contact" value={provider.phone} /><Detail label="Saved service location" value={`${provider.latitude.toFixed(4)}, ${provider.longitude.toFixed(4)}`} /></dl><div className="flex flex-wrap gap-3"><LinkButton href="/provider/availability" variant="secondary">Manage availability</LinkButton><LinkButton href="/provider/verification-status" variant="secondary">Documents &amp; verification</LinkButton>{provider.verification_status === "approved" && <LinkButton href={`/providers/${provider.id}`} variant="secondary">View public profile</LinkButton>}</div><p className="text-sm text-text-secondary">Contact support to change reviewed contact or service-location details.</p></div>;
}
