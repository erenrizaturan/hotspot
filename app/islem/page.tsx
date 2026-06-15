"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import BottomNav from "@/components/BottomNav";
import TxnForm from "@/components/TxnForm";
import TxnList from "@/components/TxnList";

export default function IslemPage() {
  const { load, loaded } = useStore();
  useEffect(() => { if (!loaded) load(); }, [load, loaded]);

  return (
    <div className="min-h-[100dvh] pb-24" style={{ background: "#0a0b0f" }}>
      <header
        className="px-4 pt-4 pb-4 safe-top"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h1 className="text-lg font-bold text-white" style={{ letterSpacing: "-0.5px" }}>
          İşlem Ekle
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "#8b92a5" }}>Kazana ekle, kazandan al</p>
      </header>

      <main className="px-4 pt-5 space-y-8">
        <TxnForm />

        <div>
          <p
            className="text-[11px] font-semibold uppercase mb-3"
            style={{ color: "#8b92a5", letterSpacing: "1.5px" }}
          >
            İşlem Geçmişi
          </p>
          <TxnList />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
