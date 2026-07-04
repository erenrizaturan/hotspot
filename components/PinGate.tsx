"use client";

import { useEffect, useState } from "react";
import {
  isPinSet,
  isUnlocked,
  unlock,
  lock,
  recordHidden,
  shouldRelockAfterBackground,
  clearHiddenAt,
  hasPinSetupBeenSkipped,
  skipPinSetup,
} from "@/lib/pin";
import PinSetup from "./PinSetup";
import PinLock from "./PinLock";

type Screen = "loading" | "setup" | "lock" | "app";

export default function PinGate({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>("loading");

  useEffect(() => {
    if (!isPinSet()) {
      if (hasPinSetupBeenSkipped()) {
        setScreen("app");
      } else {
        setScreen("setup");
      }
    } else {
      setScreen(isUnlocked() ? "app" : "lock");
    }
  }, []);

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        recordHidden();
      } else {
        if (shouldRelockAfterBackground() && isPinSet()) {
          clearHiddenAt();
          lock();
          setScreen("lock");
        } else {
          clearHiddenAt();
        }
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  function handlePinSet() {
    unlock();
    setScreen("app");
  }

  function handleSkip() {
    skipPinSetup();
    setScreen("app");
  }

  function handleUnlock() {
    setScreen("app");
  }

  if (screen === "loading") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#7c3aed] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (screen === "setup") {
    return <PinSetup onPinSet={handlePinSet} onSkip={handleSkip} />;
  }

  if (screen === "lock") {
    return <PinLock onUnlock={handleUnlock} />;
  }

  return <>{children}</>;
}
