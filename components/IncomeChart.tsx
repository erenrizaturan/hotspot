"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { getLast12MonthsIncome } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";
import type { Txn } from "@/lib/types";

export default function IncomeChart({ txns, targetSalary }: { txns: Txn[]; targetSalary: number }) {
  const data = getLast12MonthsIncome(txns);

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "#111219", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <p
        className="text-[11px] font-semibold uppercase mb-5"
        style={{ color: "#8b92a5", letterSpacing: "1.5px" }}
      >
        Son 12 Ay Geliri
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "#8b92a5" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis hide />
          <Tooltip
            formatter={(v) => [formatCurrency(Number(v)), "Gelir"]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 10,
              background: "#1a1d27",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#ffffff",
            }}
            labelStyle={{ color: "#8b92a5" }}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          {targetSalary > 0 && (
            <ReferenceLine
              y={targetSalary}
              stroke="#7c3aed"
              strokeDasharray="4 2"
              label={{ value: "Hedef", fontSize: 9, fill: "#7c3aed", position: "insideTopRight" }}
            />
          )}
          <Bar dataKey="gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
