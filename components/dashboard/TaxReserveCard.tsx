"use client";

import { formatCurrency } from "@/lib/format";

export default function TaxReserveCard({ taxReserve }: { taxReserve: number }) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-3"
      style={{ background: "#111219", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#7c3aed" }} />
        <span
          className="text-[11px] font-semibold uppercase"
          style={{ color: "#8b92a5", letterSpacing: "1.5px" }}
        >
          Dokunulmaz Kavanoz
        </span>
      </div>
      <p className="text-2xl font-bold text-white leading-none">{formatCurrency(taxReserve)}</p>
      <p className="text-[13px]" style={{ color: "#8b92a5" }}>Bu para senin değil — dokunma</p>
    </div>
  );
}
