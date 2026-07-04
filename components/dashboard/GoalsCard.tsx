"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { goalProgress, daysUntilDeadline } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";
import type { Goal } from "@/lib/types";

const EMOJIS = ["🏠", "🚗", "✈️", "💍", "📱", "💻", "🎓", "🏖️", "💰", "🎁", "🎸", "🏋️", "🐶", "🌍", "⛵"];

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

// ── Confetti ──────────────────────────────────────────────────────────────────

async function fireConfetti() {
  const confetti = (await import("canvas-confetti")).default;
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#7c3aed", "#10b981", "#f59e0b", "#a78bfa"] });
}

// ── Add Modal ─────────────────────────────────────────────────────────────────

function AddGoalModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (g: Omit<Goal, "id" | "createdAt" | "currentAmount">) => void;
}) {
  const [emoji,    setEmoji]    = useState("🎯");
  const [name,     setName]     = useState("");
  const [amount,   setAmount]   = useState("");
  const [deadline, setDeadline] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (!parsed || parsed <= 0 || !name.trim()) return;
    onAdd({ emoji, name: name.trim(), targetAmount: parsed, deadline: deadline || undefined });
    onClose();
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "calc(100% - 32px)", maxWidth: 480, maxHeight: "90dvh", overflowY: "auto", borderRadius: 16, background: "var(--bg-card)", border: "1px solid var(--border-card)", padding: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Hedef Ekle</h3>
          <button onClick={onClose} style={{ color: "var(--text-secondary)", fontSize: 20 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Emoji */}
          <div>
            <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}>Emoji</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {EMOJIS.map((e) => (
                <button
                  key={e} type="button" onClick={() => setEmoji(e)}
                  style={{
                    width: 44, height: 44, borderRadius: 10, fontSize: 22,
                    background: emoji === e ? "rgba(124,58,237,0.2)" : "var(--bg-page)",
                    border: emoji === e ? "2px solid #7c3aed" : "1px solid var(--border-input)",
                    cursor: "pointer",
                  }}
                >{e}</button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}>Hedef Adı</p>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Araba, tatil, laptop…" required style={inputStyle} />
          </div>

          {/* Amount */}
          <div>
            <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}>Hedef Tutar (₺)</p>
            <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required style={{ ...inputStyle, fontSize: 22, fontWeight: 700 }} />
          </div>

          {/* Deadline */}
          <div>
            <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}>Son Tarih (opsiyonel)</p>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !amount}
            className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
            style={{ background: "#7c3aed" }}
          >
            Hedef Ekle →
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Add Money Modal ───────────────────────────────────────────────────────────

function AddMoneyModal({ goal, onClose, onAdd }: {
  goal: Goal;
  onClose: () => void;
  onAdd: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (!parsed || parsed <= 0) return;
    onAdd(parsed);
    onClose();
  }

  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <div
      style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "calc(100% - 32px)", maxWidth: 400, borderRadius: 16, background: "var(--bg-card)", border: "1px solid var(--border-card)", padding: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div>
            <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{goal.emoji} {goal.name}</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Kalan: {formatCurrency(remaining)}
            </p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-secondary)", fontSize: 20 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="number" inputMode="decimal"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="Tutar gir (₺)"
            required autoFocus
            style={{ ...inputStyle, fontSize: 22, fontWeight: 700 }}
          />
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Bu tutar gider olarak işlem geçmişine de eklenir.
          </p>
          <button
            type="submit"
            disabled={!amount}
            className="w-full py-4 rounded-xl font-semibold text-white active:scale-[0.98] disabled:opacity-50"
            style={{ background: "#7c3aed" }}
          >
            Kazandan Aktar →
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div style={{ height: 5, borderRadius: 99, background: "#2d1f4e", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 99,
          background: pct >= 100 ? "#10b981" : "linear-gradient(90deg, #7c3aed, #10b981)",
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

// ── Goal Row ──────────────────────────────────────────────────────────────────

function GoalRow({ goal, onAddMoney, onDelete }: {
  goal: Goal;
  onAddMoney: () => void;
  onDelete: () => void;
}) {
  const pct      = goalProgress(goal);
  const done     = pct >= 100;
  const days     = goal.deadline ? daysUntilDeadline(goal.deadline) : null;
  const nearDl   = days !== null && days >= 0 && days < 7;
  const pastDl   = days !== null && days < 0;

  const deadlineColor = pastDl ? "#ef4444" : nearDl ? "#f59e0b" : "var(--text-secondary)";

  return (
    <div style={{ paddingTop: 12, paddingBottom: 12, borderBottom: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ fontSize: 20 }}>{goal.emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{goal.name}</p>
            {days !== null && (
              <p className="text-[11px]" style={{ color: deadlineColor }}>
                {pastDl ? `${Math.abs(days)} gün geçti` : days === 0 ? "Bugün son gün!" : `${days} gün kaldı`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: done ? "#10b981" : "var(--text-primary)" }}>
              {done ? "✓ Tamam!" : `%${Math.round(pct)}`}
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
            </p>
          </div>
          {!done && (
            <button
              onClick={onAddMoney}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all active:scale-90"
              style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)", whiteSpace: "nowrap" }}
            >
              + Para
            </button>
          )}
          <button
            onClick={onDelete}
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all active:scale-90 flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}
          >
            ✕
          </button>
        </div>
      </div>
      <ProgressBar pct={pct} />
    </div>
  );
}

// ── Main Card ─────────────────────────────────────────────────────────────────

export default function GoalsCard() {
  const { goals, addGoal, updateGoal, deleteGoal, addToGoal } = useStore();
  const [showAdd, setShowAdd]         = useState(false);
  const [addMoneyGoal, setAddMoneyGoal] = useState<Goal | null>(null);

  const activeGoals   = goals.filter((g) => !g.archivedAt);
  const visibleGoals  = activeGoals;

  // Auto-archive 3 gün önce tamamlanan hedefler
  useEffect(() => {
    const now = Date.now();
    for (const g of activeGoals) {
      if (goalProgress(g) >= 100) {
        const completedAt = new Date(g.createdAt).getTime(); // createdAt kullanmak yanlış ama archivedAt yok
        // archivedAt yoksa, currentAmount >= targetAmount ise tamamlanmış say
        // 3 gün = 259200000 ms — currentAmount son güncellemesini bilmiyoruz, createdAt'ı kullanmak yerine
        // "completedSince" alanı olmadığı için: sadece deadline'ı geçmiş olanları arşivle
        if (g.deadline) {
          const dl = new Date(g.deadline).getTime();
          if (now - dl > 3 * 24 * 60 * 60 * 1000 && goalProgress(g) >= 100) {
            updateGoal({ ...g, archivedAt: new Date().toISOString() });
          }
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals]);

  // Konfeti: her hedef için sadece bir kez, localStorage ile takip edilir
  useEffect(() => {
    goals.forEach((g) => {
      const key = `hotspot_confetti_${g.id}`;
      const progress = g.currentAmount / g.targetAmount;
      if (progress >= 1 && !localStorage.getItem(key)) {
        fireConfetti();
        localStorage.setItem(key, "true");
      }
    });
  }, [goals]);

  function handleAddToGoal(id: string, amount: number) {
    addToGoal(id, amount);
  }

  return (
    <>
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#7c3aed" }} />
          <span className="text-[11px] font-semibold uppercase" style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}>
            🎯 Hedefler
          </span>
          {activeGoals.length > 0 && (
            <span
              className="ml-auto text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
            >
              {activeGoals.length}
            </span>
          )}
        </div>

        {/* Goal list */}
        {visibleGoals.length === 0 ? (
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Henüz hedef yok. İlk hedefinizi ekleyin!
          </p>
        ) : (
          <div className="mb-2" style={{ marginLeft: -2, marginRight: -2 }}>
            {visibleGoals.map((g) => (
              <GoalRow
                key={g.id}
                goal={g}
                onAddMoney={() => setAddMoneyGoal(g)}
                onDelete={() => {
                  localStorage.removeItem(`hotspot_confetti_${g.id}`);
                  deleteGoal(g.id);
                }}
              />
            ))}
          </div>
        )}

        {/* Add button */}
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] mt-2"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}
        >
          + Hedef Ekle
        </button>
      </div>

      {showAdd && (
        <AddGoalModal
          onClose={() => setShowAdd(false)}
          onAdd={(g) => addGoal(g)}
        />
      )}

      {addMoneyGoal && (
        <AddMoneyModal
          goal={addMoneyGoal}
          onClose={() => setAddMoneyGoal(null)}
          onAdd={(amount) => handleAddToGoal(addMoneyGoal.id, amount)}
        />
      )}
    </>
  );
}
