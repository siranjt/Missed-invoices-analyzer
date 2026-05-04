"use client";
import { Download } from "lucide-react";
import type { InvoiceRow, AnnotationsMap } from "@/lib/types";

const HEADERS_BASE = [
  "Customer Id","Entity Id","Biz name","Am name","Subscription status","Cancelling at",
  "Invoice Number","ACH status","Auto debit","AM Comment","Invoice Date",
  "Customer First Name","Customer Email","Phone Number","Customer Company","Amount Due",
  "Ticket Id","Ticket Title","Ticket URL"
];
const HEADERS_EXTRA = ["Caller","Connection status","Comments","Old comments"];

const HEADER_STYLE = {
  font: { name: "Arial", sz: 11, bold: true, color: { rgb: "FFFFFFFF" } },
  fill: { fgColor: { rgb: "FF1F0843" }, patternType: "solid" },
  alignment: { horizontal: "center", vertical: "center" }
};

function rowToBase(r: InvoiceRow, ann: any) {
  return [
    r.customerId, r.entityId, r.bizName, r.amName, r.subscriptionStatus, r.cancellingAt,
    r.invoiceNumber, r.achStatus, r.autoDebit, ann?.amComment || "", r.invoiceDate,
    r.customerFirstName, r.customerEmail, r.phoneNumber, r.customerCompany, r.amountDue,
    r.latestTicket?.id || "",
    r.latestTicket?.title || "",
    r.latestTicket?.url || ""
  ];
}
function rowToExtra(ann: any) {
  return [ann?.caller || "", ann?.connectionStatus || "", ann?.comments || "", ann?.oldComments || ""];
}

function styleSheet(XLSX: any, ws: any, headerLen: number, extraStart?: number) {
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let c = 0; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = HEADER_STYLE;
  }
  if (extraStart != null) {
    for (let r = 1; r <= range.e.r; r++) {
      const callerCell = ws[XLSX.utils.encode_cell({ r, c: extraStart })];
      if (callerCell?.v === "Shakthi") {
        callerCell.s = { font: { color: { rgb: "FF9C0006" }, bold: true }, fill: { fgColor: { rgb: "FFFCE4E4" }, patternType: "solid" } };
      } else if (callerCell?.v === "Joshi") {
        callerCell.s = { font: { color: { rgb: "FF006100" }, bold: true }, fill: { fgColor: { rgb: "FFE2EFDA" }, patternType: "solid" } };
      }
      const connCell = ws[XLSX.utils.encode_cell({ r, c: extraStart + 1 })];
      if (connCell?.v === "Connected") {
        connCell.s = { font: { color: { rgb: "FF006100" }, bold: true }, fill: { fgColor: { rgb: "FFE2EFDA" }, patternType: "solid" } };
      } else if (connCell?.v === "VM") {
        connCell.s = { font: { color: { rgb: "FF1F3864" }, bold: true }, fill: { fgColor: { rgb: "FFD9E2F3" }, patternType: "solid" } };
      } else if (connCell?.v === "Not connected") {
        connCell.s = { font: { color: { rgb: "FF9C0006" }, bold: true }, fill: { fgColor: { rgb: "FFFCE4E4" }, patternType: "solid" } };
      }
    }
  }
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  ws["!autofilter"] = { ref: ws["!ref"] };
  ws["!cols"] = Array(headerLen).fill({ wch: 18 });
}

function ordinal(n: number) {
  const s = ["th","st","nd","rd"], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

export default function ExportButton({
  rows,
  annotations,
  multiMonthSet
}: { rows: InvoiceRow[]; annotations: AnnotationsMap; multiMonthSet: Set<string> }) {
  async function onExport() {
    const XLSX: any = await import("xlsx-js-style");
    const wb = XLSX.utils.book_new();

    // Main: all rows
    const allBase = [HEADERS_BASE, ...rows.map((r) => rowToBase(r, annotations[r.invoiceNumber]))];
    const wsAll = XLSX.utils.aoa_to_sheet(allBase);
    styleSheet(XLSX, wsAll, HEADERS_BASE.length);
    XLSX.utils.book_append_sheet(wb, wsAll, "Miss-payment Sheet");

    // Per-month base sheets (no annotations)
    const months = ["May", "April", "March"];
    for (const m of months) {
      const mr = rows.filter((r) => r.invoiceMonth === m);
      const data = [HEADERS_BASE, ...mr.map((r) => rowToBase(r, annotations[r.invoiceNumber]))];
      const ws = XLSX.utils.aoa_to_sheet(data);
      styleSheet(XLSX, ws, HEADERS_BASE.length);
      XLSX.utils.book_append_sheet(wb, ws, m);
    }

    // Per-month date-stamped (with annotations)
    const today = new Date();
    for (const m of months) {
      const mr = rows.filter((r) => r.invoiceMonth === m);
      const data = [
        [...HEADERS_BASE, ...HEADERS_EXTRA],
        ...mr.map((r) => [...rowToBase(r, annotations[r.invoiceNumber]), ...rowToExtra(annotations[r.invoiceNumber])])
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      styleSheet(XLSX, ws, HEADERS_BASE.length + HEADERS_EXTRA.length, HEADERS_BASE.length);
      XLSX.utils.book_append_sheet(wb, ws, `${m.slice(0, 8)} ${ordinal(today.getDate())} ${today.getFullYear()}`.slice(0, 31));
    }

    // Multi-month
    const multiRows = rows.filter((r) => multiMonthSet.has(r.entityId || r.customerId));
    const multiData = [
      [...HEADERS_BASE, ...HEADERS_EXTRA],
      ...multiRows.map((r) => [...rowToBase(r, annotations[r.invoiceNumber]), ...rowToExtra(annotations[r.invoiceNumber])])
    ];
    const wsMulti = XLSX.utils.aoa_to_sheet(multiData);
    styleSheet(XLSX, wsMulti, HEADERS_BASE.length + HEADERS_EXTRA.length, HEADERS_BASE.length);
    XLSX.utils.book_append_sheet(wb, wsMulti, `Multi-month ${ordinal(today.getDate())} ${today.getFullYear()}`.slice(0, 31));

    XLSX.writeFile(wb, `missed-payments-${today.toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <button onClick={onExport} className="btn-ghost">
      <Download size={14} />
      Export Excel
    </button>
  );
}
