"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getBooking } from "@/lib/storage/repositories/bookings";
import { getMyProvider } from "@/lib/storage/repositories/providers";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatCareHeader } from "@/components/care/ChatCareHeader";

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
    }).catch(() => setAllowed(false));
  }, [id, user]);

  if (!user) return null;
  if (allowed === false) notFound();
  if (allowed === undefined) return null;

  return (
    <main className="chat-page mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
      <ChatCareHeader id={id} user={user} />
      <ChatThread bookingId={id} user={user} />
    </main>
  );
}
