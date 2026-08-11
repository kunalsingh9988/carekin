"use client";

import { useEffect, useState } from "react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getMyProvider } from "@/lib/storage/repositories/providers";
import type { Provider } from "@/lib/storage/types";
import { Card } from "@/components/ui/Card";
import { VerificationChip } from "@/components/verification/VerificationChip";

export default function ProviderSettingsPage() {
  const user = useRequireRole("provider");
  const [provider, setProvider] = useState<Provider | null>(null);

  useEffect(() => {
    if (!user) return;
    getMyProvider(user.id).then(setProvider);
  }, [user]);

  if (!user) return null;

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>

      {provider ? (
        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-text-primary">{provider.name}</p>
            <VerificationChip status={provider.verification_status} />
          </div>
          <p className="text-sm text-text-secondary">{provider.type === "caregiver" ? "Elder caregiver" : "Babysitter"}</p>
          <p className="text-sm text-text-secondary">{provider.phone}</p>
          <p className="text-sm text-text-secondary">Service radius: {provider.service_radius_km} km</p>
          {provider.bio && <p className="mt-2 text-sm text-text-primary">{provider.bio}</p>}
        </Card>
      ) : (
        <p className="text-text-secondary">You haven&apos;t set up your provider profile yet.</p>
      )}
    </main>
  );
}
