"use client";

import { formatCurrency } from "@/lib/format";

export default function TaxReserveCard({ taxReserve }: { taxReserve: number }) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#7c3aed" }} />
        <span
          className="text-[11px] font-semibold uppercase"
          style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}
        >
          Dokunulmaz Kavanoz
        </span>
      </div>
      <p className="text-2xl font-bold leading-none" style={{ color: "var(--text-primary)" }}>{formatCurrency(taxReserve)}</p>
      <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Bu para senin değil — dokunma</p>
    </div>
  );
}
