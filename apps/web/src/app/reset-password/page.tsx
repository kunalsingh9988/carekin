"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/backend/browser";
import { Button } from "@/components/ui/Button";
export default function ResetPassword() {
  const [password,setPassword]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); try { const { error }=await supabaseBrowser().auth.updateUser({ password }); if(error) throw error; setMessage("Password updated. You can now sign in with your new password."); } catch(e) { setMessage(e instanceof Error?e.message:"Unable to update password."); } finally { setBusy(false); } }
  return <main className="mx-auto w-full max-w-lg px-6 py-12"><form onSubmit={submit} className="grid gap-4"><h1 className="text-2xl font-semibold">Choose a new password</h1><label className="grid gap-2">New password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="min-h-tap rounded-md border border-border bg-surface px-3 text-text-primary" /></label><Button type="submit" disabled={busy}>{busy?"Saving…":"Update password"}</Button><p role="status">{message}</p></form></main>;
}
