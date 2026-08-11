import { get, newId, set } from "../client";
import type { Notification, NotificationType } from "../types";

const KEY = "notifications";

// Stands in for SMS/push in this prototype — an in-app entry only
// (Guardrails, Section 8).
export async function addNotification(userId: string, type: NotificationType, message: string): Promise<Notification> {
  const all = get<Notification[]>(KEY, []);
  const created: Notification = {
    id: newId(),
    user_id: userId,
    type,
    message,
    read: false,
    created_at: new Date().toISOString(),
  };
  set(KEY, [created, ...all]);
  return created;
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  const all = get<Notification[]>(KEY, []);
  return all.filter((n) => n.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function markAllRead(userId: string): Promise<void> {
  const all = get<Notification[]>(KEY, []);
  set(
    KEY,
    all.map((n) => (n.user_id === userId ? { ...n, read: true } : n)),
  );
}
