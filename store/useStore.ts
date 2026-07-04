"use client";

import { create } from "zustand";
import { DEFAULT_SETTINGS } from "@/lib/db";
import { lsLoadTxns, lsLoadSettings, lsSaveTxns, lsSaveSettings, lsLoadSubscriptions, lsSaveSubscriptions, lsLoadGoals, lsSaveGoals, lsLoadNotifications, lsSaveNotifications } from "@/lib/storage";
import { formatCurrency } from "@/lib/format";
import type { Txn, Settings, Subscription, Goal, Notification } from "@/lib/types";

export type StorageBackend = "indexeddb" | "localstorage";

type Store = {
  txns:               Txn[];
  settings:           Settings;
  subscriptions:      Subscription[];
  goals:              Goal[];
  notifications:      Notification[];
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
  addNotification:    (n: Omit<Notification, "id" | "createdAt" | "isRead">) => void;
  markAsRead:         (id: string)  => void;
  markAllAsRead:      () => void;
  deleteNotification: (id: string)  => void;
  unreadCount:        () => number;
};

function fallbackToLS(set: (s: Partial<Store>) => void) {
  set({
    txns:          lsLoadTxns(),
    settings:      lsLoadSettings(),
    subscriptions: lsLoadSubscriptions(),
    goals:         lsLoadGoals(),
    notifications: lsLoadNotifications(),
    loaded:        true,
    backend:       "localstorage",
  });
}

// ── Bildirim mükerrer önleme — localStorage'da son tetiklenme tarihi ────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function firedToday(key: string): boolean {
  try { return localStorage.getItem(key) === todayStr(); } catch { return false; }
}

function markFiredToday(key: string) {
  try { localStorage.setItem(key, todayStr()); } catch { /* quota */ }
}

function goalNotifKey(goalId: string): string {
  return `hotspot_notif_goal_${goalId}`;
}

function checkGoalNotification(goal: Goal, addNotification: Store["addNotification"]) {
  if (goal.targetAmount <= 0) return;
  const pct = (goal.currentAmount / goal.targetAmount) * 100;
  if (pct < 80) return;
  const key = goalNotifKey(goal.id);
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch { return; }
  addNotification({
    type: "goal",
    title: "Hedefe Az Kaldı! 🎯",
    message: `${goal.name} hedefine %${Math.round(pct)} ulaştın!`,
    link: "/",
  });
}

function persistNotifications(notifications: Notification[], backend: StorageBackend) {
  if (backend === "localstorage") {
    lsSaveNotifications(notifications);
    return;
  }
  (async () => {
    try {
      const { getNotificationsTable } = await import("@/lib/db");
      await Promise.race([
        getNotificationsTable().bulkPut(notifications),
        new Promise((_, r) => setTimeout(() => r(new Error("write timeout")), 3000)),
      ]);
    } catch (e) {
      console.warn("Notifications IndexedDB yazımı başarısız:", e);
      lsSaveNotifications(notifications);
    }
  })();
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
  notifications: [],
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

      let notifications: Notification[] = [];
      try {
        const { getNotificationsTable } = await import("@/lib/db");
        notifications = await getNotificationsTable().toArray();
      } catch (e) {
        console.warn("notifications okunamadı:", e);
        notifications = lsLoadNotifications();
      }

      clearTimeout(hardTimer);
      if (!get().loaded) set({ txns, settings, subscriptions: subs, goals, notifications, loaded: true, backend: "indexeddb" });
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

    if (txn.type === "income" && !firedToday("hotspot_notif_tax")) {
      const rate = txn.taxRateAtTime ?? get().settings.taxRate;
      const taxAmount = txn.amount * rate;
      get().addNotification({
        type: "tax",
        title: "Vergi Kenarını Ayır 🧾",
        message: `${formatCurrency(txn.amount)} gelir eklendi. ${formatCurrency(taxAmount)} vergi kenarına ayrılmalı.`,
        link: "/ayarlar",
      });
      markFiredToday("hotspot_notif_tax");
    }

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
    checkGoalNotification(goal, get().addNotification);
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
    checkGoalNotification(updated, get().addNotification);
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

  addNotification: (n) => {
    const newNotif: Notification = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isRead: false,
      ...n,
    };
    const next = [newNotif, ...get().notifications];
    set({ notifications: next });
    persistNotifications(next, get().backend);
  },

  markAsRead: (id) => {
    const next = get().notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    set({ notifications: next });
    persistNotifications(next, get().backend);
  },

  markAllAsRead: () => {
    const next = get().notifications.map((n) => ({ ...n, isRead: true }));
    set({ notifications: next });
    persistNotifications(next, get().backend);
  },

  deleteNotification: (id) => {
    const next = get().notifications.filter((n) => n.id !== id);
    set({ notifications: next });
    if (get().backend === "localstorage") {
      lsSaveNotifications(next);
    } else {
      (async () => {
        try {
          const { getNotificationsTable } = await import("@/lib/db");
          await getNotificationsTable().delete(id);
        } catch (e) {
          console.warn("Notification silinemedi:", e);
          lsSaveNotifications(next);
        }
      })();
    }
  },

  unreadCount: () => get().notifications.filter((n) => !n.isRead).length,
}));
