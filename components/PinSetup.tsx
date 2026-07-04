"use client";

import { useState } from "react";
import { setPin } from "@/lib/pin";
import PinInput from "./PinInput";

interface PinSetupProps {
  onPinSet: () => void;
  onSkip: () => void;
}

type Step = "create" | "confirm";

export default function PinSetup({ onPinSet, onSkip }: PinSetupProps) {
  const [step, setStep]         = useState<Step>("create");
  const [pin, setPin_]          = useState<string[]>(["", "", "", ""]);
  const [confirmPin, setConfirm] = useState<string[]>(["", "", "", ""]);
  const [error, setError]       = useState("");
  const [shake, setShake]       = useState(false);
  const [saving, setSaving]     = useState(false);

  const pinFull     = pin.every(Boolean);
  const confirmFull = confirmPin.every(Boolean);

  async function handleCreate() {
    if (!pinFull) return;
    setStep("confirm");
    setError("");
  }

  async function handleConfirm() {
    if (!confirmFull) return;
    const p1 = pin.join("");
    const p2 = confirmPin.join("");
    if (p1 !== p2) {
      setError("PIN'ler eşleşmiyor. Tekrar dene.");
      setShake(true);
      setConfirm(["", "", "", ""]);
      setTimeout(() => setShake(false), 600);
      return;
    }
    setSaving(true);
    await setPin(p1);
    onPinSet();
  }

  function handleBack() {
    setStep("create");
    setPin_(["", "", "", ""]);
    setConfirm(["", "", "", ""]);
    setError("");
  }

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-6"
      style={{ background: "var(--bg-page)" }}
    >
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-1">
          <div className="text-5xl mb-2">🔐</div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
            Kazanını Kilitle
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {step === "create" ? "4 haneli bir PIN belirle" : "PIN'ini tekrar gir"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 justify-center">
          <div
            className="h-1 w-8 rounded-full transition-all"
            style={{ background: "#7c3aed" }}
          />
          <div
            className="h-1 w-8 rounded-full transition-all"
            style={{ background: step === "confirm" ? "#7c3aed" : "#2d1f4e" }}
          />
        </div>

        {/* PIN Input */}
        <div className="space-y-6">
          {step === "create" ? (
            <PinInput value={pin} onChange={setPin_} />
          ) : (
            <PinInput
              value={confirmPin}
              onChange={setConfirm}
              shake={shake}
            />
          )}

          {error && (
            <p className="text-center text-sm" style={{ color: "#ef4444" }}>
              {error}
            </p>
          )}

          <button
            onClick={step === "create" ? handleCreate : handleConfirm}
            disabled={step === "create" ? !pinFull : !confirmFull || saving}
            className="w-full py-4 rounded-xl font-semibold text-base text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-30"
            style={{ background: "#7c3aed" }}
          >
            {step === "create" ? "Devam Et" : saving ? "Kaydediliyor…" : "PIN'i Onayla"}
          </button>

          {step === "confirm" && (
            <button
              onClick={handleBack}
              className="w-full py-3 text-sm text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              Geri Dön
            </button>
          )}

          <button
            onClick={onSkip}
            className="w-full py-2 text-xs text-center"
            style={{ color: "rgba(139,146,165,0.5)" }}
          >
            Şimdilik atla
          </button>
        </div>
      </div>
    </div>
  );
}
