"use client";

import { formatCurrency } from "@/lib/format";
import { getMonthIncome } from "@/lib/calculations";
import type { Txn } from "@/lib/types";

export default function IncomeVsTargetCard({ txns, targetSalary }: { txns: Txn[]; targetSalary: number }) {
  const now        = new Date();
  const income     = getMonthIncome(txns, now.getFullYear(), now.getMonth());
  const ratio      = targetSalary > 0 ? income / targetSalary : 0;
  const pct        = Math.min(ratio * 100, 100);
  const monthName  = now.toLocaleDateString("tr-TR", { month: "long" });
  const label      = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "#111219", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p
            className="text-[11px] font-semibold uppercase mb-2"
            style={{ color: "#8b92a5", letterSpacing: "1.5px" }}
          >
            {label} Geliri
          </p>
          <p className="text-2xl font-bold text-white">{formatCurrency(income)}</p>
          {targetSalary > 0 && (
            <p className="text-[13px] mt-1" style={{ color: "#8b92a5" }}>
              Hedef maaş: {formatCurrency(targetSalary)}
            </p>
          )}
        </div>
        {targetSalary > 0 && (
          <span className="text-sm font-semibold" style={{ color: ratio >= 1 ? "#10b981" : "#8b92a5" }}>
            %{Math.round(pct)}
          </span>
        )}
      </div>
      {targetSalary > 0 && (
        <div className="w-full rounded-full h-1" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: "#10b981" }}
          />
        </div>
      )}
    </div>
  );
}
