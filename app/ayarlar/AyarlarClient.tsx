"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import { useKeyboardFix } from "@/lib/useKeyboardFix";
import type { Settings } from "@/lib/types";
import BottomNav from "@/components/BottomNav";
import PinSettings from "@/components/PinSettings";
import ThemeSettings from "@/components/ThemeSettings";
import ReportSettings from "@/components/ReportSettings";

function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        background: "var(--bg-input)",
        border: `1px solid ${focused ? "#7c3aed" : "var(--border-input)"}`,
        borderRadius: 12,
        color: "var(--text-primary)",
        padding: "14px 16px",
        width: "100%",
        fontSize: 16,
        outline: "none",
        transition: "border-color 150ms ease",
      }}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
    />
  );
}

function SettingCard({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{hint}</p>
      </div>
      {children}
    </div>
  );
}

export default function AyarlarClient() {
  useKeyboardFix();
  const { settings, saveSettings, load, loaded } = useStore();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "1";
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [form, setForm] = useState<Settings>({
    fixedMonthlyExpenses: 0, taxRate: 0.2, targetSalary: 0,
    bufferTargetMonths: 3, startingBufferBalance: 0,
  });

  useEffect(() => { if (!loaded) load(); }, [load, loaded]);
  useEffect(() => { if (loaded) setForm(settings); }, [loaded, settings]);

  function update(key: keyof Settings, raw: string) {
    setForm((p) => ({ ...p, [key]: parseFloat(raw) || 0 }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await saveSettings(form);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (isOnboarding) router.push("/");
  }

  return (
    <div className="page-container" style={{ background: "var(--bg-page)" }}>
      <header
        className="px-4 pt-4 pb-4 safe-top"
        style={{ background: "var(--bg-header)", borderBottom: "1px solid var(--border-header)" }}
      >
        <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
          {isOnboarding ? "Kazanı Kur 🪄" : "Ayarlar"}
        </h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {isOnboarding ? "Başlamak için birkaç rakam gir" : "Finansal parametrelerini güncelle"}
        </p>
      </header>

      <main className="px-4 pt-5 pb-24" style={{ paddingBottom: 320 }}>
        {isOnboarding && (
          <div
            className="rounded-2xl p-4 mb-5 text-sm"
            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}
          >
            <p className="font-semibold mb-1">Hoş geldin! 👋</p>
            <p style={{ color: "var(--text-secondary)" }}>Kazanının nasıl kaynayacağını ayarla. İstediğin zaman değiştirebilirsin.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <SettingCard label="Aylık Sabit Gider" hint="Kira, fatura, abonelik — toplam sabit giderlerin (₺)">
            <DarkInput type="number" inputMode="decimal" value={form.fixedMonthlyExpenses || ""} onChange={(e) => update("fixedMonthlyExpenses", e.target.value)} placeholder="0" min={0} />
          </SettingCard>

          <SettingCard label="Vergi Oranı" hint="Yaklaşık vergi yükümlülüğün — gelirin bu kadarı kenara ayrılır (%)">
            <DarkInput type="number" inputMode="decimal" value={form.taxRate * 100 || ""} onChange={(e) => update("taxRate", String(parseFloat(e.target.value) / 100 || 0))} placeholder="20" min={0} max={100} />
          </SettingCard>

          <SettingCard label="Hedef Aylık Maaş" hint="Kendine her ay ödemek istediğin tutar (₺)">
            <DarkInput type="number" inputMode="decimal" value={form.targetSalary || ""} onChange={(e) => update("targetSalary", e.target.value)} placeholder="0" min={0} />
          </SettingCard>

          <SettingCard label="Tampon Hedefi" hint="Kaç aylık sabit gider tamponu tutmak istiyorsun? (ay)">
            <DarkInput type="number" inputMode="decimal" value={form.bufferTargetMonths || ""} onChange={(e) => update("bufferTargetMonths", e.target.value)} placeholder="3" min={0} />
          </SettingCard>

          <SettingCard label="Başlangıç Birikimi" hint="Varsa mevcut tasarrufun — vergi sonrası, kullanılabilir (₺)">
            <DarkInput type="number" inputMode="decimal" value={form.startingBufferBalance || ""} onChange={(e) => update("startingBufferBalance", e.target.value)} placeholder="0" min={0} />
          </SettingCard>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-xl font-semibold text-base text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-40 mt-2"
            style={{ background: "#7c3aed" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#6d28d9")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#7c3aed")}
          >
            {saving ? "Kaydediliyor…" : saved ? "✓ Kaydedildi!" : isOnboarding ? "Kazanı Başlat 🚀" : "Kaydet"}
          </button>
        </form>

        {!isOnboarding && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-semibold px-1 mb-2" style={{ color: "var(--text-secondary)" }}>Görünüm</p>
            <ThemeSettings />
          </div>
        )}

        {!isOnboarding && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-semibold px-1 mb-2" style={{ color: "var(--text-secondary)" }}>Güvenlik</p>
            <PinSettings />
          </div>
        )}

        {!isOnboarding && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-semibold px-1 mb-2" style={{ color: "var(--text-secondary)" }}>📄 Rapor</p>
            <ReportSettings />
          </div>
        )}

        <p className="text-xs text-center mt-5 px-4" style={{ color: "rgba(139,146,165,0.5)" }}>
          Bu araç finansal/vergi tavsiyesi değildir. Gerçek vergi yükümlülüğün için mali müşavirine danış.
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
