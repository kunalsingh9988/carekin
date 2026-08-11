import { get, newId, set } from "../client";
import type { Message, UserRole } from "../types";

const KEY = "messages";

export async function listMessages(bookingId: string): Promise<Message[]> {
  const all = get<Message[]>(KEY, []);
  return all.filter((m) => m.booking_id === bookingId).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function sendMessage(
  bookingId: string,
  senderId: string,
  senderRole: UserRole,
  content: string,
): Promise<Message> {
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
