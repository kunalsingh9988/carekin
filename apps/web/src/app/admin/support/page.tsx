"use client";
import { useCallback, useState } from "react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { useResource } from "@/lib/hooks/useResource";
import { remote } from "@/lib/backend/browser";
import { PageShell, Notice } from "@/components/workspace/PageShell";
import { Button } from "@/components/ui/Button";
type Ticket = { id:string; name:string; email:string; topic:string; message:string; status:string; created_at:string };
export default function SupportQueue() {
  const user=useRequireRole("admin"),[actionError,setActionError]=useState("");
  const load=useCallback(async()=>user?remote<Ticket[]>("admin.listSupportTickets"):[],[user]);
  const {data,error,reload}=useResource(load);
  async function resolve(id:string) { try { await remote("admin.resolveSupportTicket",[id]); reload(); } catch(e) { setActionError(e instanceof Error?e.message:"Unable to resolve."); } }
  return <PageShell title="Support requests" description="Private requests submitted by signed-in users. No outgoing email or staffed response is connected." back={{href:"/admin",label:"Operations"}}>{(error||actionError)&&<Notice error>{error||actionError}</Notice>}{data?.map(t=><article key={t.id} className="grid gap-3 rounded-lg border border-border p-5"><h2 className="text-xl font-semibold">{t.topic} · {t.status}</h2><p>{t.name} · {t.email}</p><p className="whitespace-pre-wrap break-words">{t.message}</p><p className="text-xs text-text-secondary">{new Date(t.created_at).toLocaleString()}</p>{t.status==="open"&&<Button onClick={()=>resolve(t.id)}>Mark resolved</Button>}</article>)}{data?.length===0&&<Notice>No support requests.</Notice>}</PageShell>;
}
