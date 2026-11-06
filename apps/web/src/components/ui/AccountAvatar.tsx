"use client";
import { useState } from "react";
import { accountInitials, googleAvatarUrl } from "@/lib/auth/profile";
import { backendConfig } from "@/lib/backend/config";

export function AccountAvatar({ name, email, src, large = false }: { name?: string; email?: string; src?: string; large?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  let privatePhoto: string | undefined;
  try {
    if (src) {
      const url = new URL(src);
      if (url.origin === new URL(backendConfig().url).origin && url.pathname.startsWith("/storage/v1/object/sign/carekin-avatars/")) privatePhoto = url.href;
    }
  } catch { /* Demo/unconfigured accounts use initials. */ }
  const photo = privatePhoto ?? googleAvatarUrl(src);
  return <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-tint font-semibold text-accent-text ${large ? "h-24 w-24 text-3xl" : "h-10 w-10 text-sm"}`}>
    {photo && failedUrl !== photo ? (
      // External account portraits stay unoptimized: no server-side fetch or cache of a private user's image.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photo} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setFailedUrl(photo)} />
    ) : <span aria-hidden="true">{accountInitials(name, email)}</span>}
  </span>;
}
