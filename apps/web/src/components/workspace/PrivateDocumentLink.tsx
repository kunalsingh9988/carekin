"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/backend/browser";
import { backendEnabled } from "@/lib/backend/config";
export function PrivateDocumentLink({ path }: { path?: string }) {
  const [url,setUrl]=useState(""),[error,setError]=useState("");
  if(!backendEnabled || !path) return null;
  async function open() {
    const { data,error }=await supabaseBrowser().storage.from("carekin-documents").createSignedUrl(path!,60);
    if(error) setError(error.message); else setUrl(data.signedUrl);
  }
  return <div className="mt-2">{url?<a href={url} target="_blank" rel="noopener noreferrer" className="text-accent-text underline">Open private document (link expires in 60 seconds)</a>:<button onClick={open} className="min-h-tap text-accent-text underline">Prepare private document link</button>}{error&&<p role="alert" className="text-danger">{error}</p>}</div>;
}
