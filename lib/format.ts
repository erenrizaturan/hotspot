const formatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(amount: number): string {
  return formatter.format(amount);
}

export function formatMonths(months: number): string {
  if (!isFinite(months)) return "∞";
  if (months < 0) return "0";
  return months.toFixed(1);
}
