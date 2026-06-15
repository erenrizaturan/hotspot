"use client";

import type { Txn, Settings } from "./types";
import { DEFAULT_SETTINGS } from "./db";

const LS_TXNS     = "hs_txns";
const LS_SETTINGS = "hs_settings";

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
