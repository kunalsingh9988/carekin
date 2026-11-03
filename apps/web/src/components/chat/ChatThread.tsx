"use client";

import { useEffect, useRef, useState } from "react";
import { listMessages, sendMessage } from "@/lib/storage/repositories/messages";
import { getBooking } from "@/lib/storage/repositories/bookings";
import type { CurrentUser, Message } from "@/lib/storage/types";

const UNLOCKED_STATUSES = ["confirmed", "in_progress", "completed"];

// Real-time is unnecessary here (Guardrails, Section 8) — messages just
// append to a localStorage array and re-render; no websocket. Shared
// between /family/bookings/[id]/chat and /provider/bookings/[id]/chat so
// the unlock rule (booking must be confirmed/completed) lives in one place.
export function ChatThread({ bookingId, user }: { bookingId: string; user: CurrentUser }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [locked, setLocked] = useState<boolean | null>(null);
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getBooking(bookingId).then((b) => setLocked(b ? !UNLOCKED_STATUSES.includes(b.status) : true));
    listMessages(bookingId).then(setMessages);
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  if (locked === null) return null;

  if (locked) {
    return <p className="py-12 text-center text-sm text-text-secondary">Chat unlocks once this booking is confirmed.</p>;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const msg = await sendMessage(bookingId, user.id, user.role, content.trim());
    setMessages((prev) => [...prev, msg]);
    setContent("");
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain rounded-lg bg-surface-secondary p-4">
        {messages.length === 0 && <p className="text-center text-sm text-text-secondary">Say hello — messages appear here.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[85%] break-words rounded-lg px-3 py-2 text-sm [overflow-wrap:anywhere] sm:max-w-[75%] ${m.sender_id === user.id ? "self-end bg-accent text-white" : "self-start bg-surface text-text-primary"}`}>
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex shrink-0 gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message…"
          aria-label="Message"
          enterKeyHint="send"
          className="min-h-tap min-w-0 flex-1 rounded-md border border-border bg-surface px-4 text-base text-text-primary placeholder:text-text-secondary focus:border-accent"
        />
        <button type="submit" className="min-h-tap rounded-md bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-text">
          Send
        </button>
      </form>
    </div>
  );
}
