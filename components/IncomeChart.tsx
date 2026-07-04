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
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
    >
      <p
        className="text-[11px] font-semibold uppercase mb-5"
        style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}
      >
        Son 12 Ay Geliri
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis hide />
          <Tooltip
            formatter={(v) => [formatCurrency(Number(v)), "Gelir"]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 10,
              background: "var(--bg-input)",
              border: "1px solid var(--border-input)",
              color: "var(--text-primary)",
            }}
            labelStyle={{ color: "var(--text-secondary)" }}
            cursor={{ fill: "var(--border-subtle)" }}
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
