"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { useKeyboardFix } from "@/lib/useKeyboardFix";
import type { TxnType, Txn } from "@/lib/types";

const TYPES: { key: TxnType; label: string; sub: string; dot: string }[] = [
  { key: "income",      label: "Kazana Ekle",   sub: "Gelir",    dot: "#10b981" },
  { key: "salary",      label: "Kazandan Al",   sub: "Maaş çek", dot: "#7c3aed" },
  { key: "expense",     label: "Gider Öde",     sub: "Harcama",  dot: "#f59e0b" },
  { key: "tax_payment", label: "Vergi Öde",     sub: "Vergi",    dot: "#ef4444" },
];

const inputBase: React.CSSProperties = {
  background: "var(--bg-input)",
  border: "1px solid var(--border-input)",
  borderRadius: 12,
  color: "var(--text-primary)",
  padding: "14px 16px",
  width: "100%",
  fontSize: 16,
  outline: "none",
  transition: "border-color 150ms ease",
};

function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{ ...inputBase, borderColor: focused ? "#7c3aed" : "var(--border-input)", ...props.style }}
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

export default function TxnForm({ onAdded }: { onAdded?: () => void }) {
  useKeyboardFix();
  const { addTxn, settings } = useStore();
  const [type,   setType]   = useState<TxnType>("income");
  const [amount, setAmount] = useState("");
  const [date,   setDate]   = useState(new Date().toISOString().slice(0, 10));
  const [source, setSource] = useState("");
  const [note,   setNote]   = useState("");
  const [saving, setSaving] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;                         // Çift tıklama koruması

    const parsed = parseFloat(amount.replace(",", "."));
    if (!parsed || parsed <= 0) return;

    setSaving(true);
    try {
      // addTxn artık senkron — state anında güncellenir, DB arka planda
      addTxn({
        id:     crypto.randomUUID(),
        type,
        amount: parsed,
        date,
        source: source || undefined,
        note:   note   || undefined,
        ...(type === "income" ? { taxRateAtTime: settings.taxRate } : {}),
      } as Txn);

      // Formu temizle
      setAmount(""); setSource(""); setNote("");
    } finally {
      // Hata olsa da olmasa da saving'i kapat — UI asla takılmaz
      setSaving(false);
      onAdded?.();
    }
  }

  const selected = TYPES.find((t) => t.key === type)!;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Type picker */}
      <div>
        <p className="text-[11px] font-semibold uppercase mb-3" style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}>
          İşlem Türü
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => {
            const active = type === t.key;
            return (
              <button
                key={t.key}
                type="button"
                disabled={saving}
                onClick={() => setType(t.key)}
                className="rounded-xl p-4 text-left transition-all duration-150"
                style={{
                  background: active ? "rgba(124,58,237,0.12)" : "var(--bg-card)",
                  border: active ? "1px solid #7c3aed" : "1px solid var(--border-card)",
                  opacity: saving ? 0.5 : 1,
                }}
              >
                <span className="w-2 h-2 rounded-full inline-block mb-2" style={{ background: t.dot }} />
                <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>{t.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{t.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount */}
      <div>
        <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}>
          Tutar (₺)
        </p>
        <DarkInput
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          required
          disabled={saving}
          style={{ fontSize: 22, fontWeight: 700 }}
        />
        {type === "income" && (
          <p className="text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>
            Brüt tutar — vergi (%{Math.round(settings.taxRate * 100)}) otomatik ayrılır
          </p>
        )}
      </div>

      {/* Date */}
      <div>
        <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}>Tarih</p>
        <DarkInput
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          disabled={saving}
        />
      </div>

      {type === "income" && (
        <div>
          <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}>Kaynak (opsiyonel)</p>
          <DarkInput
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Müşteri adı, proje…"
            disabled={saving}
          />
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}>Not (opsiyonel)</p>
        <DarkInput
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Kısa not…"
          disabled={saving}
        />
      </div>

      <button
        type="submit"
        disabled={saving || !amount}
        className="w-full py-4 rounded-xl font-semibold text-base text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: saving ? "#4c1d95" : "#7c3aed" }}
        onMouseEnter={(e) => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = "#6d28d9"; }}
        onMouseLeave={(e) => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = "#7c3aed"; }}
      >
        {saving ? "✓ Eklendi" : `${selected.label} →`}
      </button>
    </form>
  );
}
