"use client";

import { useState, useEffect } from "react";
import {
  verifyPin,
  unlock,
  recordFailedAttempt,
  resetAttempts,
  getLockedUntil,
  isLockedOut,
  resetAllData,
} from "@/lib/pin";
import PinInput from "./PinInput";

interface PinLockProps {
  onUnlock: () => void;
}

export default function PinLock({ onUnlock }: PinLockProps) {
  const [digits, setDigits]       = useState<string[]>(["", "", "", ""]);
  const [shake, setShake]         = useState(false);
  const [success, setSuccess]     = useState(false);
  const [checking, setChecking]   = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!isLockedOut()) return;
    const lockedUntil = getLockedUntil();
    const remaining   = Math.ceil((lockedUntil - Date.now()) / 1000);
    setCountdown(remaining);

    const interval = setInterval(() => {
      const rem = Math.ceil((getLockedUntil() - Date.now()) / 1000);
      if (rem <= 0) {
        setCountdown(0);
        clearInterval(interval);
      } else {
        setCountdown(rem);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [shake]);

  // Auto-check when 4 digits entered
  useEffect(() => {
    if (digits.every(Boolean) && !checking && !shake && !success) {
      checkPin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digits]);

  async function checkPin() {
    if (isLockedOut()) return;
    setChecking(true);
    const ok = await verifyPin(digits.join(""));
    if (ok) {
      setSuccess(true);
      resetAttempts();
      setTimeout(() => {
        unlock();
        onUnlock();
      }, 600);
    } else {
      const { lockedUntil } = recordFailedAttempt();
      setShake(true);
      setDigits(["", "", "", ""]);
      setTimeout(() => {
        setShake(false);
        if (lockedUntil > Date.now()) {
          const rem = Math.ceil((lockedUntil - Date.now()) / 1000);
          setCountdown(rem);
        }
      }, 600);
    }
    setChecking(false);
  }

  function handleReset() {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    resetAllData();
    window.location.reload();
  }

  const locked = isLockedOut() || countdown > 0;

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6"
      style={{ background: "var(--bg-page)" }}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-8px); }
          30%       { transform: translateX(8px); }
          45%       { transform: translateX(-6px); }
          60%       { transform: translateX(6px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        .pin-shake { animation: shake 0.55s ease; }

        @keyframes flash-green {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
          50%  { box-shadow: 0 0 24px 8px rgba(16,185,129,0.4); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        .pin-success { animation: flash-green 0.6s ease; }
      `}</style>

      <div className="w-full max-w-sm space-y-10">
        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="text-5xl mb-2">🪄</div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
            HotSpot
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            PIN'ini gir
          </p>
        </div>

        {/* Lockout message */}
        {locked && (
          <div
            className="rounded-2xl p-4 text-center space-y-1"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>
              Çok fazla yanlış deneme
            </p>
            <p className="text-2xl font-bold" style={{ color: "#ef4444" }}>
              {countdown}s
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              bekle
            </p>
          </div>
        )}

        {/* PIN boxes */}
        <div className={shake ? "pin-shake" : success ? "pin-success" : ""}>
          <PinInput
            value={digits}
            onChange={setDigits}
            shake={shake}
            success={success}
            disabled={locked || checking || success}
          />
        </div>

        {/* Reset link */}
        <div className="text-center">
          {!resetConfirm ? (
            <button
              onClick={handleReset}
              className="text-xs underline underline-offset-2"
              style={{ color: "rgba(139,146,165,0.6)" }}
            >
              PIN'ini mi unuttun? Tüm verileri sıfırla
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>
                Tüm veriler silinecek. Emin misin?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleReset}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#ef4444" }}
                >
                  Evet, Sıfırla
                </button>
                <button
                  onClick={() => setResetConfirm(false)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: "var(--bg-input)", color: "var(--text-secondary)" }}
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
