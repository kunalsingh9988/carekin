"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, remote } from "@/lib/backend/browser";
import { refreshCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import type { CurrentUser } from "@/lib/storage/types";

export function safeNext(value: string | null, role: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return `/${role}`;
  return value;
}

export function BackendSignIn({ next, onDone, defaultRole = "family" }: { next?: string; onDone?: () => void; defaultRole?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(defaultRole === "provider" ? "provider" : "family");
  const [mode, setMode] = useState<"login" | "signup" | "recover" | "setup">("login");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  useEffect(() => {
    let active=true;
    void supabaseBrowser().auth.getUser().then(async ({data}) => {
      if (!data.user || !active) return;
      const account=await remote<CurrentUser|null>("auth.me");
      if(!active) return;
      if(!account) { setRole(data.user.user_metadata.requested_role === "provider" ? "provider" : "family"); setMode("setup"); }
    }).catch(() => {});
    return () => { active=false; };
  },[]);
  async function finish() {
    let account = await remote<CurrentUser | null>("auth.me");
    if (!account) {
      if (mode === "signup" || mode === "setup") account = await remote<CurrentUser>("auth.enroll", [role]);
      else { setMode("setup"); return; }
    }
    await refreshCurrentUser(); onDone?.();
    let destination = safeNext(next ?? null, account!.role);
    if (!next && account!.role !== "admin") {
      const profile = await remote(account!.role === "family" ? "families.getFamilyProfile" : "providers.getMyProvider", [account!.id]);
      if (!profile) destination = `/${account!.role}/onboarding`;
    }
    router.push(destination); router.refresh();
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const client = supabaseBrowser();
      if (mode === "setup") { await finish(); return; }
      if (mode === "recover") {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
        if (error) throw error;
        setMessage("If this email can receive account recovery messages, a reset link has been requested. Development email delivery is limited."); return;
      }
      if (mode === "signup") {
        const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { requested_role: role } } });
        if (error) throw error;
        if (!data.session) { setMessage("Check your email to confirm your account, then sign in. Supabase's development mail service only delivers to project team addresses unless SMTP is configured."); return; }
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password }); if (error) throw error;
      }
      await finish();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to sign in."); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="flex flex-col gap-4">
    <h1 className="text-2xl font-semibold">{mode === "signup" ? "Create your CareKin account" : mode === "recover" ? "Reset your password" : mode === "setup" ? "Choose your account" : "Welcome back"}</h1>
    <p className="text-sm text-text-secondary">Email sign-in is available during development. SMS verification is not connected.</p>
    {(mode === "signup" || mode === "setup") && <label className="grid gap-2 text-sm">I’m here to<select value={role} onChange={e => setRole(e.target.value)} className="min-h-tap rounded-md border border-border bg-surface px-3 text-text-primary"><option value="family">Find care for my family</option><option value="provider">Provide care</option></select></label>}
    {mode !== "setup" && <label className="grid gap-2 text-sm">Email<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="min-h-tap rounded-md border border-border bg-surface px-3 text-text-primary" /></label>}
    {(mode === "login" || mode === "signup") && <label className="grid gap-2 text-sm">Password<input type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} className="min-h-tap rounded-md border border-border bg-surface px-3 text-text-primary" /></label>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}{message && <p role="status" className="text-sm text-text-secondary">{message}</p>}
    <Button disabled={busy} type="submit">{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "recover" ? "Send reset link" : mode === "setup" ? "Continue" : "Sign in"}</Button>
    {mode !== "setup" && <div className="flex flex-wrap gap-4 text-sm"><button type="button" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setMessage(""); }}>{mode === "signup" ? "Already have an account? Sign in" : "Create an account"}</button><button type="button" onClick={() => setMode(mode === "recover" ? "login" : "recover")}>{mode === "recover" ? "Back to sign in" : "Forgot password?"}</button></div>}
  </form>;
}
