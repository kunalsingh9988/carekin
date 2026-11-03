"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { useResource } from "@/lib/hooks/useResource";
import { listWorkspaceUsers } from "@/lib/storage/repositories/workspace";
import { getProvider, getDocuments, getVerificationStatus } from "@/lib/storage/repositories/providers";
import { approveProvider, rejectProvider } from "@/lib/storage/repositories/admin";
import { PageShell, Notice, DetailRows } from "./PageShell";
import { TextField, SelectField, TextAreaField } from "@/components/ui/FormField";
import { Button, LinkButton } from "@/components/ui/Button";
import { VerificationChip } from "@/components/verification/VerificationChip";

export function AdminUsers() {
  const user = useRequireRole("admin");
  const loader = useCallback(async () => user ? listWorkspaceUsers() : null, [user]);
  const { data, error, reload } = useResource(loader);
  const [query, setQuery] = useState(""), [role, setRole] = useState("all");
  const filtered = data?.filter((u) => (role === "all" || u.role === role) && `${u.name} ${u.id} ${u.detail}`.toLowerCase().includes(query.toLowerCase()));
  return <PageShell title="The people behind the care." description="Find family and provider records in the local demo workspace." back={{ href: "/admin", label: "Operations dashboard" }}>
    <Notice>Demo directory only. Real account suspension, invitations, role changes and identity access require a secure backend and are not available here.</Notice>
    <div className="grid gap-4 sm:grid-cols-[2fr_1fr]"><TextField label="Search people" placeholder="Name or user ID" value={query} onChange={(e) => setQuery(e.target.value)} /><SelectField label="Account role" value={role} onChange={(e) => setRole(e.target.value)}><option value="all">All roles</option><option value="family">Families</option><option value="provider">Providers</option><option value="admin">Admins</option></SelectField></div>
    {error ? <><Notice error>{error}</Notice><Button onClick={reload}>Try again</Button></> : !data ? <Notice>Loading directory…</Notice> : <><p role="status" className="text-sm text-text-secondary">{filtered?.length ?? 0} matching records</p><div className="divide-y divide-border">{filtered?.map((u) => <article key={`${u.role}-${u.id}`} className="grid gap-3 py-5 sm:grid-cols-[1fr_auto]"><div className="min-w-0"><h2 className="text-lg font-semibold">{u.name}</h2><p className="mt-1 text-sm capitalize text-text-secondary">{u.role} · {u.detail}</p><p className="mt-2 break-all text-xs text-text-secondary">User ID: {u.id}</p></div>{u.href && <LinkButton href={u.href} variant="secondary">Review provider</LinkButton>}</article>)}</div>{!filtered?.length && <Notice>No matching accounts. Clear the search or choose another role.</Notice>}</>}
  </PageShell>;
}

export function AdminProviderReview({ id }: { id: string }) {
  const user = useRequireRole("admin");
  const loader = useCallback(async () => {
    if (!user) return null;
    const provider = await getProvider(id);
    return provider ? { provider, documents: await getDocuments(id), verification: await getVerificationStatus(id) } : null;
  }, [id, user]);
  const { data, error, reload } = useResource(loader);
  const [reason, setReason] = useState(""), [reviewed, setReviewed] = useState(false), [busy, setBusy] = useState(false), [actionError, setActionError] = useState(""), [message, setMessage] = useState("");
  async function decide(approve: boolean) {
    if (!user || !reviewed || (!approve && !reason.trim())) return;
    setBusy(true); setActionError("");
    try { if (approve) await approveProvider(id, user.id); else await rejectProvider(id, reason.trim(), user.id); setMessage(`Demo application ${approve ? "approved" : "rejected"}. No real identity or background checks were performed.`); reload(); }
    catch(e) { setActionError(e instanceof Error ? e.message : "Unable to save decision."); }
    finally { setBusy(false); }
  }
  return <PageShell title="Review the person, not just the profile." description="See the application, document records and decision history together." back={{ href: "/admin/verification-queue", label: "Verification queue" }}>
    {error ? <Notice error>{error}</Notice> : data === undefined ? <Notice>Loading application…</Notice> : !data ? <Notice error>Provider record not found.</Notice> : <>
      <Notice>All reviews here are simulated. Document records contain filenames, not verified evidence or downloadable files.</Notice>
      <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]"><section><div className="flex flex-wrap items-center gap-4"><h2 className="text-2xl font-semibold">{data.provider.name}</h2><VerificationChip status={data.provider.verification_status} /></div><DetailRows rows={[["Service", data.provider.type === "caregiver" ? "Elder care" : "Babysitting"], ["Phone (demo record)", data.provider.phone], ["Service radius", `${data.provider.service_radius_km} km`], ["Introduction", data.provider.bio || "No introduction supplied"]]} /><h2 className="mt-8 text-xl font-semibold">Document records</h2>{data.documents.length ? <ul className="mt-3 divide-y divide-border">{data.documents.map((d) => <li key={d.id} className="py-4 text-sm"><p className="capitalize">{d.type.replaceAll("_", " ")}</p><p className="mt-1 break-all text-text-secondary">{d.filename} · {d.status}</p></li>)}</ul> : <p className="mt-3 text-text-secondary">No document records submitted.</p>}<h2 className="mt-8 text-xl font-semibold">Decision history</h2><ol className="mt-3 divide-y divide-border">{data.verification.reviews.map((r) => <li key={r.id} className="py-4 text-sm"><p className="font-semibold capitalize">{r.from_status ?? "New application"} → {r.to_status}</p><p className="mt-1 break-words text-text-secondary">{r.reason ?? "No reason recorded"}</p><p className="mt-1 text-xs text-text-secondary">{new Date(r.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {r.reviewed_by ?? "Application submission"}</p></li>)}</ol></section><aside className="flex flex-col gap-4 self-start rounded-lg bg-surface-secondary p-6"><h2 className="text-xl font-semibold">Review decision</h2>{data.provider.verification_status !== "pending" ? <p className="text-sm leading-sm text-text-secondary">This application has already been reviewed. The demo does not reopen finalized decisions.</p> : <><TextAreaField label="Rejection reason (required to reject)" value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} /><label className="flex items-start gap-3 text-sm leading-sm"><input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-accent" />I have reviewed this demo application and understand this is not a real verification.</label><Button disabled={busy || !reviewed || !data.documents.length} onClick={() => decide(true)}>{busy ? "Saving…" : "Approve demo application"}</Button>{!data.documents.length && <p className="text-sm text-text-secondary">Add document records before approval.</p>}<Button variant="secondary" disabled={busy || !reviewed || !reason.trim()} onClick={() => decide(false)}>Reject demo application</Button></>}{data.provider.verification_status === "approved" && <Link href={`/providers/${id}`} className="min-h-tap py-3 text-sm font-semibold text-accent-text">View public profile →</Link>}</aside></div>{message && <Notice>{message}</Notice>}{actionError && <Notice error>{actionError}</Notice>}
    </>}
  </PageShell>;
}
