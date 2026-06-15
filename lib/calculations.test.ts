import { describe, it, expect } from "vitest";
import { deriveState } from "./calculations";
import type { Txn, Settings } from "./types";

const baseSettings: Settings = {
  fixedMonthlyExpenses: 5000,
  taxRate: 0.25,
  targetSalary: 8000,
  bufferTargetMonths: 2,
  startingBufferBalance: 0,
};

describe("deriveState", () => {
  it("bolluk ayı: yüksek gelir, güvenle harcanabilir hedef maaşa eşit", () => {
    const txns: Txn[] = [
      { id: "1", type: "income", amount: 40000, date: "2024-01-01" },
    ];
    const state = deriveState(txns, baseSettings);
    // buffer = 40000 * 0.75 = 30000
    // taxReserve = 40000 * 0.25 = 10000
    // safetyBuffer = 2 * 5000 = 10000
    // aboveBuffer = 30000 - 10000 = 20000
    // safeToSpend = min(8000, 20000) = 8000
    expect(state.buffer).toBeCloseTo(30000);
    expect(state.taxReserve).toBeCloseTo(10000);
    expect(state.safeToSpend).toBeCloseTo(8000);
    expect(state.aboveBuffer).toBeCloseTo(20000);
  });

  it("kıt ay: düşük gelir, safeToSpend sıfır", () => {
    const txns: Txn[] = [
      { id: "1", type: "income", amount: 5000, date: "2024-02-01" },
    ];
    const state = deriveState(txns, baseSettings);
    // buffer = 5000 * 0.75 = 3750
    // safetyBuffer = 10000
    // aboveBuffer = 3750 - 10000 = -6250
    // safeToSpend = max(0, min(8000, -6250)) = 0
    expect(state.buffer).toBeCloseTo(3750);
    expect(state.safeToSpend).toBe(0);
    expect(state.aboveBuffer).toBeCloseTo(-6250);
  });

  it("tampon altına düşme: buffer pozitif ama safetyBuffer altında", () => {
    const txns: Txn[] = [
      { id: "1", type: "income", amount: 20000, date: "2024-03-01" },
      { id: "2", type: "salary", amount: 7000, date: "2024-03-15" },
    ];
    const state = deriveState(txns, baseSettings);
    // buffer = 20000*0.75 - 7000 = 15000 - 7000 = 8000
    // safetyBuffer = 10000
    // aboveBuffer = 8000 - 10000 = -2000
    expect(state.buffer).toBeCloseTo(8000);
    expect(state.aboveBuffer).toBeCloseTo(-2000);
    expect(state.safeToSpend).toBe(0);
  });

  it("vergi ödemesi sonrası taxReserve azalır", () => {
    const txns: Txn[] = [
      { id: "1", type: "income", amount: 40000, date: "2024-04-01" },
      { id: "2", type: "tax_payment", amount: 5000, date: "2024-04-30" },
    ];
    const state = deriveState(txns, baseSettings);
    // taxReserve = 40000*0.25 - 5000 = 10000 - 5000 = 5000
    expect(state.taxReserve).toBeCloseTo(5000);
    expect(state.buffer).toBeCloseTo(30000);
  });
});
