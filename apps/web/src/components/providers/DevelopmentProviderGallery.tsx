import Image from "next/image";
import Link from "next/link";
import { DEMO_PROFILE_NOTICE, SHOW_DEVELOPMENT_PROVIDERS, listDevelopmentProviders } from "@/lib/development-providers";
import type { ProviderType } from "@/lib/storage/types";

export function DevelopmentProviderGallery({type,query}:{type:ProviderType;query:string}) {
  if (!SHOW_DEVELOPMENT_PROVIDERS) return null;
  const profiles=listDevelopmentProviders(type,query);
  return <section aria-labelledby="development-profiles-heading" className="grid gap-5">
    <div className="grid gap-2"><h2 id="development-profiles-heading" className="text-2xl font-semibold text-text-primary">Explore demo {type==="caregiver"?"caregivers":"babysitters"}</h2>
      <p className="text-sm leading-sm text-text-secondary">{profiles.length} fictional {profiles.length===1?"profile":"profiles"} · Visible across all locations for development testing. Not local availability, verified identities or real services. Bookings are disabled.</p>
    </div>
    {profiles.length===0 && <p className="text-sm text-text-secondary">No demo profiles match your search. Try a different name or care need.</p>}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{profiles.map(profile=><article key={profile.id} className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="relative aspect-[16/10] bg-surface-secondary"><Image src={`/images/carekin/brand-v2/${profile.scene}.webp`} alt="AI-generated illustrative care scene, not a portrait of this fictional person" fill unoptimized sizes="(max-width:639px) 100vw, (max-width:1023px) 50vw, 33vw" className={`object-cover ${profile.scene==="caregiver-arrival"?"object-top":"object-center"}`} /><span className="absolute bottom-3 left-3 rounded-md bg-ink px-2 py-1 text-xs text-white">AI-generated illustration</span></div>
      <div className="flex flex-1 flex-col gap-3 p-5"><h3 className="text-lg font-semibold text-text-primary">{profile.name}</h3>
        <p className="text-sm font-semibold text-accent-text">{DEMO_PROFILE_NOTICE}</p>
        <p className="break-all text-xs text-text-secondary">ID: {profile.id}</p>
        <p className="text-sm leading-sm text-text-secondary">Sample focus: {profile.focus}</p>
        <p className="text-sm text-text-secondary">All-location preview only · No real bookings</p>
        <Link href={`/demo-providers/${profile.id}`} className="mt-auto flex min-h-tap items-center justify-center rounded-md bg-accent-tint px-4 text-sm font-semibold text-accent-text">View demo profile</Link>
      </div>
    </article>)}</div>
  </section>;
}
