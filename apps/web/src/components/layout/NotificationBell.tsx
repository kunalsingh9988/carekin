"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { listNotifications, markAllRead } from "@/lib/storage/repositories/notifications";
import type { Notification } from "@/lib/storage/types";

// Stands in for SMS/push notifications (Guardrails, Section 8) — an
// in-app notification-center entry, not a real toast/push system.
export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  useEffect(() => {
    listNotifications(userId).then(setNotifications);
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      // Refetch on open so notifications added since mount actually show.
      const fresh = await listNotifications(userId);
      setNotifications(fresh);
      if (fresh.some((n) => !n.read)) {
        await markAllRead(userId);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button onClick={handleOpen} className="relative flex min-h-tap min-w-tap items-center justify-center" aria-label="Notifications" aria-expanded={open} aria-controls="notification-panel">
        <Bell className="h-5 w-5 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div id="notification-panel" className="fixed left-4 right-4 top-[calc(5rem+env(safe-area-inset-top))] z-40 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-surface p-2 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
          {notifications.length === 0 ? (
            <p className="p-3 text-sm text-text-secondary">No notifications yet.</p>
          ) : (
            <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="rounded-md p-2 text-sm text-text-primary hover:bg-surface-secondary">
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
