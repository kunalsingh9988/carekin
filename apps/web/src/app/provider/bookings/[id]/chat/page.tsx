"use client";

import { use } from "react";
import { useRequireRole } from "@/lib/hooks/useRequireRole";
import { ChatThread } from "@/components/chat/ChatThread";

export default function ProviderChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useRequireRole("provider");
  if (!user) return null;

  return (
    <main className="mx-auto flex h-[calc(100vh-73px)] w-full max-w-md flex-1 flex-col gap-4 px-6 py-6">
      <h1 className="text-lg font-semibold text-text-primary">Chat</h1>
      <ChatThread bookingId={id} user={user} />
    </main>
  );
}
