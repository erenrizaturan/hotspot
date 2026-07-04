"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { deriveState, monthlySubscriptionTotal } from "./calculations";
import { formatCurrency } from "./format";

const KEY_SALARY       = "hotspot_notif_salary";
const KEY_SUBSCRIPTION = "hotspot_notif_subscription";
const KEY_BUFFER       = "hotspot_notif_buffer";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function firedToday(key: string): boolean {
  try { return localStorage.getItem(key) === todayStr(); } catch { return false; }
}

function markFiredToday(key: string) {
  try { localStorage.setItem(key, todayStr()); } catch { /* quota */ }
}

// Ayın 1'i ve tampon tehlikesi kontrolleri — bildirim ikonu her mount olduğunda çalışır,
// mükerrer önleme localStorage üzerinden günlük olarak yapılır.
export function useNotificationTriggers() {
  const { loaded, txns, settings, subscriptions, addNotification } = useStore();

  useEffect(() => {
    if (!loaded) return;

    const state = deriveState(txns, settings);
    const isFirstOfMonth = new Date().getDate() === 1;

    if (isFirstOfMonth && !firedToday(KEY_SALARY)) {
      addNotification({
        type: "salary",
        title: "Maaşını Almayı Unutma 💰",
        message: `Yeni ay başladı. Kazandan ${formatCurrency(state.safeToSpend)} çekebilirsin.`,
        link: "/islem",
      });
      markFiredToday(KEY_SALARY);
    }

    if (isFirstOfMonth && subscriptions.length > 0 && !firedToday(KEY_SUBSCRIPTION)) {
      const total = monthlySubscriptionTotal(subscriptions);
      addNotification({
        type: "subscription",
        title: "Aylık Abonelikler 📋",
        message: `Bu ay ${formatCurrency(total)} abonelik ödemesi var.`,
        link: "/",
      });
      markFiredToday(KEY_SUBSCRIPTION);
    }

    if (state.buffer < state.safetyBuffer && !firedToday(KEY_BUFFER)) {
      addNotification({
        type: "buffer",
        title: "Kazan Tehlikede! ⚠️",
        message: "Bakiyen tampon hedefinin altına düştü. Dikkat!",
        link: "/",
      });
      markFiredToday(KEY_BUFFER);
    }
  }, [loaded, txns, settings, subscriptions, addNotification]);
}
