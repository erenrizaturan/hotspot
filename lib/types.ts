export type TxnType = "income" | "salary" | "expense" | "tax_payment";

export type Txn = {
  id: string;
  type: TxnType;
  amount: number;
  date: string;
  taxRateAtTime?: number;
  source?: string;
  note?: string;
};

export type Settings = {
  fixedMonthlyExpenses: number;
  taxRate: number;
  targetSalary: number;
  bufferTargetMonths: number;
  startingBufferBalance: number;
};

export type DerivedState = {
  buffer: number;
  taxReserve: number;
  runwayMonths: number;
  safetyBuffer: number;
  aboveBuffer: number;
  safeToSpend: number;
};

export type StatusColor = "green" | "amber" | "red";
