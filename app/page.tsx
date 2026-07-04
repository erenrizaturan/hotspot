"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { deriveState, getStatusColor } from "@/lib/calculations";
import BottomNav from "@/components/BottomNav";
import HeroSection from "@/components/dashboard/HeroSection";
import TaxReserveCard from "@/components/dashboard/TaxReserveCard";
import RunwayCard from "@/components/dashboard/RunwayCard";
import IncomeVsTargetCard from "@/components/dashboard/IncomeVsTargetCard";
import IncomeChart from "@/components/IncomeChart";
import SubscriptionCard from "@/components/dashboard/SubscriptionCard";
import GoalsCard from "@/components/dashboard/GoalsCard";
import IksirCard from "@/components/dashboard/IksirCard";
import NotificationBell from "@/components/NotificationBell";

export default function PanelPage() {
  const { txns, settings, loaded, load, backend } = useStore();
  const router = useRouter();

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (loaded && settings.targetSalary === 0 && settings.fixedMonthlyExpenses === 0) {
      router.push("/ayarlar?onboarding=1");
    }
  }, [loaded, settings, router]);

  if (!loaded) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <div className="text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#10b981] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Kazan ısınıyor…</p>
        </div>
      </div>
    );
  }

  const state  = deriveState(txns, settings);
  const status = getStatusColor(state);

  return (
    <div className="page-container pb-24" style={{ background: "var(--bg-page)" }}>

      {/* Header */}
      <header
        className="px-4 pt-4 pb-4 safe-top flex items-center justify-between"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--border-header)" }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
          <span className="font-bold text-lg" style={{ color: "var(--text-primary)", letterSpacing: "-0.5px" }}>HotSpot</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
          >
            Kazan kaynıyor 🪄
          </span>
          <NotificationBell />
        </div>
      </header>

      <main className="px-4 space-y-3 pt-6">
        {/* Hero */}
        <HeroSection state={state} status={status} />

        {/* İksir Havuzu */}
        <IksirCard state={state} settings={settings} />

        {/* 2-col metric cards */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <TaxReserveCard taxReserve={state.taxReserve} />
          <RunwayCard
            runwayMonths={state.runwayMonths}
            buffer={state.buffer}
            fixedMonthlyExpenses={settings.fixedMonthlyExpenses}
          />
        </div>

        <IncomeVsTargetCard txns={txns} targetSalary={settings.targetSalary} />

        {txns.some((t) => t.type === "income") && (
          <IncomeChart txns={txns} targetSalary={settings.targetSalary} />
        )}

        <SubscriptionCard />

        <GoalsCard />

        {/* Private mode uyarısı */}
        {backend === "localstorage" && (
          <div
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}
          >
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>Gizli Mod Algılandı</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                IndexedDB kullanılamıyor (Safari gizli mod?). Veriler bu oturumda geçici olarak saklanır.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 pb-2 space-y-1.5">
          <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <span>🔒</span>Verilerin yalnızca bu cihazda saklanır.
          </p>
          <p className="text-xs" style={{ color: "rgba(139,146,165,0.5)" }}>
            Bu araç finansal/vergi tavsiyesi değildir. Mali müşavirine danış.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
