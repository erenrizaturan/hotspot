"use client";

import type { Txn, Settings, Subscription, Goal, Notification } from "./types";
import { DEFAULT_SETTINGS } from "./db";

const LS_TXNS      = "hs_txns";
const LS_SETTINGS  = "hs_settings";
const LS_SUBS      = "hs_subscriptions";
const LS_DISMISSED = "hs_dismissed_detect";
const LS_GOALS     = "hs_goals";
const LS_NOTIFS    = "hs_notifications";

// ── localStorage helpers ────────────────────────────────────────────────────

export function lsLoadTxns(): Txn[] {
  try {
    const raw = localStorage.getItem(LS_TXNS);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Txn[];
    return arr.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export function lsLoadSettings(): Settings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    return raw ? (JSON.parse(raw) as Settings) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function lsSaveTxns(txns: Txn[]) {
  try { localStorage.setItem(LS_TXNS, JSON.stringify(txns)); } catch { /* quota */ }
}

export function lsSaveSettings(s: Settings) {
  try { localStorage.setItem(LS_SETTINGS, JSON.stringify(s)); } catch { /* quota */ }
}

export function lsLoadSubscriptions(): Subscription[] {
  try {
    const raw = localStorage.getItem(LS_SUBS);
    if (!raw) return [];
    return JSON.parse(raw) as Subscription[];
  } catch {
    return [];
  }
}

export function lsSaveSubscriptions(subs: Subscription[]) {
  try { localStorage.setItem(LS_SUBS, JSON.stringify(subs)); } catch { /* quota */ }
}

export function lsLoadDismissedSources(): string[] {
  try {
    const raw = localStorage.getItem(LS_DISMISSED);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function lsSaveDismissedSources(sources: string[]) {
  try { localStorage.setItem(LS_DISMISSED, JSON.stringify(sources)); } catch { /* quota */ }
}

export function lsLoadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(LS_GOALS);
    if (!raw) return [];
    return JSON.parse(raw) as Goal[];
  } catch { return []; }
}

export function lsSaveGoals(goals: Goal[]) {
  try { localStorage.setItem(LS_GOALS, JSON.stringify(goals)); } catch { /* quota */ }
}

export function lsLoadNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(LS_NOTIFS);
    if (!raw) return [];
    return JSON.parse(raw) as Notification[];
  } catch { return []; }
}

export function lsSaveNotifications(notifications: Notification[]) {
  try { localStorage.setItem(LS_NOTIFS, JSON.stringify(notifications)); } catch { /* quota */ }
}

// ── IndexedDB availability check ────────────────────────────────────────────

// Safari private mode: indexedDB exists fakat quota 0, open() hemen hata atar.
// Bunu yakalamak için kısa bir test açma denemesi yapıyoruz.
export async function isIndexedDBAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("indexedDB" in window) || !window.indexedDB) return false;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), 500);
    try {
      const req = window.indexedDB.open("__hs_test__", 1);
      req.onsuccess = () => {
        clearTimeout(timer);
        req.result.close();
        window.indexedDB.deleteDatabase("__hs_test__");
        resolve(true);
      };
      req.onerror = () => { clearTimeout(timer); resolve(false); };
      req.onblocked = () => { clearTimeout(timer); resolve(false); };
    } catch {
      clearTimeout(timer);
      resolve(false);
    }
  });
}
