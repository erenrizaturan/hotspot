"use client";

import { formatMonths } from "@/lib/format";

export default function RunwayCard({ runwayMonths, fixedMonthlyExpenses }: {
  runwayMonths: number; buffer: number; fixedMonthlyExpenses: number;
}) {
  const months = parseFloat(formatMonths(runwayMonths));
  const color  = months < 1 ? "#ef4444" : "#f59e0b";

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-3"
      style={{ background: "#111219", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span
          className="text-[11px] font-semibold uppercase"
          style={{ color: "#8b92a5", letterSpacing: "1.5px" }}
        >
          Kazan Kaç Ay Yeter
        </span>
      </div>
      <p className="text-2xl font-bold leading-none" style={{ color }}>
        {formatMonths(runwayMonths)} <span className="text-base font-medium">ay</span>
      </p>
      <p className="text-[13px]" style={{ color: "#8b92a5" }}>
        {fixedMonthlyExpenses > 0 ? "Hiç gelir gelmese sabit giderlerin" : "Aylık sabit gider gir"}
      </p>
    </div>
  );
}
