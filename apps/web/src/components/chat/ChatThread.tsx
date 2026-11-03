"use client";

import { useEffect, useRef, useState } from "react";
import { listMessages, sendMessage } from "@/lib/storage/repositories/messages";
import { getBooking } from "@/lib/storage/repositories/bookings";
import { isContactRestricted } from "@/lib/storage/repositories/care";
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
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const booking = await getBooking(bookingId);
        const restricted = isContactRestricted(bookingId);
        if (!active) return;
        setLocked(!booking || !UNLOCKED_STATUSES.includes(booking.status) || restricted);
        if (restricted) { setMessages([]); setError("Messaging is restricted for this visit. Use Safety & support above. No report details are disclosed here."); return; }
        const items = await listMessages(bookingId);
        if (active) { setMessages((previous) => previous.length === items.length && previous.every((m, i) => m.id === items[i].id) ? previous : items); setError(""); }
      } catch(e) { if (active) { setError(e instanceof Error ? e.message : "Unable to load messages."); setLocked(true); } }
    }
    void refresh();
    const interval = setInterval(refresh, 3000);
    return () => { active = false; clearInterval(interval); };
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  if (locked === null) return null;

  if (locked) {
    return <p role="status" className="py-6 text-center text-sm text-text-secondary">{error || "Chat unlocks once this booking is confirmed."}</p>;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    try { const msg = await sendMessage(bookingId, user.id, user.role, content.trim()); setMessages((prev) => [...prev, msg]); setContent(""); setError(""); }
    catch(e) { setError(e instanceof Error ? e.message : "Unable to send message."); if (isContactRestricted(bookingId)) setLocked(true); }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
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
          className="min-h-tap min-w-0 flex-1 rounded-md border border-border bg-surface px-4 text-base text-text-primary placeholder:text-text-secondary"
        />
        <button type="submit" className="min-h-tap rounded-md bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accent-hover">
          Send
        </button>
      </form>
    </div>
  );
}
