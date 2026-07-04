"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useNotificationTriggers } from "@/lib/notifications";
import type { Notification, NotificationType } from "@/lib/types";

const TYPE_ICON: Record<NotificationType, string> = {
  tax: "🧾",
  salary: "💰",
  goal: "🎯",
  buffer: "⚠️",
  subscription: "📋",
};

function formatNotifDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell() {
  useNotificationTriggers();

  const { notifications, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unread = unreadCount();
  const sorted = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleNotifClick(n: Notification) {
    markAsRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Bildirimler"
        className="transition-colors duration-150"
        style={{
          position: "relative",
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 999,
          color: "var(--text-primary)",
          background: open ? "var(--bg-input)" : "transparent",
        }}
      >
        <Bell size={20} strokeWidth={1.8} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 1,
              right: 1,
              minWidth: 16,
              height: 16,
              padding: "0 3px",
              borderRadius: 999,
              background: "#ef4444",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--bg-header)",
              lineHeight: 1,
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 320,
            maxHeight: 400,
            overflowY: "auto",
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 100,
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Bildirimler</span>
            {unread > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-[11px] font-medium"
                style={{ color: "#a78bfa" }}
              >
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>

          {sorted.length === 0 ? (
            <div className="text-center" style={{ padding: "32px 16px" }}>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Henüz bildirim yok 🔔</p>
            </div>
          ) : (
            <div>
              {sorted.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className="flex items-start gap-3 cursor-pointer transition-colors duration-150"
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border-subtle)",
                    opacity: n.isRead ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg-input)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>{TYPE_ICON[n.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{n.message}</p>
                    <p className="text-[10px] mt-1" style={{ color: "var(--text-secondary)", opacity: 0.7 }}>
                      {formatNotifDate(n.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-start flex-shrink-0" style={{ gap: 6 }}>
                    {!n.isRead && (
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: "#7c3aed", marginTop: 4 }} />
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                      aria-label="Bildirimi sil"
                      style={{ color: "var(--text-secondary)", fontSize: 14 }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
