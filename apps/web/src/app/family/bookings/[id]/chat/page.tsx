"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { getBooking } from "@/lib/storage/repositories/bookings";
import { getFamilyProfile } from "@/lib/storage/repositories/families";
import { ChatThread } from "@/components/chat/ChatThread";
import { ChatCareHeader } from "@/components/care/ChatCareHeader";

export default function FamilyChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useRequireRole("family");
  const [allowed, setAllowed] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    getBooking(id).then(async (b) => {
      if (!b) {
        setAllowed(false);
        return;
      }
      // Only the family that owns this booking can read or write its chat.
      const family = await getFamilyProfile(user.id);
      setAllowed(!!family && b.family_id === family.id);
    });
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
