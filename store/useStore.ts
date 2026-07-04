"use client";

import { create } from "zustand";
import { DEFAULT_SETTINGS } from "@/lib/db";
import { lsLoadTxns, lsLoadSettings, lsSaveTxns, lsSaveSettings, lsLoadSubscriptions, lsSaveSubscriptions, lsLoadGoals, lsSaveGoals } from "@/lib/storage";
import type { Txn, Settings, Subscription, Goal } from "@/lib/types";

export type StorageBackend = "indexeddb" | "localstorage";

type Store = {
  txns:               Txn[];
  settings:           Settings;
  subscriptions:      Subscription[];
  goals:              Goal[];
  loaded:             boolean;
  backend:            StorageBackend;
  load:               () => Promise<void>;
  addTxn:             (txn: Txn)    => boolean;
  deleteTxn:          (id: string)  => Promise<void>;
  updateTxn:          (txn: Txn)    => void;
  saveSettings:       (s: Settings) => Promise<void>;
  addSubscription:    (sub: Omit<Subscription, "id" | "createdAt">) => void;
  deleteSubscription: (id: string)  => void;
  addGoal:            (goal: Omit<Goal, "id" | "createdAt" | "currentAmount">) => void;
  updateGoal:         (goal: Goal)  => void;
  deleteGoal:         (id: string)  => void;
  addToGoal:          (id: string, amount: number) => void;
};

function fallbackToLS(set: (s: Partial<Store>) => void) {
  set({
    txns:          lsLoadTxns(),
    settings:      lsLoadSettings(),
    subscriptions: lsLoadSubscriptions(),
    goals:         lsLoadGoals(),
    loaded:        true,
    backend:       "localstorage",
  });
}

function persistGoals(goals: Goal[], backend: StorageBackend) {
  if (backend === "localstorage") {
    lsSaveGoals(goals);
    return;
  }
  (async () => {
    try {
      const { getGoalsTable } = await import("@/lib/db");
      await Promise.race([
        getGoalsTable().bulkPut(goals),
        new Promise((_, r) => setTimeout(() => r(new Error("write timeout")), 3000)),
      ]);
    } catch (e) {
      console.warn("Goals IndexedDB yazımı başarısız:", e);
      lsSaveGoals(goals);
    }
  })();
}

function persistSubscriptions(subs: Subscription[], backend: StorageBackend) {
  if (backend === "localstorage") {
    lsSaveSubscriptions(subs);
    return;
  }
  (async () => {
    try {
      const { getSubscriptionsTable } = await import("@/lib/db");
      await Promise.race([
        getSubscriptionsTable().bulkPut(subs),
        new Promise((_, r) => setTimeout(() => r(new Error("write timeout")), 3000)),
      ]);
    } catch (e) {
      console.warn("Subscriptions IndexedDB yazımı başarısız:", e);
      lsSaveSubscriptions(subs);
    }
  })();
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
  txns:          [],
  settings:      DEFAULT_SETTINGS,
  subscriptions: [],
  goals:         [],
  loaded:        false,
  backend:       "indexeddb",

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

      let subs: Subscription[] = [];
      try {
        const { getSubscriptionsTable } = await import("@/lib/db");
        subs = await getSubscriptionsTable().toArray();
      } catch (e) {
        console.warn("subscriptions okunamadı:", e);
        subs = lsLoadSubscriptions();
      }

      let goals: Goal[] = [];
      try {
        const { getGoalsTable } = await import("@/lib/db");
        goals = await getGoalsTable().toArray();
      } catch (e) {
        console.warn("goals okunamadı:", e);
        goals = lsLoadGoals();
      }

      clearTimeout(hardTimer);
      if (!get().loaded) set({ txns, settings, subscriptions: subs, goals, loaded: true, backend: "indexeddb" });
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

  deleteTxn: async (id) => {
    const next = get().txns.filter((t) => t.id !== id);
    set({ txns: next });
    if (get().backend === "localstorage") {
      lsSaveTxns(next);
      return;
    }
    try {
      const { getTransactions } = await import("@/lib/db");
      await getTransactions().delete(id);
    } catch (e) {
      console.warn("deleteTxn IndexedDB hatası, localStorage'a yazılıyor:", e);
      lsSaveTxns(next);
    }
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

  addSubscription: (sub) => {
    const newSub: Subscription = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...sub,
    };
    const next = [...get().subscriptions, newSub];
    set({ subscriptions: next });
    persistSubscriptions(next, get().backend);
  },

  deleteSubscription: (id) => {
    const next = get().subscriptions.filter((s) => s.id !== id);
    set({ subscriptions: next });
    if (get().backend === "localstorage") {
      lsSaveSubscriptions(next);
    } else {
      (async () => {
        try {
          const { getSubscriptionsTable } = await import("@/lib/db");
          await getSubscriptionsTable().delete(id);
        } catch (e) {
          console.warn("Subscription silinemedi:", e);
          lsSaveSubscriptions(next);
        }
      })();
    }
  },

  addGoal: (goal) => {
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      currentAmount: 0,
      ...goal,
    };
    const next = [...get().goals, newGoal];
    set({ goals: next });
    persistGoals(next, get().backend);
  },

  updateGoal: (goal) => {
    const next = get().goals.map((g) => (g.id === goal.id ? goal : g));
    set({ goals: next });
    persistGoals(next, get().backend);
  },

  deleteGoal: (id) => {
    const next = get().goals.filter((g) => g.id !== id);
    set({ goals: next });
    persistGoals(next, get().backend);
    (async () => {
      if (get().backend !== "localstorage") {
        try {
          const { getGoalsTable } = await import("@/lib/db");
          await getGoalsTable().delete(id);
        } catch { lsSaveGoals(next); }
      }
    })();
  },

  addToGoal: (id, amount) => {
    const goals = get().goals;
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    const updated: Goal = { ...goal, currentAmount: goal.currentAmount + amount };
    const next = goals.map((g) => (g.id === id ? updated : g));
    set({ goals: next });
    persistGoals(next, get().backend);
    // Expense olarak işlem geçmişine ekle
    const txn = {
      id: crypto.randomUUID(),
      type: "expense" as const,
      amount,
      date: new Date().toISOString().split("T")[0],
      source: goal.name,
      note: `${goal.emoji} Hedef transferi`,
    };
    const txns = [txn, ...get().txns];
    set({ txns });
    persistTxns(txns, get().backend);
  },
}));
