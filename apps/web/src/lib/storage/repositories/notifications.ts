import { backendEnabled } from "@/lib/backend/config";
import { remote } from "@/lib/backend/browser";
import { get, newId, set } from "../client";
import type { Notification, NotificationType } from "../types";

const KEY = "notifications";

// Stands in for SMS/push in this prototype — an in-app entry only
// (Guardrails, Section 8).
 async function demo_addNotification(userId: string, type: NotificationType, message: string): Promise<Notification> {
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

 async function demo_listNotifications(userId: string): Promise<Notification[]> {
  const all = get<Notification[]>(KEY, []);
  return all.filter((n) => n.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

 async function demo_markAllRead(userId: string): Promise<void> {
  const all = get<Notification[]>(KEY, []);
  set(
    KEY,
    all.map((n) => (n.user_id === userId ? { ...n, read: true } : n)),
  );
}

// Backend adapters
export const addNotification: typeof demo_addNotification = (...args) => backendEnabled ? remote("notifications.addNotification", args) : demo_addNotification(...args);
export const listNotifications: typeof demo_listNotifications = (...args) => backendEnabled ? remote("notifications.listNotifications", args) : demo_listNotifications(...args);
export const markAllRead: typeof demo_markAllRead = (...args) => backendEnabled ? remote("notifications.markAllRead", args) : demo_markAllRead(...args);
