"use client";

import type { DerivedState, Settings } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

// ── Renk paleti ───────────────────────────────────────────────────────────────

type Palette = {
  main: string;
  light: string;
  lighter: string;
  bottleBg: string;
  liquidBg: string;
  glow: boolean;
};

function getPalette(pct: number): Palette {
  if (pct >= 100) return { main: "#10b981", light: "#34d399", lighter: "#6ee7b7", bottleBg: "#0a1a12", liquidBg: "#0d2818", glow: true };
  if (pct >= 67)  return { main: "#7c3aed", light: "#a78bfa", lighter: "#c4b5fd", bottleBg: "#0d0a1a", liquidBg: "#130f24", glow: false };
  if (pct >= 34)  return { main: "#f59e0b", light: "#fbbf24", lighter: "#fcd34d", bottleBg: "#1a1000", liquidBg: "#201500", glow: false };
  return             { main: "#ef4444", light: "#f87171",  lighter: "#fca5a5",  bottleBg: "#1a0505", liquidBg: "#200808", glow: false };
}

// ── Kazan SVG ────────────────────────────────────────────────────────────────

function PotionBottle({ pct: _pct }: { pct: number }) {
  return (
    <svg
      width="140"
      height="140"
      viewBox="0 0 380 430"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>İksir Havuzu kazanı</title>
      <defs>
        <clipPath id="iksir-cauldron-gc">
          <ellipse cx="190" cy="280" rx="118" ry="95" />
        </clipPath>
      </defs>
      <ellipse cx="190" cy="270" rx="148" ry="122" fill="#10b981" opacity="0.12" />
      <ellipse cx="190" cy="270" rx="136" ry="112" fill="#10b981" opacity="0.15" />
      <ellipse cx="190" cy="270" rx="124" ry="102" fill="#10b981" opacity="0.18" />
      <polygon points="155,362 148,390 164,390" fill="#111" />
      <polygon points="190,365 184,390 196,390" fill="#111" />
      <polygon points="225,362 216,390 232,390" fill="#111" />
      <ellipse cx="190" cy="280" rx="118" ry="95" fill="#1e1e1e" />
      <ellipse cx="190" cy="280" rx="118" ry="95" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.6" />
      <ellipse cx="148" cy="248" rx="18" ry="38" fill="#222" opacity="0.7" />
      <path d="M 72 248 Q 56 242 54 258 Q 52 272 70 272" fill="none" stroke="#111" strokeWidth="12" strokeLinecap="round" />
      <path d="M 72 248 Q 56 242 54 258 Q 52 272 70 272" fill="none" stroke="#1c1c1c" strokeWidth="8" strokeLinecap="round" />
      <path d="M 308 248 Q 324 242 326 258 Q 328 272 310 272" fill="none" stroke="#111" strokeWidth="12" strokeLinecap="round" />
      <path d="M 308 248 Q 324 242 326 258 Q 328 272 310 272" fill="none" stroke="#1c1c1c" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="190" cy="188" rx="118" ry="16" fill="#111" />
      <ellipse cx="190" cy="186" rx="112" ry="12" fill="#1a1a1a" />
      <ellipse cx="190" cy="175" rx="112" ry="30" fill="#10b981" opacity="0.08" />
      <ellipse cx="190" cy="175" rx="104" ry="24" fill="#10b981" opacity="0.1" />
      <ellipse cx="190" cy="182" rx="104" ry="24" fill="#10b981" />
      <ellipse cx="162" cy="172" rx="48" ry="14" fill="#34d399" />
      <ellipse cx="224" cy="174" rx="28" ry="10" fill="#34d399" opacity="0.85" />
      <ellipse cx="190" cy="164" rx="36" ry="9" fill="#6ee7b7" opacity="0.75" />
      <circle cx="150" cy="178" r="7" fill="#6ee7b7" opacity="0.8" />
      <circle cx="174" cy="170" r="5" fill="#6ee7b7" opacity="0.7" />
      <circle cx="200" cy="174" r="8" fill="#6ee7b7" opacity="0.75" />
      <circle cx="226" cy="172" r="5" fill="#6ee7b7" opacity="0.7" />
      <circle cx="242" cy="178" r="4" fill="#6ee7b7" opacity="0.65" />
      <circle cx="168" cy="138" r="8" fill="#10b981" opacity="0.9" />
      <circle cx="165" cy="134" r="3" fill="#6ee7b7" opacity="0.7" />
      <circle cx="162" cy="138" r="12" fill="#10b981" opacity="0.06" />
      <circle cx="195" cy="118" r="14" fill="#10b981" opacity="0.9" />
      <circle cx="191" cy="113" r="5" fill="#6ee7b7" opacity="0.7" />
      <circle cx="195" cy="118" r="22" fill="#10b981" opacity="0.07" />
      <circle cx="222" cy="130" r="9" fill="#10b981" opacity="0.85" />
      <circle cx="219" cy="126" r="3" fill="#6ee7b7" opacity="0.65" />
      <circle cx="222" cy="130" r="14" fill="#10b981" opacity="0.06" />
      <circle cx="180" cy="100" r="6" fill="#10b981" opacity="0.75" />
      <circle cx="210" cy="98" r="5" fill="#10b981" opacity="0.7" />
      <circle cx="235" cy="112" r="5" fill="#10b981" opacity="0.7" />
      <text x="190" y="300" textAnchor="middle" fontSize="48" fontWeight="700" fill="#10b981" opacity="0.15">₺</text>
      <text x="190" y="300" textAnchor="middle" fontSize="48" fontWeight="700" fill="#10b981">₺</text>
    </svg>
  );
}

// ── Ana kart ──────────────────────────────────────────────────────────────────

export default function IksirCard({ state, settings }: { state: DerivedState; settings: Settings }) {
  const safetyBuffer = settings.bufferTargetMonths * settings.fixedMonthlyExpenses;
  const pct = safetyBuffer > 0
    ? (state.buffer / safetyBuffer) * 100
    : (state.buffer > 0 ? 100 : 0);
  const { main: color } = getPalette(pct);

  return (
    <div
      className="rounded-2xl flex flex-row"
      style={{
        position: "relative",
        padding: 20,
        alignItems: "center",
        background: "var(--bg-card)",
        border: "1px solid var(--border-card)",
        borderLeft: "3px solid #7c3aed",
      }}
    >
      {/* Canlı rozeti: sağ üst köşe, absolute */}
      <div className="flex items-center gap-1" style={{ position: "absolute", top: 12, right: 12 }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse flex-shrink-0" />
        <span className="text-[10px] font-medium" style={{ color: "#10b981" }}>Canlı</span>
      </div>

      {/* Sol: başlık + rakam + açıklama */}
      <div className="flex-1 min-w-0 pr-3">
        <span className="text-[11px] font-semibold uppercase block mb-3" style={{ color: "var(--text-secondary)", letterSpacing: "1.5px" }}>
          🧪 İksir Havuzu
        </span>

        <p
          className="font-extrabold leading-none mb-1.5"
          style={{ fontSize: "clamp(1.4rem,5vw,2rem)", color: "var(--text-primary)", letterSpacing: "-0.5px" }}
        >
          {formatCurrency(state.buffer)}
        </p>

        <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
          Vergi kenarı hariç toplam kazan bakiyesi
        </p>

        {safetyBuffer > 0 && (
          <div className="mt-3">
            <div style={{ height: 4, borderRadius: 99, background: "var(--border-subtle)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, Math.max(0, pct))}%`,
                  borderRadius: 99,
                  background: color,
                  transition: "width 0.8s ease, background 0.6s ease",
                }}
              />
            </div>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-secondary)" }}>
              Hedef: {formatCurrency(safetyBuffer)} · {settings.bufferTargetMonths} aylık tampon
            </p>
          </div>
        )}

        <p className="text-[11px] font-bold mt-2" style={{ color, transition: "color 0.6s ease" }}>
          %{Math.round(Math.min(100, Math.max(0, pct)))} dolu
        </p>
      </div>

      {/* Sağ: kazan */}
      <div style={{ width: 140, flexShrink: 0 }}>
        <PotionBottle pct={pct} />
      </div>
    </div>
  );
}
