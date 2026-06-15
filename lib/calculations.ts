import type { Txn, Settings, DerivedState, StatusColor } from "./types";

export function deriveState(txns: Txn[], s: Settings): DerivedState {
  let buffer = s.startingBufferBalance;
  let taxReserve = 0;

  for (const tx of txns) {
    if (tx.type === "income") {
      const t = tx.taxRateAtTime ?? s.taxRate;
      buffer += tx.amount * (1 - t);
      taxReserve += tx.amount * t;
    } else if (tx.type === "salary") {
      buffer -= tx.amount;
    } else if (tx.type === "expense") {
      buffer -= tx.amount;
    } else if (tx.type === "tax_payment") {
      taxReserve -= tx.amount;
    }
  }

  const runwayMonths =
    s.fixedMonthlyExpenses > 0 ? buffer / s.fixedMonthlyExpenses : Infinity;
  const safetyBuffer = s.bufferTargetMonths * s.fixedMonthlyExpenses;
  const aboveBuffer = buffer - safetyBuffer;
  const safeToSpend = Math.max(0, Math.min(s.targetSalary, aboveBuffer));

  return { buffer, taxReserve, runwayMonths, safetyBuffer, aboveBuffer, safeToSpend };
}

export function getStatusColor(state: DerivedState): StatusColor {
  if (state.buffer <= 0) return "red";
  if (state.aboveBuffer < 0) return "amber";
  return "green";
}

export function getMonthIncome(txns: Txn[], year: number, month: number): number {
  return txns
    .filter((tx) => {
      if (tx.type !== "income") return false;
      const d = new Date(tx.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function getLast12MonthsIncome(txns: Txn[]): { month: string; gelir: number }[] {
  const now = new Date();
  const result = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
    result.push({
      month: label,
      gelir: getMonthIncome(txns, d.getFullYear(), d.getMonth()),
    });
  }
  return result;
}
