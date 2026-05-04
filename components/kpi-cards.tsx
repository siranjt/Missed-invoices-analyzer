"use client";
import type { InvoiceRow, AnnotationsMap } from "@/lib/types";

function fmtUsd(n: number) {
  return "$" + Math.round(n).toLocaleString();
}
function fmtNum(n: number) {
  return n.toLocaleString();
}

export default function KpiCards({
  rows,
  multiMonthSet,
  annotations
}: {
  rows: InvoiceRow[];
  multiMonthSet: Set<string>;
  annotations?: AnnotationsMap;
}) {
  const outstanding = rows.reduce((s, r) => s + (r.amountDue || 0), 0);
  const customers = new Set(rows.map((r) => r.customerId)).size;
  const ach = rows.filter((r) => r.achStatus === "In Progress").length;
  const multi = new Set(
    rows.filter((r) => multiMonthSet.has(r.entityId || r.customerId)).map((r) => r.entityId || r.customerId)
  ).size;
  const tickets = rows.filter((r) => r.latestTicket).length;
  const annotationCount = annotations
    ? Object.keys(annotations).filter((inv) => {
        const a = annotations[inv];
        return a && (a.caller || a.connectionStatus || a.comments || a.oldComments || a.amComment);
      }).length
    : 0;

  const tiles = [
    { label: "Outstanding", value: fmtUsd(outstanding), accent: "#ffa8cd", sub: `across ${rows.length} invoices` },
    { label: "Invoices", value: fmtNum(rows.length), accent: "#ff8eb8", sub: `${customers} unique businesses` },
    { label: "ACH in flight", value: fmtNum(ach), accent: "#7868f4", sub: "collection in progress" },
    { label: "Multi-month", value: fmtNum(multi), accent: "#9b8df0", sub: "overdue ≥ 2 cycles" },
    { label: "Tickets matched", value: fmtNum(tickets), accent: "#c4b5e8", sub: "linked Linear issues" },
    { label: "Annotations", value: fmtNum(annotationCount), accent: "#8de0a3", sub: "notes saved by reps" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
      {tiles.map((t) => (
        <div key={t.label} className="kpi-card card-zoca">
          <div className="text-[10px] uppercase tracking-[0.18em] text-zoca-textMuted font-bold mb-2.5">{t.label}</div>
          <div className="display font-extrabold leading-none" style={{ color: t.accent, fontSize: 28 }}>{t.value}</div>
          <div className="text-[11px] text-zoca-textDim mt-2">{t.sub}</div>
        </div>
      ))}
    </div>
  );
}
