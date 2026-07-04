"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";

export default function ReportSettings() {
  const { txns, settings, subscriptions, goals } = useStore();
  const [preparing, setPreparing] = useState(false);

  async function handleDownload() {
    setPreparing(true);
    try {
      const { generateMonthlyReport } = await import("@/lib/generateReport");
      const now = new Date();
      generateMonthlyReport({
        year: now.getFullYear(),
        month: now.getMonth(),
        settings,
        txns,
        subscriptions,
        goals,
      });
    } finally {
      setPreparing(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Aylık Rapor</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Bu ayın özetini PDF olarak indir
        </p>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={preparing}
        className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
        style={{ background: "#10b981" }}
      >
        {preparing ? "Hazırlanıyor…" : "Bu Ayın Raporunu İndir"}
      </button>
      <p className="text-[11px] text-center" style={{ color: "var(--text-secondary)" }}>
        İşlemler, hedefler ve abonelikler dahil
      </p>
    </div>
  );
}
