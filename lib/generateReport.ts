import { jsPDF } from "jspdf";
import { NOTO_SANS_REGULAR_BASE64 } from "./fonts/notoSansRegular";
import { NOTO_SANS_BOLD_BASE64 } from "./fonts/notoSansBold";
import { deriveState, getMonthIncome, goalProgress } from "./calculations";
import { formatCurrency, formatMonths } from "./format";
import type { Txn, Settings, Subscription, Goal, TxnType } from "./types";

export type ReportData = {
  year: number;
  month: number; // 0-based (0 = Ocak)
  settings: Settings;
  txns: Txn[];
  subscriptions: Subscription[];
  goals: Goal[];
};

// ── Sabitler ──────────────────────────────────────────────────────────────────

const FONT = "NotoSans";
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H = 16;
const BOTTOM_LIMIT = PAGE_H - MARGIN - FOOTER_H;

const BG        = "#0a0b0f";
const CARD_BG   = "#111219";
const BORDER    = "#2a2c36";
const GREEN     = "#10b981";
const WHITE     = "#ffffff";
const GRAY      = "#8b92a5";
const AMBER     = "#f59e0b";
const RED       = "#ef4444";

const TYPE_LABEL: Record<TxnType, string> = {
  income: "Gelir", salary: "Maaş", expense: "Gider", tax_payment: "Vergi",
};
const TYPE_SIGN: Record<TxnType, string> = {
  income: "+", salary: "-", expense: "-", tax_payment: "-",
};
const TYPE_COLOR: Record<TxnType, string> = {
  income: GREEN, salary: WHITE, expense: WHITE, tax_payment: WHITE,
};

// ── Yardımcılar ───────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function fill(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setFillColor(r, g, b);
}

function textColor(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setTextColor(r, g, b);
}

function drawColor(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setDrawColor(r, g, b);
}

function drawPageBackground(doc: jsPDF) {
  fill(doc, BG);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > BOTTOM_LIMIT) {
    doc.addPage();
    drawPageBackground(doc);
    return MARGIN;
  }
  return y;
}

function sectionTitle(doc: jsPDF, y: number, title: string, subtitle?: string): number {
  y = ensureSpace(doc, y, subtitle ? 16 : 12);
  doc.setFont(FONT, "bold");
  doc.setFontSize(13);
  textColor(doc, GREEN);
  doc.text(title, MARGIN, y);
  y += 6;
  if (subtitle) {
    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    textColor(doc, GRAY);
    doc.text(subtitle, MARGIN, y);
    y += 6;
  }
  return y + 2;
}

type Column = { header: string; width: number; align?: "left" | "right" };
type Row = { cells: string[]; colors?: string[] };

function drawTable(doc: jsPDF, startY: number, columns: Column[], rows: Row[], rowH = 8): number {
  let y = startY;
  const x = MARGIN;

  function header() {
    fill(doc, CARD_BG);
    doc.rect(x, y, CONTENT_W, rowH, "F");
    doc.setFont(FONT, "bold");
    doc.setFontSize(9);
    let cx = x;
    for (const col of columns) {
      textColor(doc, GREEN);
      const align = col.align ?? "left";
      const tx = align === "right" ? cx + col.width - 3 : cx + 3;
      doc.text(col.header, tx, y + rowH - 2.8, { align });
      cx += col.width;
    }
    y += rowH;
  }

  header();

  rows.forEach((row, i) => {
    if (y + rowH > BOTTOM_LIMIT) {
      doc.addPage();
      drawPageBackground(doc);
      y = MARGIN;
      header();
    }
    fill(doc, i % 2 === 0 ? CARD_BG : BG);
    doc.rect(x, y, CONTENT_W, rowH, "F");
    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    let cx = x;
    columns.forEach((col, ci) => {
      textColor(doc, row.colors?.[ci] ?? WHITE);
      const align = col.align ?? "left";
      const tx = align === "right" ? cx + col.width - 3 : cx + 3;
      doc.text(row.cells[ci], tx, y + rowH - 2.8, { align, maxWidth: col.width - 6 });
      cx += col.width;
    });
    y += rowH;
  });

  return y;
}

function emptyRow(doc: jsPDF, y: number, message: string): number {
  doc.setFont(FONT, "normal");
  doc.setFontSize(9.5);
  textColor(doc, GRAY);
  doc.text(message, MARGIN, y);
  return y + 8;
}

// ── Başlık ────────────────────────────────────────────────────────────────────

function drawTestTubeIcon(doc: jsPDF, x: number, y: number) {
  drawColor(doc, GRAY);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, 6, 14, 2, 2, "S");
  fill(doc, GREEN);
  doc.rect(x + 0.8, y + 6.5, 4.4, 6.7, "F");
  doc.setLineWidth(0.3);
  doc.line(x - 1, y, x + 7, y);
}

function drawHeader(doc: jsPDF, monthLabel: string, year: number): number {
  let y = MARGIN + 3;
  drawTestTubeIcon(doc, MARGIN, y);

  doc.setFont(FONT, "bold");
  doc.setFontSize(22);
  textColor(doc, WHITE);
  doc.text("HotSpot", MARGIN + 12, y + 9);

  doc.setFont(FONT, "normal");
  doc.setFontSize(11);
  textColor(doc, GRAY);
  doc.text("Aylık Rapor", MARGIN + 12, y + 15.5);

  y += 22;
  doc.setFont(FONT, "bold");
  doc.setFontSize(13);
  textColor(doc, GREEN);
  doc.text(`${monthLabel} ${year}`, PAGE_W / 2, y, { align: "center" });

  y += 6;
  drawColor(doc, BORDER);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);

  return y + 9;
}

// ── Özet kartları ─────────────────────────────────────────────────────────────

function drawSummaryCards(doc: jsPDF, y: number, cards: { label: string; value: string; color: string }[]): number {
  const gap = 6;
  const cardW = (CONTENT_W - gap) / 2;
  const cardH = 24;

  cards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = MARGIN + col * (cardW + gap);
    const cy = y + row * (cardH + gap);

    fill(doc, CARD_BG);
    doc.roundedRect(cx, cy, cardW, cardH, 2, 2, "F");

    doc.setFont(FONT, "normal");
    doc.setFontSize(8);
    textColor(doc, GRAY);
    doc.text(card.label.toUpperCase(), cx + 5, cy + 8);

    doc.setFont(FONT, "bold");
    doc.setFontSize(15);
    textColor(doc, card.color);
    doc.text(card.value, cx + 5, cy + 18);
  });

  const rows = Math.ceil(cards.length / 2);
  return y + rows * (cardH + gap) + 2;
}

// ── Gelir vs hedef ────────────────────────────────────────────────────────────

function drawIncomeVsTarget(doc: jsPDF, y: number, monthLabel: string, income: number, target: number): number {
  const cardH = target > 0 ? 30 : 22;
  y = ensureSpace(doc, y, cardH + 8);

  fill(doc, CARD_BG);
  doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 2, 2, "F");

  doc.setFont(FONT, "normal");
  doc.setFontSize(8);
  textColor(doc, GRAY);
  doc.text(`${monthLabel.toUpperCase()} GELİRİ`, MARGIN + 6, y + 9);

  doc.setFont(FONT, "bold");
  doc.setFontSize(16);
  textColor(doc, WHITE);
  doc.text(formatCurrency(income), MARGIN + 6, y + 19);

  if (target > 0) {
    const pct = Math.min((income / target) * 100, 100);
    doc.setFont(FONT, "normal");
    doc.setFontSize(9);
    textColor(doc, GRAY);
    doc.text(`Hedef maaş: ${formatCurrency(target)}`, MARGIN + 6, y + 25);

    doc.setFont(FONT, "bold");
    doc.setFontSize(11);
    textColor(doc, income >= target ? GREEN : GRAY);
    doc.text(`%${Math.round(pct)}`, PAGE_W - MARGIN - 6, y + 19, { align: "right" });

    const barX = MARGIN + 6;
    const barY = y + cardH - 4;
    const barW = CONTENT_W - 12;
    fill(doc, BORDER);
    doc.roundedRect(barX, barY, barW, 2, 1, 1, "F");
    fill(doc, GREEN);
    doc.roundedRect(barX, barY, Math.max(2, (barW * pct) / 100), 2, 1, 1, "F");
  }

  return y + cardH + 9;
}

// ── Ana fonksiyon ─────────────────────────────────────────────────────────────

function registerFont(doc: jsPDF) {
  doc.addFileToVFS("NotoSans-Regular.ttf", NOTO_SANS_REGULAR_BASE64);
  doc.addFont("NotoSans-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("NotoSans-Bold.ttf", NOTO_SANS_BOLD_BASE64);
  doc.addFont("NotoSans-Bold.ttf", FONT, "bold");
  doc.setFont(FONT, "normal");
}

function addFooters(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont(FONT, "normal");
    doc.setFontSize(7.5);
    textColor(doc, GRAY);
    doc.text(
      "Bu rapor HotSpot tarafından oluşturulmuştur. Finansal tavsiye değildir.",
      PAGE_W / 2,
      PAGE_H - 11,
      { align: "center" }
    );
    doc.text(`Sayfa ${i} / ${total}`, PAGE_W / 2, PAGE_H - 6, { align: "center" });
  }
}

export function generateMonthlyReport(data: ReportData): void {
  const { year, month, settings, txns, subscriptions, goals } = data;

  const state = deriveState(txns, settings);
  const monthIncome = getMonthIncome(txns, year, month);
  const monthTxns = txns
    .filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const activeGoals = goals.filter((g) => !g.archivedAt);

  const monthLabelRaw = new Date(year, month, 1).toLocaleDateString("tr-TR", { month: "long" });
  const monthLabel = monthLabelRaw.charAt(0).toUpperCase() + monthLabelRaw.slice(1);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registerFont(doc);
  drawPageBackground(doc);

  let y = drawHeader(doc, monthLabel, year);

  // Özet kartları
  const runwayInfinite = !isFinite(state.runwayMonths);
  const runwayColor = runwayInfinite ? GREEN : state.runwayMonths < 1 ? RED : AMBER;
  const runwayValue = runwayInfinite ? "Sınırsız" : `${formatMonths(state.runwayMonths)} ay`;
  y = drawSummaryCards(doc, y, [
    { label: "Kazandan Alınabilir", value: formatCurrency(state.safeToSpend), color: GREEN },
    { label: "İksir Havuzu", value: formatCurrency(state.buffer), color: WHITE },
    { label: "Vergi Kenarı", value: formatCurrency(state.taxReserve), color: WHITE },
    { label: "Dayanma Süresi", value: runwayValue, color: runwayColor },
  ]);

  // Gelir vs hedef
  y = drawIncomeVsTarget(doc, y, monthLabel, monthIncome, settings.targetSalary);

  // İşlem geçmişi
  y = sectionTitle(doc, y, "İşlem Geçmişi", `${monthLabel} ${year} · ${monthTxns.length} işlem`);
  if (monthTxns.length === 0) {
    y = emptyRow(doc, y, "Bu ay işlem kaydedilmedi.");
  } else {
    y = drawTable(
      doc,
      y,
      [
        { header: "Tarih", width: 26 },
        { header: "Tür", width: 22 },
        { header: "Tutar", width: 36, align: "right" },
        { header: "Kaynak", width: CONTENT_W - 26 - 22 - 36 },
      ],
      monthTxns.map((t) => ({
        cells: [
          new Date(t.date).toLocaleDateString("tr-TR"),
          TYPE_LABEL[t.type],
          `${TYPE_SIGN[t.type]}${formatCurrency(t.amount)}`,
          t.source || t.note || "—",
        ],
        colors: [WHITE, GRAY, TYPE_COLOR[t.type], GRAY],
      }))
    );
  }
  y += 6;

  // Abonelikler
  y = sectionTitle(doc, y, "Abonelikler");
  if (subscriptions.length === 0) {
    y = emptyRow(doc, y, "Henüz abonelik eklenmedi.");
  } else {
    y = drawTable(
      doc,
      y,
      [
        { header: "İsim", width: 110 },
        { header: "Aylık Tutar", width: CONTENT_W - 110, align: "right" },
      ],
      subscriptions.map((s) => {
        const monthly = s.period === "monthly" ? s.amount : s.amount / 12;
        return { cells: [s.name, `${formatCurrency(monthly)}/ay`] };
      })
    );
  }
  y += 6;

  // Hedefler
  y = sectionTitle(doc, y, "Aktif Hedefler");
  if (activeGoals.length === 0) {
    y = emptyRow(doc, y, "Aktif hedef yok.");
  } else {
    y = drawTable(
      doc,
      y,
      [
        { header: "Hedef", width: 62 },
        { header: "Hedef Tutar", width: 40, align: "right" },
        { header: "Mevcut", width: 40, align: "right" },
        { header: "Yüzde", width: CONTENT_W - 62 - 40 - 40, align: "right" },
      ],
      activeGoals.map((g) => ({
        cells: [
          g.name,
          formatCurrency(g.targetAmount),
          formatCurrency(g.currentAmount),
          `%${Math.round(goalProgress(g))}`,
        ],
        colors: [WHITE, GRAY, GRAY, goalProgress(g) >= 100 ? GREEN : WHITE],
      }))
    );
  }

  addFooters(doc);

  const fileMonth = monthLabel.replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g");
  doc.save(`HotSpot-Rapor-${fileMonth}-${year}.pdf`);
}
