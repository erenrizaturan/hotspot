"use client";

const PIN_HASH_KEY     = "hotspot_pin_hash";
const PIN_ATTEMPTS_KEY = "hotspot_pin_attempts";
const PIN_LOCKED_KEY   = "hotspot_pin_locked_until";
const SESSION_KEY      = "hotspot_unlocked";
const HIDDEN_AT_KEY    = "hotspot_hidden_at";
const LOCK_AFTER_MS    = 5 * 60 * 1000; // 5 dakika arka planda
const MAX_ATTEMPTS     = 3;
const LOCKOUT_MS       = 30 * 1000;

export async function hashPin(pin: string): Promise<string> {
  const msgBuffer  = new TextEncoder().encode(pin + "hotspot_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function isPinSet(): boolean {
  return localStorage.getItem(PIN_HASH_KEY) !== null;
}

export async function setPin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  localStorage.setItem(PIN_HASH_KEY, hash);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_HASH_KEY);
  if (!stored) return false;
  const hash = await hashPin(pin);
  return hash === stored;
}

export function removePin(): void {
  localStorage.removeItem(PIN_HASH_KEY);
  resetAttempts();
}

export function isUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

export function unlock(): void {
  sessionStorage.setItem(SESSION_KEY, "true");
}

export function lock(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getAttempts(): number {
  return parseInt(localStorage.getItem(PIN_ATTEMPTS_KEY) || "0", 10);
}

export function getLockedUntil(): number {
  return parseInt(localStorage.getItem(PIN_LOCKED_KEY) || "0", 10);
}

export function isLockedOut(): boolean {
  return Date.now() < getLockedUntil();
}

export function recordFailedAttempt(): { attempts: number; lockedUntil: number } {
  const attempts = getAttempts() + 1;
  localStorage.setItem(PIN_ATTEMPTS_KEY, String(attempts));
  let lockedUntil = 0;
  if (attempts >= MAX_ATTEMPTS) {
    lockedUntil = Date.now() + LOCKOUT_MS;
    localStorage.setItem(PIN_LOCKED_KEY, String(lockedUntil));
    localStorage.setItem(PIN_ATTEMPTS_KEY, "0");
  }
  return { attempts, lockedUntil };
}

export function resetAttempts(): void {
  localStorage.removeItem(PIN_ATTEMPTS_KEY);
  localStorage.removeItem(PIN_LOCKED_KEY);
}

export function recordHidden(): void {
  sessionStorage.setItem(HIDDEN_AT_KEY, String(Date.now()));
}

export function shouldRelockAfterBackground(): boolean {
  const hiddenAt = parseInt(sessionStorage.getItem(HIDDEN_AT_KEY) || "0", 10);
  if (!hiddenAt) return false;
  return Date.now() - hiddenAt > LOCK_AFTER_MS;
}

export function clearHiddenAt(): void {
  sessionStorage.removeItem(HIDDEN_AT_KEY);
}

const PIN_SKIPPED_KEY = "hotspot_pin_skipped";

export function skipPinSetup(): void {
  localStorage.setItem(PIN_SKIPPED_KEY, "true");
}

export function hasPinSetupBeenSkipped(): boolean {
  return localStorage.getItem(PIN_SKIPPED_KEY) === "true";
}

export function clearSkip(): void {
  localStorage.removeItem(PIN_SKIPPED_KEY);
}

export function resetAllData(): void {
  localStorage.clear();
  sessionStorage.clear();
}
