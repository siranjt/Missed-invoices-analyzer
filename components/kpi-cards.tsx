"use client";
import type { InvoiceRow } from "@/lib/types";

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

export default function KpiCards({
  rows,
  multiMonthSet
}: {
  rows: InvoiceRow[];
  multiMonthSet: Set<string>;
}) {
  const outstanding = rows.reduce((s, r) => s + (r.amountDue || 0), 0);
  const customers = new Set(rows.map((r) => r.customerId)).size;
  const ach = rows.filter((r) => r.achStatus === "In Progress").length;
  const multi = new Set(
    rows.filter((r) => multiMonthSet.has(r.entityId || r.customerId)).map((r) => r.entityId || r.customerId)
  ).size;

  const tiles = [
    { label: "Outstanding", value: fmt(outstanding) },
    { label: "Invoices", value: rows.length.toLocaleString() },
    { label: "Customers", value: customers.toLocaleString() },
    { label: "ACH in progress", value: ach.toLocaleString() },
    { label: "Multi-month", value: multi.toLocaleString() }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {tiles.map((t) => (
        <div key={t.label} className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-500">{t.label}</div>
          <div className="text-2xl font-semibold mt-1">{t.value}</div>
        </div>
      ))}
    </div>
  );
}
