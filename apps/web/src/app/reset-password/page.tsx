"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/backend/browser";
import { Button } from "@/components/ui/Button";
export default function ResetPassword() {
  const [password,setPassword]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  const [sessionReady,setSessionReady]=useState<boolean|null>(null),[saved,setSaved]=useState(false);
  useEffect(() => {
    let active=true;
    void supabaseBrowser().auth.getUser().then(({data,error}) => {
      if(active) setSessionReady(!error && !!data.user);
    }).catch(() => { if(active) setSessionReady(false); });
    return () => { active=false; };
  },[]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if(busy || !sessionReady || saved) return;
    setBusy(true); setMessage("");
    try {
      const { error }=await supabaseBrowser().auth.updateUser({ password });
      if(error) throw error;
      setPassword(""); setSaved(true); setMessage("Password updated. You can now use your new password to sign in.");
    } catch(e) { setMessage(e instanceof Error?e.message:"Unable to update password."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto w-full max-w-lg px-6 py-12">
    {sessionReady === null ? <p role="status">Checking your reset session…</p> : !sessionReady ?
      <div className="grid gap-4"><h1 className="text-2xl font-semibold">Request a new reset link</h1><p>Your reset session is missing or expired. Request a new password reset email and open its newest link in this browser.</p><Link className="text-accent-text" href="/sign-in">Return to sign in</Link></div> :
      <form onSubmit={submit} className="grid gap-4"><h1 className="text-2xl font-semibold">{saved ? "Password updated" : "Choose a new password"}</h1>
        {!saved && <><label className="grid gap-2">New password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="min-h-tap rounded-md border border-border bg-surface px-3 text-text-primary" /></label><Button type="submit" disabled={busy}>{busy?"Saving…":"Update password"}</Button></>}
        <p role="status">{message}</p><Link className="text-accent-text" href="/sign-in">Return to sign in</Link>
      </form>}
  </main>;
}
