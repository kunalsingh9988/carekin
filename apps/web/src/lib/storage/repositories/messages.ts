import { backendEnabled } from "@/lib/backend/config";
import { remote } from "@/lib/backend/browser";
import { get, newId, set } from "../client";
import type { Message, UserRole } from "../types";
import { isContactRestricted } from "./care";

const KEY = "messages";

 async function demo_listMessages(bookingId: string): Promise<Message[]> {
  if (isContactRestricted(bookingId)) throw new Error("Messaging is restricted for this visit. Use Active Care for safety options.");
  const all = get<Message[]>(KEY, []);
  return all.filter((m) => m.booking_id === bookingId).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

 async function demo_sendMessage(
  bookingId: string,
  senderId: string,
  senderRole: UserRole,
  content: string,
): Promise<Message> {
  if (isContactRestricted(bookingId)) throw new Error("Messaging is restricted for this visit. Use Active Care for safety options.");
  const all = get<Message[]>(KEY, []);
  const created: Message = {
    id: newId(),
    booking_id: bookingId,
    sender_id: senderId,
    sender_role: senderRole,
    content,
    created_at: new Date().toISOString(),
  };
  set(KEY, [...all, created]);
  return created;
}

// Backend adapters
export const listMessages: typeof demo_listMessages = (...args) => backendEnabled ? remote("messages.listMessages", args) : demo_listMessages(...args);
export const sendMessage: typeof demo_sendMessage = (...args) => backendEnabled ? remote("messages.sendMessage", args) : demo_sendMessage(...args);
