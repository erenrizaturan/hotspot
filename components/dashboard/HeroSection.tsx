"use client";

import type { DerivedState, StatusColor } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

const cfg: Record<StatusColor, { accent: string; label: string }> = {
  green: { accent: "#10b981", label: "Kazanın kaynıyor — güvendesin!" },
  amber: { accent: "#f59e0b", label: "Tamponuna dokunuyorsun, dikkatli harca." },
  red:   { accent: "#ef4444", label: "Kazanın boşaldı — hemen gelir ekle!" },
};

export default function HeroSection({ state, status }: { state: DerivedState; status: StatusColor }) {
  const { accent, label } = cfg[status];

  return (
    <div className="text-center py-6">
      <p
        className="text-[11px] font-semibold mb-4"
        style={{ color: "#7c3aed", letterSpacing: "2px", textTransform: "uppercase" }}
      >
        KAZANDAN ALINABİLİR
      </p>
      <p
        className="font-extrabold mb-5 leading-none"
        style={{ fontSize: "clamp(2.8rem,10vw,4rem)", color: accent, letterSpacing: "-1px" }}
      >
        {formatCurrency(state.safeToSpend)}
      </p>
      <span
        className="inline-block text-xs font-medium px-4 py-1.5 rounded-full"
        style={{ border: `1px solid ${accent}`, color: accent, background: "transparent" }}
      >
        {label}
      </span>
      {status !== "green" && state.aboveBuffer < 0 && (
        <p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          Tampon için {formatCurrency(Math.abs(state.aboveBuffer))} daha gerekli
        </p>
      )}
    </div>
  );
}
