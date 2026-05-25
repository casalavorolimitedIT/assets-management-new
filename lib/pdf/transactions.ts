/**
 * PDF generation utilities for Casalavoro transaction statements and receipts.
 * Uses jsPDF + jspdf-autotable — both are client-side only.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Brand constants ──────────────────────────────────────────────────────────
const BRAND_ORANGE = [255, 105, 0] as [number, number, number];
const BRAND_DARK = [24, 24, 27] as [number, number, number];
const GRAY_100 = [244, 244, 245] as [number, number, number];
const GRAY_400 = [161, 161, 170] as [number, number, number];
const GRAY_700 = [63, 63, 70] as [number, number, number];

// ─── Shared types ─────────────────────────────────────────────────────────────
export interface TxForPdf {
  id: string;
  plan: string;
  type: string;
  amount: number | string;
  amount_words?: string;
  tenor?: string;
  status: string;
  description: string;
  mode_of_payment?: string;
  mode_of_interest?: string;
  created_at: string;
  updated_at: string;
  // admin-only
  investorName?: string;
  investorEmail?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => {
  const formatted = new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
  return `NGN ${formatted}`;
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const fmtDateTime = (s: string) =>
  new Date(s).toLocaleString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const capitalize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

const toAmount = (amount: number | string) => Number(amount) || 0;

const isDebitType = (type: string) =>
  ["debit", "withdrawal"].includes(type.toLowerCase());

const isCreditType = (type: string) =>
  ["investment", "payout", "return", "credit"].includes(type.toLowerCase());

const signedAmount = (tx: TxForPdf) => {
  const amount = toAmount(tx.amount);
  return isDebitType(tx.type) ? -amount : amount;
};

const fmtSigned = (tx: TxForPdf) => {
  const amount = toAmount(tx.amount);
  const sign = isDebitType(tx.type) ? "-" : isCreditType(tx.type) ? "+" : "";
  return `${sign}${fmt(amount)}`;
};

const transactionDirection = (type: string) =>
  isDebitType(type) ? "Debit" : isCreditType(type) ? "Credit" : "Neutral";

const receiptTitle = (type: string) => {
  if (isDebitType(type)) return "Debit Receipt";
  if (type.toLowerCase() === "payout") return "Payout Receipt";
  if (isCreditType(type)) return "Payment Receipt";
  return "Transaction Receipt";
};

const planLabel = (plan: string) => {
  const map: Record<string, string> = {
    premium_plus: "Premium Plus",
    premium: "Premium",
    reif: "REIF",
  };
  return map[plan] ?? capitalize(plan.replace(/_/g, " "));
};

// ─── Shared header painter ────────────────────────────────────────────────────
function paintHeader(doc: jsPDF, title: string, subtitle: string) {
  const W = doc.internal.pageSize.getWidth();

  // Orange top bar
  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, 0, W, 18, "F");

  // Company name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("CASALAVORO LIMITED", 14, 12);

  // Document title block
  doc.setFillColor(...BRAND_DARK);
  doc.rect(0, 18, W, 22, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(title, 14, 31);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_400);
  doc.text(subtitle, 14, 37);

  // Generated timestamp (right-aligned)
  doc.setFontSize(7);
  doc.setTextColor(...GRAY_400);
  const ts = `Generated: ${fmtDateTime(new Date().toISOString())}`;
  doc.text(ts, W - 14, 37, { align: "right" });
}

// ─── Shared footer painter ────────────────────────────────────────────────────
function paintFooter(doc: jsPDF) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();

  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...GRAY_100);
    doc.setLineWidth(0.3);
    doc.line(14, H - 14, W - 14, H - 14);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_400);
    doc.text("Casalavoro Limited · TAJ Bank · 0005041005", 14, H - 8);
    doc.text(`Page ${i} of ${pages}`, W - 14, H - 8, { align: "right" });
  }
}

// ─── Info grid painter (key-value pairs) ─────────────────────────────────────
function paintInfoGrid(
  doc: jsPDF,
  startY: number,
  pairs: { label: string; value: string }[],
  columns = 2,
): number {
  const W = doc.internal.pageSize.getWidth();
  const colW = (W - 28) / columns;
  let x = 14;
  let y = startY;
  const rowH = 12;

  pairs.forEach((pair, i) => {
    if (i > 0 && i % columns === 0) {
      y += rowH;
      x = 14;
    }

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_400);
    doc.text(pair.label.toUpperCase(), x, y);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GRAY_700);
    doc.text(pair.value || "—", x, y + 4.5);

    x += colW;
  });

  return y + rowH;
}

// ─── 1. STATEMENT ─────────────────────────────────────────────────────────────
export function generateStatement(
  transactions: TxForPdf[],
  ownerName: string,
  isAdmin: boolean,
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  const subtitle = isAdmin
    ? `All investor transactions · ${transactions.length} record${transactions.length !== 1 ? "s" : ""}`
    : `Investment statement for ${ownerName} · ${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`;

  paintHeader(doc, "Transaction Statement", subtitle);

  // Summary box
  const totalCredits = transactions
    .filter((t) => isCreditType(t.type))
    .reduce((s, t) => s + toAmount(t.amount), 0);
  const totalDebits = transactions
    .filter((t) => isDebitType(t.type))
    .reduce((s, t) => s + toAmount(t.amount), 0);
  const netTotal = transactions.reduce((s, t) => s + signedAmount(t), 0);
  let y = 50;

  doc.setFillColor(...GRAY_100);
  doc.roundedRect(14, y, W - 28, 22, 3, 3, "F");

  const summaryPairs = [
    { label: "Credits", value: fmt(totalCredits) },
    { label: "Debits", value: fmt(totalDebits) },
    { label: "Net Total", value: fmt(netTotal) },
    { label: "Total Records", value: transactions.length.toString() },
  ];

  y += 6;
  const colW = (W - 28) / 4;
  summaryPairs.forEach((p, i) => {
    const cx = 14 + i * colW + colW / 2;
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_400);
    doc.text(p.label.toUpperCase(), cx, y, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_DARK);
    doc.text(p.value, cx, y + 7, { align: "center" });
  });

  y += 30;

  // Table
  const head = isAdmin
    ? [["Date", "Investor", "Description", "Plan", "Amount", "Status"]]
    : [["Date", "Description", "Type", "Plan", "Amount", "Status"]];

  const body = transactions.map((tx) =>
    isAdmin
      ? [
          fmtDate(tx.created_at),
          tx.investorName ?? "—",
          tx.description,
          `${planLabel(tx.plan)} · ${transactionDirection(tx.type)}`,
          fmtSigned(tx),
          capitalize(tx.status),
        ]
      : [
          fmtDate(tx.created_at),
          tx.description,
          capitalize(tx.type),
          planLabel(tx.plan),
          fmtSigned(tx),
          capitalize(tx.status),
        ],
  );

  autoTable(doc, {
    startY: y,
    head,
    body,
    headStyles: {
      fillColor: BRAND_DARK,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: GRAY_700 },
    alternateRowStyles: { fillColor: GRAY_100 },
    columnStyles: isAdmin
      ? { 4: { halign: "right", fontStyle: "bold" } }
      : { 4: { halign: "right", fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
    tableLineColor: [229, 229, 234],
    tableLineWidth: 0.2,
  });

  paintFooter(doc);

  const filename = isAdmin
    ? `casalavoro-all-transactions-${Date.now()}.pdf`
    : `casalavoro-statement-${ownerName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`;

  doc.save(filename);
}

// ─── 2. RECEIPT ───────────────────────────────────────────────────────────────
export function generateReceipt(tx: TxForPdf, ownerName: string): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const direction = transactionDirection(tx.type);
  const amountColor = isDebitType(tx.type)
    ? ([220, 38, 38] as [number, number, number])
    : isCreditType(tx.type)
      ? ([16, 185, 129] as [number, number, number])
      : BRAND_DARK;

  paintHeader(doc, receiptTitle(tx.type), `Receipt for ${ownerName}`);

  let y = 52;

  // Receipt ID banner
  doc.setFillColor(...BRAND_ORANGE);
  doc.roundedRect(14, y, W - 28, 10, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(
    `RECEIPT NO: ${tx.id.slice(0, 8).toUpperCase()}`,
    W / 2,
    y + 6.5,
    { align: "center" },
  );

  y += 16;

  // Amount hero
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...amountColor);
  doc.text(fmtSigned(tx), W / 2, y + 10, { align: "center" });

  if (tx.amount_words) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...GRAY_400);
    doc.text(tx.amount_words, W / 2, y + 17, { align: "center" });
    y += 6;
  }

  y += 26;

  // Divider
  doc.setDrawColor(...GRAY_100);
  doc.setLineWidth(0.4);
  doc.line(14, y, W - 14, y);
  y += 8;

  // Detail grid
  const pairs: { label: string; value: string }[] = [
    { label: "Investor Name", value: ownerName },
    { label: "Date", value: fmtDateTime(tx.created_at) },
    { label: "Plan", value: planLabel(tx.plan) },
    { label: "Status", value: capitalize(tx.status) },
    { label: "Transaction Type", value: capitalize(tx.type) },
    { label: "Direction", value: direction },
    { label: "Tenor", value: tx.tenor ?? "—" },
  ];

  if (tx.mode_of_payment) {
    pairs.push({ label: "Mode of Payment", value: tx.mode_of_payment });
  }
  if (tx.mode_of_interest) {
    pairs.push({
      label: "Mode of Interest",
      value: tx.mode_of_interest,
    });
  }
  if (tx.investorEmail) {
    pairs.push({ label: "Email", value: tx.investorEmail });
  }
  if (tx.description) {
    pairs.push({ label: "Description", value: tx.description });
  }

  y = paintInfoGrid(doc, y, pairs, 2);

  y += 6;

  // Status stamp
  const statusColor: Record<string, [number, number, number]> = {
    active: [16, 185, 129],
    completed: [16, 185, 129],
    pending: [245, 158, 11],
    failed: [239, 68, 68],
  };
  const sc = statusColor[tx.status] ?? GRAY_400;

  doc.setDrawColor(...sc);
  doc.setLineWidth(1.2);
  doc.roundedRect(W / 2 - 22, y, 44, 14, 3, 3);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...sc);
  doc.text(tx.status.toUpperCase(), W / 2, y + 9, { align: "center" });

  y += 22;

  // Bank details box
  doc.setFillColor(...GRAY_100);
  doc.roundedRect(14, y, W - 28, 28, 3, 3, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY_400);
  doc.text(
    `${direction.toUpperCase()} DETAILS — CASALAVORO LIMITED`,
    14 + (W - 28) / 2,
    y + 7,
    { align: "center" },
  );

  const bankPairs = [
    { label: "Bank", value: "TAJ Bank" },
    { label: "Account Name", value: "Casalavoro Limited" },
    { label: "Account Number", value: "0005041005" },
  ];

  let bx = 14 + 10;
  const bColW = (W - 28 - 20) / 3;
  bankPairs.forEach((p) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_400);
    doc.text(p.label.toUpperCase(), bx, y + 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND_DARK);
    doc.text(p.value, bx, y + 20);
    bx += bColW;
  });

  paintFooter(doc);

  doc.save(
    `casalavoro-receipt-${tx.id.slice(0, 8).toUpperCase()}-${Date.now()}.pdf`,
  );
}
