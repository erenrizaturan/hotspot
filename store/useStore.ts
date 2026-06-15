"use client";

import { create } from "zustand";
import { DEFAULT_SETTINGS } from "@/lib/db";
import { lsLoadTxns, lsLoadSettings, lsSaveTxns, lsSaveSettings } from "@/lib/storage";
import type { Txn, Settings } from "@/lib/types";

export type StorageBackend = "indexeddb" | "localstorage";

type Store = {
  txns:        Txn[];
  settings:    Settings;
  loaded:      boolean;
  backend:     StorageBackend;
  load:        () => Promise<void>;
  addTxn:      (txn: Txn)    => boolean;       // Senkron — state hemen güncellenir
  deleteTxn:   (id: string)  => void;
  updateTxn:   (txn: Txn)    => void;
  saveSettings:(s: Settings) => Promise<void>;
};

function fallbackToLS(set: (s: Partial<Store>) => void) {
  set({
    txns:     lsLoadTxns(),
    settings: lsLoadSettings(),
    loaded:   true,
    backend:  "localstorage",
  });
}

// DB yazımı için fire-and-forget yardımcısı — UI'ı asla bloke etmez
function persistTxns(txns: Txn[], backend: StorageBackend) {
  if (backend === "localstorage") {
    lsSaveTxns(txns);
    return;
  }
  // IndexedDB yazımı arka planda — hata olsa da state zaten güncellendi
  (async () => {
    try {
      const { getTransactions } = await import("@/lib/db");
      await Promise.race([
        getTransactions().bulkPut(txns),
        new Promise((_, r) => setTimeout(() => r(new Error("write timeout")), 3000)),
      ]);
    } catch (e) {
      console.warn("IndexedDB yazımı başarısız, localStorage'a yazılıyor:", e);
      lsSaveTxns(txns);
    }
  })();
}

export const useStore = create<Store>((set, get) => ({
  txns:     [],
  settings: DEFAULT_SETTINGS,
  loaded:   false,
  backend:  "indexeddb",

  load: async () => {
    if (typeof window === "undefined") { set({ loaded: true }); return; }
    if (get().loaded) return;

    const hardTimer = setTimeout(() => {
      if (!get().loaded) {
        console.warn("DB 2s içinde cevap vermedi — localStorage fallback");
        fallbackToLS(set);
      }
    }, 2000);

    try {
      const { initDB } = await import("@/lib/db");
      const ok = await initDB();
      if (!ok) { clearTimeout(hardTimer); fallbackToLS(set); return; }

      let txns: Txn[] = [];
      let settings: Settings = DEFAULT_SETTINGS;

      try {
        const { getTransactions } = await import("@/lib/db");
        txns = await getTransactions().orderBy("date").reverse().toArray();
      } catch (e) {
        console.warn("transactions okunamadı:", e);
        txns = lsLoadTxns();
      }

      try {
        const { getSettingsTable } = await import("@/lib/db");
        const rows = await getSettingsTable().toArray();
        if (rows[0]) settings = rows[0] as Settings;
      } catch (e) {
        console.warn("settings okunamadı:", e);
        settings = lsLoadSettings();
      }

      clearTimeout(hardTimer);
      if (!get().loaded) set({ txns, settings, loaded: true, backend: "indexeddb" });
    } catch (err) {
      clearTimeout(hardTimer);
      console.error("DB yüklenemedi:", err);
      if (!get().loaded) fallbackToLS(set);
    }
  },

  // ── CRUD — state güncellemesi ANLIKTIR, DB yazımı arka planda ────────────

  addTxn: (txn) => {
    const next = [txn, ...get().txns];
    set({ txns: next });
    persistTxns(next, get().backend);
    return true;
  },

  deleteTxn: (id) => {
    const next = get().txns.filter((t) => t.id !== id);
    set({ txns: next });
    persistTxns(next, get().backend);
  },

  updateTxn: (txn) => {
    const next = get().txns.map((t) => (t.id === txn.id ? txn : t));
    set({ txns: next });
    persistTxns(next, get().backend);
  },

  saveSettings: async (s) => {
    set({ settings: s });
    if (get().backend === "localstorage") { lsSaveSettings(s); return; }
    try {
      const { getSettingsTable } = await import("@/lib/db");
      await Promise.race([
        getSettingsTable().put({ id: 1, ...s }),
        new Promise((_, r) => setTimeout(() => r(new Error("write timeout")), 3000)),
      ]);
    } catch { lsSaveSettings(s); }
  },
}));
