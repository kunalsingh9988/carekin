"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, remote } from "@/lib/backend/browser";
import { refreshCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import type { CurrentUser } from "@/lib/storage/types";
import { authCallbackUrl, authErrorMessage, safeNext, signupRole } from "@/lib/auth/redirects";

export function BackendSignIn({ next, onDone, defaultRole = "family", callbackError, resumeSession = false }: { next?: string; onDone?: () => void; defaultRole?: string; callbackError?: string; resumeSession?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(signupRole(defaultRole));
  const [mode, setMode] = useState<"login" | "signup" | "recover" | "resend" | "setup">("login");
  const [busy, setBusy] = useState(resumeSession), [error, setError] = useState(authErrorMessage(callbackError)), [message, setMessage] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);
  useEffect(() => {
    const restore = () => setGoogleBusy(false);
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);
  useEffect(() => {
    let active=true;
    void supabaseBrowser().auth.getUser().then(async ({data}) => {
      if (!active) return;
      if (!data.user) { setBusy(false); return; }
      const account=await remote<CurrentUser|null>("auth.me");
      if(!active) return;
      if(!account) {
        setRole(signupRole(data.user.user_metadata.requested_role ?? defaultRole)); setMode("setup"); setBusy(false);
      } else if (resumeSession) {
        let destination = safeNext(next, `/${account.role}`);
        if (!next && account.role !== "admin") {
          const profile = await remote(account.role === "family" ? "families.getFamilyProfile" : "providers.getMyProvider", [account.id]);
          if (!profile) destination = `/${account.role}/onboarding`;
        }
        if (!active) return;
        await refreshCurrentUser(); router.replace(destination); router.refresh();
      }
    }).catch(() => { if(active) { setBusy(false); setError("We couldn’t restore your session. Please sign in again."); } });
    return () => { active=false; };
  },[defaultRole, next, resumeSession, router]);
  async function finish() {
    let account = await remote<CurrentUser | null>("auth.me");
    if (!account) {
      if (mode === "signup" || mode === "setup") account = await remote<CurrentUser>("auth.enroll", [role]);
      else { setMode("setup"); return; }
    }
    await refreshCurrentUser(); onDone?.();
    let destination = safeNext(next, `/${account!.role}`);
    if (!next && account!.role !== "admin") {
      const profile = await remote(account!.role === "family" ? "families.getFamilyProfile" : "providers.getMyProvider", [account!.id]);
      if (!profile) destination = `/${account!.role}/onboarding`;
    }
    router.push(destination); router.refresh();
  }
  async function signInWithGoogle() {
    if (busy || googleBusy) return;
    setGoogleBusy(true); setError(""); setMessage("");
    try {
      const { error } = await supabaseBrowser().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: authCallbackUrl(window.location.origin, next, role), queryParams: { prompt: "select_account" } },
      });
      if (error) throw error;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Google sign-in could not start. Try again or sign in with email.");
      setGoogleBusy(false);
    }
  }
  function changeMode(value: typeof mode) { setMode(value); setError(""); setMessage(""); }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || googleBusy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const client = supabaseBrowser();
      if (mode === "setup") { await finish(); return; }
      if (mode === "resend") {
        const { error } = await client.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: authCallbackUrl(window.location.origin, next, role) } });
        if (error) throw error;
        setMessage("If this account needs confirmation, a new email has been requested. Open only the newest link in this browser. Email delivery limits may apply."); return;
      }
      if (mode === "recover") {
        const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: authCallbackUrl(window.location.origin, "/reset-password") });
        if (error) throw error;
        setMessage("If this email can receive account recovery messages, a reset link has been requested. Development email delivery is limited."); return;
      }
      if (mode === "signup") {
        const { data, error } = await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: authCallbackUrl(window.location.origin, next, role), data: { requested_role: role } } });
        if (error) throw error;
        if (!data.session) { setMessage("Check your email to confirm your account, then sign in. Supabase's development mail service only delivers to project team addresses unless SMTP is configured."); return; }
      } else {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password }); if (error) throw error;
      }
      await finish();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to sign in."); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="flex min-w-0 flex-col gap-4" aria-busy={busy || googleBusy}>
    <h1 className="text-2xl font-semibold">{mode === "signup" ? "Create your CareKin account" : mode === "recover" ? "Reset your password" : mode === "resend" ? "Confirm your email" : mode === "setup" ? "Choose your account" : "Welcome back"}</h1>
    <p className="text-sm text-text-secondary">{mode === "setup" ? "One last step: tell us how you’d like to use CareKin." : mode === "recover" ? "Enter your account email to request a password reset link." : mode === "resend" ? "Request a fresh confirmation link, then open the newest email in this browser." : "Use Google or your email and password. No phone OTP needed."}</p>
    {(mode === "signup" || mode === "setup") && <label className="grid gap-2 text-sm">I’m here to<select disabled={busy || googleBusy} value={role} onChange={e => setRole(signupRole(e.target.value))} className="min-h-tap rounded-md border border-border bg-surface px-3 text-text-primary"><option value="family">Find care for my family</option><option value="provider">Provide care</option></select></label>}
    {(mode === "login" || mode === "signup") && <><Button type="button" variant="secondary" disabled={busy || googleBusy} onClick={signInWithGoogle} fullWidth>{googleBusy ? "Opening Google…" : "Continue with Google"}</Button><div className="flex items-center gap-3 text-sm text-text-secondary"><span className="h-px flex-1 bg-border" /><span>or use email</span><span className="h-px flex-1 bg-border" /></div></>}
    {mode !== "setup" && <label className="grid gap-2 text-sm">Email<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="min-h-tap rounded-md border border-border bg-surface px-3 text-text-primary" /></label>}
    {(mode === "login" || mode === "signup") && <label className="grid gap-2 text-sm">Password<input type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} className="min-h-tap rounded-md border border-border bg-surface px-3 text-text-primary" /></label>}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}{message && <p role="status" className="text-sm text-text-secondary">{message}</p>}
    <Button disabled={busy || googleBusy} type="submit">{busy ? "Please wait…" : mode === "signup" ? "Create account with email" : mode === "recover" ? "Send reset link" : mode === "resend" ? "Resend confirmation email" : mode === "setup" ? "Continue" : "Sign in with email"}</Button>
    {mode !== "setup" && <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm"><button className="min-h-tap text-accent-text" disabled={busy || googleBusy} type="button" onClick={() => changeMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "Already have an account? Sign in" : "Create an account"}</button><button className="min-h-tap" disabled={busy || googleBusy} type="button" onClick={() => changeMode(mode === "recover" || mode === "resend" ? "login" : "recover")}>{mode === "recover" || mode === "resend" ? "Back to sign in" : "Forgot password?"}</button>{(mode === "login" || mode === "signup") && <button className="min-h-tap" disabled={busy || googleBusy} type="button" onClick={() => changeMode("resend")}>Resend confirmation email</button>}</div>}
  </form>;
}
