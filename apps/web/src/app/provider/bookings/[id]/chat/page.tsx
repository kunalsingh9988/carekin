"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getBooking } from "@/lib/storage/repositories/bookings";
import { getMyProvider } from "@/lib/storage/repositories/providers";
import { ChatThread } from "@/components/chat/ChatThread";

export default function ProviderChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useRequireRole("provider");
  const [allowed, setAllowed] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    getBooking(id).then(async (b) => {
      if (!b) {
        setAllowed(false);
        return;
      }
      // Only the provider this booking is with can read or write its chat.
      const provider = await getMyProvider(user.id);
      setAllowed(!!provider && b.provider_id === provider.id);
    });
  }, [id, user]);

  if (!user) return null;
  if (allowed === false) notFound();
  if (allowed === undefined) return null;

  return (
    <main className="mx-auto flex h-[calc(100vh-73px)] w-full max-w-md flex-1 flex-col gap-4 px-6 py-6">
      <h1 className="text-lg font-semibold text-text-primary">Chat</h1>
      <ChatThread bookingId={id} user={user} />
    </main>
  );
}
