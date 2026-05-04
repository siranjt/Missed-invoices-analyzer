"use client";
import { Download } from "lucide-react";
import type { InvoiceRow, AnnotationsMap } from "@/lib/types";

// Column order — same on every sheet so users see consistent shape.
// Position 21 is intentionally a blank-header spacer column.
const HEADERS = [
  "Customer Id",
  "Entity Id",
  "Biz name",
  "Am name",
  "Subscription status",
  "Cancelling at",
  "Invoice Number",
  "ACH status",
  "Auto debit",
  "AM Comment",
  "Invoice Date",
  "Customer First Name",
  "Customer Email",
  "Phone Number",
  "Customer Company",
  "Amount Due",
  "Caller",
  "Connection status",
  "Comments",
  "Old comments",
  "",
  "Ticket URL"
];

// Column index lookups so styling stays correct if order ever changes.
const COL = {
  caller: HEADERS.indexOf("Caller"),
  conn: HEADERS.indexOf("Connection status")
};

const HEADER_STYLE = {
  font: { name: "Arial", sz: 11, bold: true, color: { rgb: "FFFFFFFF" } },
  fill: { fgColor: { rgb: "FF1F0843" }, patternType: "solid" },
  alignment: { horizontal: "center", vertical: "center" }
};

function rowValues(r: InvoiceRow, ann: any) {
  return [
    r.customerId,                     // Customer Id
    r.entityId,                       // Entity Id
    r.bizName,                        // Biz name
    r.amName,                         // Am name
    r.subscriptionStatus,             // Subscription status
    r.cancellingAt,                   // Cancelling at
    r.invoiceNumber,                  // Invoice Number
    r.achStatus,                      // ACH status
    r.autoDebit,                      // Auto debit
    ann?.amComment || "",             // AM Comment
    r.invoiceDate,                    // Invoice Date
    r.customerFirstName,              // Customer First Name
    r.customerEmail,                  // Customer Email
    r.phoneNumber,                    // Phone Number
    r.customerCompany,                // Customer Company
    r.amountDue,                      // Amount Due
    ann?.caller || "",                // Caller
    ann?.connectionStatus || "",      // Connection status
    ann?.comments || "",              // Comments
    ann?.oldComments || "",           // Old comments
    "",                               // (blank spacer column)
    r.latestTicket?.url || ""         // Ticket URL
  ];
}

function styleSheet(XLSX: any, ws: any) {
  const range = XLSX.utils.decode_range(ws["!ref"]);

  // Header style
  for (let c = 0; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = HEADER_STYLE;
  }

  // Conditional Caller / Connection styling
  for (let r = 1; r <= range.e.r; r++) {
    const callerCell = ws[XLSX.utils.encode_cell({ r, c: COL.caller })];
    if (callerCell?.v === "Shakthi") {
      callerCell.s = { font: { color: { rgb: "FF9C0006" }, bold: true }, fill: { fgColor: { rgb: "FFFCE4E4" }, patternType: "solid" } };
    } else if (callerCell?.v === "Joshi") {
      callerCell.s = { font: { color: { rgb: "FF006100" }, bold: true }, fill: { fgColor: { rgb: "FFE2EFDA" }, patternType: "solid" } };
    }
    const connCell = ws[XLSX.utils.encode_cell({ r, c: COL.conn })];
    if (connCell?.v === "Connected") {
      connCell.s = { font: { color: { rgb: "FF006100" }, bold: true }, fill: { fgColor: { rgb: "FFE2EFDA" }, patternType: "solid" } };
    } else if (connCell?.v === "VM") {
      connCell.s = { font: { color: { rgb: "FF1F3864" }, bold: true }, fill: { fgColor: { rgb: "FFD9E2F3" }, patternType: "solid" } };
    } else if (connCell?.v === "Not connected") {
      connCell.s = { font: { color: { rgb: "FF9C0006" }, bold: true }, fill: { fgColor: { rgb: "FFFCE4E4" }, patternType: "solid" } };
    }
  }

  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  ws["!autofilter"] = { ref: ws["!ref"] };
  ws["!cols"] = HEADERS.map((h) => {
    if (h === "Customer Email" || h === "Biz name" || h === "Customer Company") return { wch: 30 };
    if (h === "Ticket URL") return { wch: 60 };
    if (h === "Comments" || h === "Old comments" || h === "AM Comment") return { wch: 25 };
    if (h === "") return { wch: 4 };
    return { wch: 18 };
  });
}

function ordinal(n: number) {
  const s = ["th","st","nd","rd"], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

function buildSheet(XLSX: any, rows: InvoiceRow[], annotations: AnnotationsMap) {
  const data = [HEADERS, ...rows.map((r) => rowValues(r, annotations[r.invoiceNumber]))];
  const ws = XLSX.utils.aoa_to_sheet(data);
  styleSheet(XLSX, ws);
  return ws;
}

export default function ExportButton({
  rows,
  annotations,
  multiMonthSet
}: { rows: InvoiceRow[]; annotations: AnnotationsMap; multiMonthSet: Set<string> }) {
  async function onExport() {
    const XLSX: any = await import("xlsx-js-style");
    const wb = XLSX.utils.book_new();

    // Main sheet
    XLSX.utils.book_append_sheet(wb, buildSheet(XLSX, rows, annotations), "Miss-payment Sheet");

    // Per-month base sheets
    const months = ["May", "April", "March"];
    for (const m of months) {
      const mr = rows.filter((r) => r.invoiceMonth === m);
      XLSX.utils.book_append_sheet(wb, buildSheet(XLSX, mr, annotations), m);
    }

    // Per-month date-stamped sheets
    const today = new Date();
    const stampSuffix = `${ordinal(today.getDate())} ${today.getFullYear()}`;
    for (const m of months) {
      const mr = rows.filter((r) => r.invoiceMonth === m);
      const tabName = `${m.slice(0, 8)} ${stampSuffix}`.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, buildSheet(XLSX, mr, annotations), tabName);
    }

    // Multi-month
    const multiRows = rows.filter((r) => multiMonthSet.has(r.entityId || r.customerId));
    const multiName = `Multi-month ${stampSuffix}`.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, buildSheet(XLSX, multiRows, annotations), multiName);

    XLSX.writeFile(wb, `missed-payments-${today.toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <button onClick={onExport} className="btn-ghost">
      <Download size={14} />
      Export Excel
    </button>
  );
}
