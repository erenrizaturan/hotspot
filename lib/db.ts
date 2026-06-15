import Dexie from "dexie";
import type { Txn, Settings } from "./types";

export type SettingsRow = Settings & { id: number };

// Flat instance — sınıf tabanlı değil, daha fazla Safari uyumlu
let _db: Dexie | null = null;
let _dbReady = false;

function createDb(): Dexie {
  const db = new Dexie("hotspot");
  db.version(1).stores({
    transactions: "id, type, date",
    settings: "id",
  });
  return db;
}

// Explicit open() — hata toleranslı
export async function initDB(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (_dbReady && _db) return true;
  try {
    if (!_db) _db = createDb();
    await _db.open();
    _dbReady = true;
    return true;
  } catch (e) {
    console.error("DB açılamadı:", e);
    _db = null;
    _dbReady = false;
    return false;
  }
}

export function getTransactions(): Dexie.Table<Txn, string> {
  return (_db as Dexie & { transactions: Dexie.Table<Txn, string> }).transactions;
}

export function getSettingsTable(): Dexie.Table<SettingsRow, number> {
  return (_db as Dexie & { settings: Dexie.Table<SettingsRow, number> }).settings;
}

export const DEFAULT_SETTINGS: Settings = {
  fixedMonthlyExpenses: 0,
  taxRate: 0.2,
  targetSalary: 0,
  bufferTargetMonths: 3,
  startingBufferBalance: 0,
};
