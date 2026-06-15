"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/format";
import type { Txn, TxnType } from "@/lib/types";

const TYPE_LABEL: Record<TxnType, string> = {
  income: "Gelir", salary: "Maaş", expense: "Gider", tax_payment: "Vergi",
};
const TYPE_DOT: Record<TxnType, string> = {
  income: "#10b981", salary: "#7c3aed", expense: "#f59e0b", tax_payment: "#ef4444",
};
const SIGN: Record<TxnType, string> = {
  income: "+", salary: "-", expense: "-", tax_payment: "-",
};
const AMOUNT_COLOR: Record<TxnType, string> = {
  income: "#10b981", salary: "#ffffff", expense: "#ffffff", tax_payment: "#ffffff",
};

export default function TxnList() {
  const { txns, deleteTxn } = useStore();
  const [deleting, setDeleting] = useState<string | null>(null);

  if (txns.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-3xl mb-3 opacity-30">🫙</p>
        <p className="text-sm" style={{ color: "#8b92a5" }}>Henüz işlem yok. İlk gelirini ekle!</p>
      </div>
    );
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await deleteTxn(id);
    setDeleting(null);
  }

  return (
    <div className="space-y-2">
      {txns.map((txn: Txn) => (
        <div
          key={txn.id}
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
          style={{ background: "#111219", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TYPE_DOT[txn.type] }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold" style={{ color: AMOUNT_COLOR[txn.type] }}>
                {SIGN[txn.type]}{formatCurrency(txn.amount)}
              </p>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(255,255,255,0.06)", color: "#8b92a5" }}
              >
                {TYPE_LABEL[txn.type]}
              </span>
            </div>
            <p className="text-xs truncate mt-0.5" style={{ color: "#8b92a5" }}>
              {new Date(txn.date).toLocaleDateString("tr-TR")}
              {txn.source && ` · ${txn.source}`}
              {txn.note   && ` · ${txn.note}`}
            </p>
          </div>
          <button
            onClick={() => handleDelete(txn.id)}
            disabled={deleting === txn.id}
            className="p-1.5 rounded-lg transition-colors duration-150 disabled:opacity-40"
            style={{ color: "rgba(255,255,255,0.2)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ef4444")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.2)")}
            aria-label="Sil"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
