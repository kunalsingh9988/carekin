"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { listNotifications, markAllRead } from "@/lib/storage/repositories/notifications";
import type { Notification } from "@/lib/storage/types";

// Stands in for SMS/push notifications (Guardrails, Section 8) — an
// in-app notification-center entry, not a real toast/push system.
export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listNotifications(userId).then(setNotifications);
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleOpen() {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) {
      await markAllRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative flex min-h-tap min-w-tap items-center justify-center" aria-label="Notifications">
        <Bell className="h-5 w-5 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 rounded-lg border border-border bg-surface p-2 shadow-lg">
          {notifications.length === 0 ? (
            <p className="p-3 text-sm text-text-secondary">No notifications yet.</p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="rounded-md p-2 text-sm text-text-primary hover:bg-bg-canvas">
                  {n.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
