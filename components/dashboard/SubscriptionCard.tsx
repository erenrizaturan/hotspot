"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/format";
import {
  monthlySubscriptionTotal,
  yearlySubscriptionTotal,
  subscriptionRatio,
  detectProbableSubscriptions,
  type DetectedSubscription,
} from "@/lib/calculations";
import { lsLoadDismissedSources, lsSaveDismissedSources } from "@/lib/storage";
import type { Subscription, SubscriptionPeriod } from "@/lib/types";

const inputStyle: React.CSSProperties = {
  background: "var(--bg-input)",
  border: "1px solid var(--border-input)",
  borderRadius: 12,
  color: "var(--text-primary)",
  padding: "14px 16px",
  width: "100%",
  fontSize: 16,
  outline: "none",
};

// ── Add Modal ─────────────────────────────────────────────────────────────────

function AddModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (sub: Omit<Subscription, "id" | "createdAt">) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<SubscriptionPeriod>("monthly");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (!parsed || parsed <= 0 || !name.trim()) return;
    onAdd({ name: name.trim(), amount: parsed, period, isAuto: false, isConfirmed: true });
    onClose();
  }

  const monthlyEquiv =
    period === "yearly" && parseFloat(amount) > 0
      ? parseFloat(amount) / 12
      : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.7)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          position: "relative",
          maxHeight: "90dvh",
          overflowY: "auto",
          width: "calc(100% - 32px)",
          maxWidth: 480,
          borderRadius: 16,
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          padding: 24,
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Abonelik Ekle</h3>
          <button onClick={onClose} style={{ color: "var(--text-secondary)", fontSize: 20 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}>
              Abonelik Adı
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Netflix, Spotify, Adobe…"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}>
              Tutar (₺)
            </p>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              style={{ ...inputStyle, fontSize: 22, fontWeight: 700 }}
            />
            {monthlyEquiv !== null && (
              <p className="text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>
                Aylık eşdeğer: {formatCurrency(monthlyEquiv)}/ay
              </p>
            )}
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}>
              Periyot
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["monthly", "yearly"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className="rounded-xl py-3 text-sm font-semibold transition-all duration-150"
                  style={{
                    background: period === p ? "rgba(124,58,237,0.2)" : "var(--bg-input)",
                    border: period === p ? "1px solid #7c3aed" : "1px solid var(--border-input)",
                    color: period === p ? "#a78bfa" : "var(--text-secondary)",
                  }}
                >
                  {p === "monthly" ? "Aylık" : "Yıllık"}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !amount}
            className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#7c3aed" }}
          >
            Ekle →
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Detect Modal ──────────────────────────────────────────────────────────────

function DetectModal({
  detected,
  onClose,
  onConfirm,
  onDismiss,
}: {
  detected: DetectedSubscription[];
  onClose: () => void;
  onConfirm: (d: DetectedSubscription) => void;
  onDismiss: (source: string) => void;
}) {
  const [remaining, setRemaining] = useState(detected.map((d) => d.source));

  function act(source: string, confirm: boolean) {
    if (confirm) onConfirm(detected.find((d) => d.source === source)!);
    else onDismiss(source);
    const next = remaining.filter((s) => s !== source);
    setRemaining(next);
    if (next.length === 0) onClose();
  }

  const visible = detected.filter((d) => remaining.includes(d.source));
  if (visible.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.7)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          position: "relative",
          maxHeight: "90dvh",
          overflowY: "auto",
          width: "calc(100% - 32px)",
          maxWidth: 480,
          borderRadius: 16,
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          padding: 24,
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Muhtemel Abonelikler</h3>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              Gider geçmişinde aylık tekrar eden ödemeler
            </p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-secondary)", fontSize: 20 }}>✕</button>
        </div>

        <div className="space-y-3 pb-2">
          {visible.map((d) => (
            <div
              key={d.source}
              className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: "var(--bg-page)", border: "1px solid var(--border-card)" }}
            >
              <div>
                <p className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>{d.source}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {formatCurrency(d.amount)}/ay · {d.count} kez tekrar
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => act(d.source, false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: "rgba(139,146,165,0.15)", color: "var(--text-secondary)" }}
                >
                  ✗ Hayır
                </button>
                <button
                  onClick={() => act(d.source, true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
                >
                  ✓ Ekle
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Card ─────────────────────────────────────────────────────────────────

export default function SubscriptionCard() {
  const { subscriptions, txns, settings, addSubscription, deleteSubscription } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetectModal, setShowDetectModal] = useState(false);
  const [dismissedSources, setDismissedSources] = useState<string[]>([]);

  useEffect(() => {
    setDismissedSources(lsLoadDismissedSources());
  }, []);

  const monthlyTotal = monthlySubscriptionTotal(subscriptions);
  const yearlyTotal  = yearlySubscriptionTotal(subscriptions);
  const ratio        = subscriptionRatio(monthlyTotal, settings.targetSalary);

  const allDetected = detectProbableSubscriptions(txns);
  const detected = allDetected.filter(
    (d) =>
      !dismissedSources.includes(d.source) &&
      !subscriptions.some((s) => s.name.toLowerCase() === d.source)
  );

  let dotColor   = "#10b981";
  let warningMsg = "Abonelikler kontrol altında";
  let warnBg     = "rgba(16,185,129,0.1)";
  let warnBorder = "rgba(16,185,129,0.3)";
  if (ratio > 0.30) {
    dotColor = "#ef4444"; warningMsg = "Abonelikler gelirinizi yutuyor!";
    warnBg = "rgba(239,68,68,0.1)"; warnBorder = "rgba(239,68,68,0.3)";
  } else if (ratio > 0.15) {
    dotColor = "#f59e0b"; warningMsg = "Abonelikler yüksek, gözden geçir";
    warnBg = "rgba(245,158,11,0.1)"; warnBorder = "rgba(245,158,11,0.3)";
  }

  const amountColor = ratio > 0.15 ? "#ef4444" : "var(--text-primary)";

  function handleDismiss(source: string) {
    const next = [...dismissedSources, source];
    setDismissedSources(next);
    lsSaveDismissedSources(next);
  }

  function handleConfirm(d: DetectedSubscription) {
    addSubscription({ name: d.source, amount: d.amount, period: "monthly", isAuto: true, isConfirmed: true });
    handleDismiss(d.source);
  }

  return (
    <>
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
          <span
            className="text-[11px] font-semibold uppercase"
            style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}
          >
            💸 Abonelik Sızıntısı
          </span>
        </div>

        {/* Totals */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[13px] mb-1" style={{ color: "var(--text-secondary)" }}>Aylık toplam abonelik</p>
            <p className="text-3xl font-bold leading-none" style={{ color: amountColor }}>
              {formatCurrency(monthlyTotal)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] mb-1" style={{ color: "var(--text-secondary)" }}>Yıllık toplam</p>
            <p className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>
              {formatCurrency(yearlyTotal)}
            </p>
          </div>
        </div>

        {/* Warning badge */}
        {settings.targetSalary > 0 && monthlyTotal > 0 && (
          <div
            className="rounded-xl px-3 py-2 mb-4"
            style={{ background: warnBg, border: `1px solid ${warnBorder}` }}
          >
            <p className="text-xs font-medium" style={{ color: dotColor }}>{warningMsg}</p>
          </div>
        )}

        {/* Auto-detect banner */}
        {detected.length > 0 && (
          <button
            onClick={() => setShowDetectModal(true)}
            className="w-full rounded-xl px-3 py-2.5 mb-4 text-left flex items-center justify-between transition-all duration-150 active:opacity-75"
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          >
            <span className="text-xs font-medium" style={{ color: "#f59e0b" }}>
              {detected.length} muhtemel abonelik tespit edildi — incele
            </span>
            <span style={{ color: "#f59e0b", fontSize: 16 }}>›</span>
          </button>
        )}

        {/* Subscription list */}
        {subscriptions.length > 0 && (
          <div className="mb-4">
            {subscriptions.map((sub, i) => {
              const monthly = sub.period === "monthly" ? sub.amount : sub.amount / 12;
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between py-2.5"
                  style={{
                    borderBottom:
                      i < subscriptions.length - 1
                        ? "1px solid var(--border-subtle)"
                        : "none",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{sub.name}</p>
                    {sub.period === "yearly" && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(139,146,165,0.15)", color: "var(--text-secondary)" }}
                      >
                        yıllık
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-semibold" style={{ color: "#ef4444" }}>
                      {formatCurrency(monthly)}/ay
                    </span>
                    <button
                      onClick={() => deleteSubscription(sub.id)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-150 active:scale-90"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {subscriptions.length === 0 && detected.length === 0 && (
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Henüz abonelik eklenmedi.
          </p>
        )}

        {/* Add button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
          style={{
            background: "rgba(124,58,237,0.15)",
            border: "1px solid rgba(124,58,237,0.3)",
            color: "#a78bfa",
          }}
        >
          + Abonelik Ekle
        </button>
      </div>

      {showAddModal && (
        <AddModal onClose={() => setShowAddModal(false)} onAdd={addSubscription} />
      )}

      {showDetectModal && detected.length > 0 && (
        <DetectModal
          detected={detected}
          onClose={() => setShowDetectModal(false)}
          onConfirm={handleConfirm}
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
}
