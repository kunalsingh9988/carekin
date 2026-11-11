import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DEMO_PROFILE_NOTICE, getDevelopmentProvider } from "@/lib/development-providers";

export const metadata:Metadata={title:"Fictional demo provider",robots:{index:false,follow:false}};
export default async function DevelopmentProviderPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const profile=getDevelopmentProvider(id);
  if (!profile) notFound();
  return <main className="mx-auto grid w-full max-w-5xl gap-6 px-6 py-8">
    <Link href={`/search?type=${profile.type}`} className="min-h-tap text-sm font-semibold text-accent-text">Back to search</Link>
    <div className="grid gap-6 md:grid-cols-2 md:items-start">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-secondary"><Image src={`/images/carekin/brand-v2/${profile.scene}.webp`} alt="AI-generated illustrative care scene, not a portrait of a real provider" fill priority unoptimized sizes="(max-width:767px) 100vw, 50vw" className={`object-cover ${profile.scene==="caregiver-arrival"?"object-top":"object-center"}`} /><span className="absolute bottom-3 left-3 rounded-md bg-ink px-3 py-1 text-sm text-white">AI-generated illustration</span></div>
      <div className="grid gap-5"><h1 className="text-3xl font-bold text-text-primary">{profile.name}</h1>
        <p className="font-semibold text-accent-text">{DEMO_PROFILE_NOTICE}</p>
        <p className="break-all text-sm text-text-secondary">Profile ID: {profile.id}</p>
        <p className="text-text-primary">{profile.bio}</p>
        <div className="grid gap-2"><h2 className="text-lg font-semibold">Sample care focus</h2><p className="text-text-secondary">{profile.focus}</p></div>
        <p className="text-sm leading-sm text-text-secondary">This fictional {profile.type==="caregiver"?"caregiver":"babysitter"} is shown in every location for development testing only. No background checks, qualifications, ratings, reviews or local availability are claimed. The illustration is not identity evidence.</p>
        <Link href={`/book/${profile.id}`} className="flex min-h-tap items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover">Book a demo visit →</Link>
        <p className="text-xs text-text-secondary">Demo bookings walk through the real booking flow for testing — no real provider is notified and no visit will take place.</p>
      </div>
    </div>
  </main>;
}
