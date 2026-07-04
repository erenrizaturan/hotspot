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

export type SubscriptionPeriod = "monthly" | "yearly";

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  period: SubscriptionPeriod;
  isAuto: boolean;
  isConfirmed: boolean;
  createdAt: string;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  emoji: string;
  deadline?: string;
  createdAt: string;
  archivedAt?: string;
};

export type NotificationType = "tax" | "salary" | "goal" | "buffer" | "subscription";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
};
