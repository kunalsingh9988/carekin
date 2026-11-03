"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BackendSignIn } from "@/components/auth/BackendSignIn";
function Form() { const params = useSearchParams(); return <BackendSignIn next={params.get("next") ?? undefined} />; }
export default function SignIn() { return <main className="mx-auto w-full max-w-lg px-6 py-12"><Suspense fallback={<p>Loading sign-in…</p>}><Form /></Suspense></main>; }
