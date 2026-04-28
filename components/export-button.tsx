"use client";
import { Download } from "lucide-react";
import type { InvoiceRow, AnnotationsMap } from "@/lib/types";

const HEADERS_BASE = [
  "Customer Id","Entity Id","Biz name","Am name","Subscription status","Cancelling at",
  "Invoice Number","ACH status","Auto debit","AM Comment","Invoice Date",
  "Customer First Name","Customer Email","Phone Number","Customer Company","Amount Due"
];
const HEADERS_EXTRA = ["Caller","Connection status","Comments","Old comments","Tickets"];

const HEADER_STYLE = {
  font: { name: "Arial", sz: 11, bold: true, color: { rgb: "FFFFFFFF" } },
  fill: { fgColor: { rgb: "FF1F0843" }, patternType: "solid" },
  alignment: { horizontal: "center", vertical: "center" }
};

// Soft pink tint matching the HTML multi-month row background (~ rgba(255,168,205,0.08)).
// Excel needs a solid color, so this is a pre-blended approximation.
const MULTI_MONTH_TINT = {
  fill: { fgColor: { rgb: "FFFFE6F0" }, patternType: "solid" }
};

const CALLER_STYLES: Record<string, any> = {
  Shakthi: { font: { color: { rgb: "FF9C0006" }, bold: true }, fill: { fgColor: { rgb: "FFFCE4E4" }, patternType: "solid" } },
  Joshi: { font: { color: { rgb: "FF006100" }, bold: true }, fill: { fgColor: { rgb: "FFE2EFDA" }, patternType: "solid" } }
};
const CONN_STYLES: Record<string, any> = {
  Connected: { font: { color: { rgb: "FF006100" }, bold: true }, fill: { fgColor: { rgb: "FFE2EFDA" }, patternType: "solid" } },
  VM: { font: { color: { rgb: "FF1F3864" }, bold: true }, fill: { fgColor: { rgb: "FFD9E2F3" }, patternType: "solid" } },
  "Not connected": { font: { color: { rgb: "FF9C0006" }, bold: true }, fill: { fgColor: { rgb: "FFFCE4E4" }, patternType: "solid" } }
};

function rowToBase(r: InvoiceRow, ann: any) {
  return [
    r.customerId, r.entityId, r.bizName, r.amName, r.subscriptionStatus, r.cancellingAt,
    r.invoiceNumber, r.achStatus, r.autoDebit, ann?.amComment || "", r.invoiceDate,
    r.customerFirstName, r.customerEmail, r.phoneNumber, r.customerCompany, r.amountDue
  ];
}
function rowToExtra(ann: any) {
  return [ann?.caller || "", ann?.connectionStatus || "", ann?.comments || "", ann?.oldComments || "", ann?.tickets || ""];
}

/** Indices (Excel row number, 1-based, header is row 0) of multi-month rows. */
function multiMonthIndicesFor(source: InvoiceRow[], multiMonthSet: Set<string>): Set<number> {
  const idx = new Set<number>();
  source.forEach((r, i) => {
    const key = r.entityId || r.customerId;
    if (key && multiMonthSet.has(key)) idx.add(i + 1);
  });
  return idx;
}

function styleSheet(
  XLSX: any,
  ws: any,
  headerLen: number,
  opts: { extraStart?: number; multiMonthRowIndices?: Set<number> } = {}
) {
  const range = XLSX.utils.decode_range(ws["!ref"]);

  // Header
  for (let c = 0; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = HEADER_STYLE;
  }

  // Multi-month tint as a base layer across the whole row.
  if (opts.multiMonthRowIndices && opts.multiMonthRowIndices.size > 0) {
    for (const r of opts.multiMonthRowIndices) {
      for (let c = 0; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (cell) cell.s = MULTI_MONTH_TINT;
      }
    }
  }

  // Caller / Connection per-cell styling — overrides the tint where applicable.
  if (opts.extraStart != null) {
    const extraStart = opts.extraStart;
    for (let r = 1; r <= range.e.r; r++) {
      const callerCell = ws[XLSX.utils.encode_cell({ r, c: extraStart })];
      const callerStyle = callerCell ? CALLER_STYLES[callerCell.v as string] : undefined;
      if (callerCell && callerStyle) callerCell.s = callerStyle;

      const connCell = ws[XLSX.utils.encode_cell({ r, c: extraStart + 1 })];
      const connStyle = connCell ? CONN_STYLES[connCell.v as string] : undefined;
      if (connCell && connStyle) connCell.s = connStyle;
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

    // Main sheet — all rows.
    const allBase = [HEADERS_BASE, ...rows.map((r) => rowToBase(r, annotations[r.invoiceNumber]))];
    const wsAll = XLSX.utils.aoa_to_sheet(allBase);
    styleSheet(XLSX, wsAll, HEADERS_BASE.length, {
      multiMonthRowIndices: multiMonthIndicesFor(rows, multiMonthSet)
    });
    XLSX.utils.book_append_sheet(wb, wsAll, "Miss-payment Sheet");

    // Monthly sheets (16 cols, no annotations).
    const months = ["April", "March", "February"];
    for (const m of months) {
      const mr = rows.filter((r) => r.invoiceMonth === m);
      const data = [HEADERS_BASE, ...mr.map((r) => rowToBase(r, annotations[r.invoiceNumber]))];
      const ws = XLSX.utils.aoa_to_sheet(data);
      styleSheet(XLSX, ws, HEADERS_BASE.length, {
        multiMonthRowIndices: multiMonthIndicesFor(mr, multiMonthSet)
      });
      XLSX.utils.book_append_sheet(wb, ws, m);
    }

    // Date-stamped sheets (21 cols with annotations).
    const today = new Date();
    for (const m of months) {
      const mr = rows.filter((r) => r.invoiceMonth === m);
      const data = [
        [...HEADERS_BASE, ...HEADERS_EXTRA],
        ...mr.map((r) => [...rowToBase(r, annotations[r.invoiceNumber]), ...rowToExtra(annotations[r.invoiceNumber])])
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      styleSheet(XLSX, ws, HEADERS_BASE.length + HEADERS_EXTRA.length, {
        extraStart: HEADERS_BASE.length,
        multiMonthRowIndices: multiMonthIndicesFor(mr, multiMonthSet)
      });
      XLSX.utils.book_append_sheet(wb, ws, `${m.slice(0, 8)} ${ordinal(today.getDate())} ${today.getFullYear()}`.slice(0, 31));
    }

    // Multi-month customers (every row is multi-month — tint applies to all).
    const multiRows = rows.filter((r) => multiMonthSet.has(r.entityId || r.customerId));
    const multiData = [
      [...HEADERS_BASE, ...HEADERS_EXTRA],
      ...multiRows.map((r) => [...rowToBase(r, annotations[r.invoiceNumber]), ...rowToExtra(annotations[r.invoiceNumber])])
    ];
    const wsMulti = XLSX.utils.aoa_to_sheet(multiData);
    styleSheet(XLSX, wsMulti, HEADERS_BASE.length + HEADERS_EXTRA.length, {
      extraStart: HEADERS_BASE.length,
      multiMonthRowIndices: multiMonthIndicesFor(multiRows, multiMonthSet)
    });
    XLSX.utils.book_append_sheet(wb, wsMulti, `Multi-month ${ordinal(today.getDate())} ${today.getFullYear()}`.slice(0, 31));

    XLSX.writeFile(wb, `missed-payments-${today.toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <button onClick={onExport} className="btn-zoca">
      <Download size={14} />
      Export Excel
    </button>
  );
}
