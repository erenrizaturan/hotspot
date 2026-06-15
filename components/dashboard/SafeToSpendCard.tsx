"use client";

import type { DerivedState, StatusColor } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

const colorMap: Record<StatusColor, { border: string; text: string; badgeBg: string; badgeText: string }> = {
  green: { border: "#10b981", text: "#10b981", badgeBg: "#10b981", badgeText: "#ffffff" },
  amber: { border: "#f59e0b", text: "#f59e0b", badgeBg: "#f59e0b", badgeText: "#ffffff" },
  red:   { border: "#ef4444", text: "#ef4444", badgeBg: "#ef4444", badgeText: "#ffffff" },
};

const messages: Record<StatusColor, string> = {
  green: "Kazanın kaynıyor — güvendesin!",
  amber: "Tamponuna dokunuyorsun, dikkatli harca.",
  red:   "Kazanın boşaldı — hemen gelir ekle!",
};

type Props = { state: DerivedState; status: StatusColor };

export default function SafeToSpendCard({ state, status }: Props) {
  const { border, text, badgeBg, badgeText } = colorMap[status];

  return (
    <div
      className="rounded-2xl bg-white p-6 text-center shadow-sm"
      style={{ border: `2px solid ${border}` }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
        Güvenle Harcanabilir
      </p>
      <p className="text-5xl font-bold tracking-tight mb-3" style={{ color: text }}>
        {formatCurrency(state.safeToSpend)}
      </p>
      <span
        className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
        style={{ background: badgeBg, color: badgeText }}
      >
        {messages[status]}
      </span>
      {status !== "green" && state.aboveBuffer < 0 && (
        <p className="mt-3 text-xs text-gray-500">
          Tampon için {formatCurrency(Math.abs(state.aboveBuffer))} daha gerekli
        </p>
      )}
    </div>
  );
}
