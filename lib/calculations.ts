import type { Txn, Settings, DerivedState, StatusColor, Subscription, Goal } from "./types";

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

export function monthlySubscriptionTotal(subscriptions: Subscription[]): number {
  return subscriptions.reduce((sum, s) => {
    return sum + (s.period === "monthly" ? s.amount : s.amount / 12);
  }, 0);
}

export function yearlySubscriptionTotal(subscriptions: Subscription[]): number {
  return subscriptions.reduce((sum, s) => {
    return sum + (s.period === "yearly" ? s.amount : s.amount * 12);
  }, 0);
}

export function totalGoalAmount(goals: Goal[]): number {
  return goals.filter((g) => !g.archivedAt).reduce((sum, g) => sum + g.targetAmount, 0);
}

export function goalProgress(goal: Goal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
}

export function daysUntilDeadline(deadline: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  return Math.round((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function subscriptionRatio(monthlyTotal: number, targetSalary: number): number {
  if (targetSalary <= 0) return 0;
  return monthlyTotal / targetSalary;
}

export type DetectedSubscription = {
  source: string;
  amount: number;
  count: number;
  dates: string[];
};

export function detectProbableSubscriptions(txns: Txn[]): DetectedSubscription[] {
  const expenses = txns.filter((tx) => tx.type === "expense" && tx.source && tx.source.trim());

  const bySource = new Map<string, Txn[]>();
  for (const tx of expenses) {
    const key = tx.source!.toLowerCase().trim();
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key)!.push(tx);
  }

  const results: DetectedSubscription[] = [];
  for (const [source, txList] of bySource) {
    if (txList.length < 2) continue;

    const amounts = txList.map((t) => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const allSimilar = amounts.every((a) => Math.abs(a - avgAmount) / avgAmount <= 0.05);
    if (!allSimilar) continue;

    const months = new Set(
      txList.map((t) => {
        const d = new Date(t.date);
        return `${d.getFullYear()}-${d.getMonth()}`;
      })
    );
    if (months.size < 2) continue;

    results.push({
      source,
      amount: Math.round(avgAmount),
      count: txList.length,
      dates: txList.map((t) => t.date).sort(),
    });
  }

  return results;
}
