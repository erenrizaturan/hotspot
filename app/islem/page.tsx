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
    <div className="page-container" style={{ background: "var(--bg-page)" }}>
      <header
        className="px-4 pt-4 pb-4 safe-top"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--border-header)" }}
      >
        <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
          İşlem Ekle
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Kazana ekle, kazandan al</p>
      </header>

      <main className="px-4 pt-5 space-y-8" style={{ paddingBottom: 320 }}>
        <TxnForm />

        <div>
          <p
            className="text-[11px] font-semibold uppercase mb-3"
            style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}
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
