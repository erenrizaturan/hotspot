"use client";

import { useState } from "react";
import {
  isPinSet,
  verifyPin,
  setPin,
  removePin,
  resetAttempts,
  unlock,
  clearSkip,
  skipPinSetup,
} from "@/lib/pin";
import PinInput from "./PinInput";

type View = "idle" | "change-verify" | "change-new" | "change-confirm" | "remove-verify";

export default function PinSettings() {
  const [pinActive, setPinActive]   = useState(isPinSet);
  const [view, setView]             = useState<View>("idle");
  const [digits, setDigits]         = useState<string[]>(["", "", "", ""]);
  const [newDigits, setNewDigits]   = useState<string[]>(["", "", "", ""]);
  const [confirmDigits, setConfirm] = useState<string[]>(["", "", "", ""]);
  const [shake, setShake]           = useState(false);
  const [error, setError]           = useState("");
  const [done, setDone]             = useState(false);

  function reset() {
    setDigits(["", "", "", ""]);
    setNewDigits(["", "", "", ""]);
    setConfirm(["", "", "", ""]);
    setError("");
    setShake(false);
  }

  function doShake(msg: string) {
    setError(msg);
    setShake(true);
    setDigits(["", "", "", ""]);
    setTimeout(() => setShake(false), 600);
  }

  async function verifyCurrentPin(pin: string): Promise<boolean> {
    const ok = await verifyPin(pin);
    if (!ok) { doShake("Yanlış PIN. Tekrar dene."); return false; }
    return true;
  }

  // ── Change flow ────────────────────────────────────────────────────────────

  async function handleChangeVerify() {
    if (!digits.every(Boolean)) return;
    if (!await verifyCurrentPin(digits.join(""))) return;
    reset();
    setView("change-new");
  }

  function handleChangeNew() {
    if (!newDigits.every(Boolean)) return;
    setView("change-confirm");
  }

  async function handleChangeConfirm() {
    if (!confirmDigits.every(Boolean)) return;
    if (newDigits.join("") !== confirmDigits.join("")) {
      setError("PIN'ler eşleşmiyor.");
      setShake(true);
      setConfirm(["", "", "", ""]);
      setTimeout(() => setShake(false), 600);
      return;
    }
    await setPin(newDigits.join(""));
    clearSkip();
    resetAttempts();
    unlock();
    setPinActive(true);
    reset();
    setView("idle");
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  // ── Remove flow ────────────────────────────────────────────────────────────

  async function handleRemoveVerify() {
    if (!digits.every(Boolean)) return;
    if (!await verifyCurrentPin(digits.join(""))) return;
    removePin();
    skipPinSetup(); // don't show setup screen again
    setPinActive(false);
    reset();
    setView("idle");
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  // ── Setup new PIN (when none set) ─────────────────────────────────────────

  async function handleSetNew() {
    if (!newDigits.every(Boolean)) return;
    setView("change-confirm");
  }

  async function handleSetNewConfirm() {
    if (!confirmDigits.every(Boolean)) return;
    if (newDigits.join("") !== confirmDigits.join("")) {
      setError("PIN'ler eşleşmiyor.");
      setShake(true);
      setConfirm(["", "", "", ""]);
      setTimeout(() => setShake(false), 600);
      return;
    }
    await setPin(newDigits.join(""));
    clearSkip();
    resetAttempts();
    unlock();
    setPinActive(true);
    reset();
    setView("idle");
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>PIN Kilidi</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Uygulamayı açmak için PIN gereksin
          </p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={
            pinActive
              ? { background: "rgba(16,185,129,0.15)", color: "#10b981" }
              : { background: "rgba(139,146,165,0.1)", color: "var(--text-secondary)" }
          }
        >
          {pinActive ? "Aktif" : "Kurulu değil"}
        </span>
      </div>

      {done && (
        <div
          className="text-sm text-center py-2 rounded-xl"
          style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
        >
          ✓ Kaydedildi
        </div>
      )}

      {/* Idle state — action buttons */}
      {view === "idle" && (
        <div className="flex gap-2">
          {pinActive ? (
            <>
              <button
                onClick={() => { reset(); setView("change-verify"); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.97]"
                style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", color: "#a78bfa" }}
              >
                PIN Değiştir
              </button>
              <button
                onClick={() => { reset(); setView("remove-verify"); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
              >
                PIN&apos;i Kaldır
              </button>
            </>
          ) : (
            <button
              onClick={() => { reset(); setView("change-new"); }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.97]"
              style={{ background: "#7c3aed" }}
            >
              PIN Kur
            </button>
          )}
        </div>
      )}

      {/* Verify current PIN */}
      {(view === "change-verify" || view === "remove-verify") && (
        <div className="space-y-4">
          <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>
            {view === "change-verify" ? "Mevcut PIN'ini gir" : "Kaldırmak için PIN'ini gir"}
          </p>
          <div className={shake ? "animate-[shake_0.55s_ease]" : ""}>
            <PinInput value={digits} onChange={setDigits} shake={shake} />
          </div>
          {error && <p className="text-xs text-center" style={{ color: "#ef4444" }}>{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { reset(); setView("idle"); }}
              className="flex-1 py-3 rounded-xl text-sm"
              style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
            >
              İptal
            </button>
            <button
              onClick={view === "change-verify" ? handleChangeVerify : handleRemoveVerify}
              disabled={!digits.every(Boolean)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-30"
              style={{ background: view === "remove-verify" ? "#ef4444" : "#7c3aed" }}
            >
              Onayla
            </button>
          </div>
        </div>
      )}

      {/* New PIN */}
      {view === "change-new" && (
        <div className="space-y-4">
          <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>
            {pinActive ? "Yeni PIN'ini belirle" : "4 haneli PIN belirle"}
          </p>
          <PinInput value={newDigits} onChange={setNewDigits} />
          <div className="flex gap-2">
            <button
              onClick={() => { reset(); setView("idle"); }}
              className="flex-1 py-3 rounded-xl text-sm"
              style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
            >
              İptal
            </button>
            <button
              onClick={pinActive ? handleChangeNew : handleSetNew}
              disabled={!newDigits.every(Boolean)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-30"
              style={{ background: "#7c3aed" }}
            >
              Devam Et
            </button>
          </div>
        </div>
      )}

      {/* Confirm new PIN */}
      {view === "change-confirm" && (
        <div className="space-y-4">
          <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>
            PIN&apos;ini tekrar gir
          </p>
          <div className={shake ? "animate-[shake_0.55s_ease]" : ""}>
            <PinInput value={confirmDigits} onChange={setConfirm} shake={shake} />
          </div>
          {error && <p className="text-xs text-center" style={{ color: "#ef4444" }}>{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { reset(); setView("change-new"); }}
              className="flex-1 py-3 rounded-xl text-sm"
              style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
            >
              Geri
            </button>
            <button
              onClick={pinActive ? handleChangeConfirm : handleSetNewConfirm}
              disabled={!confirmDigits.every(Boolean)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-30"
              style={{ background: "#7c3aed" }}
            >
              Kaydet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
