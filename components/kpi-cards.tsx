"use client";
import type { InvoiceRow } from "@/lib/types";
import { Wallet, FileText, Users, RefreshCcw, Layers } from "lucide-react";

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
    rows
      .filter((r) => multiMonthSet.has(r.entityId || r.customerId))
      .map((r) => r.entityId || r.customerId)
  ).size;

  const tiles = [
    { label: "Outstanding", value: fmt(outstanding), icon: Wallet, accent: "#ffa8cd" },
    { label: "Invoices", value: rows.length.toLocaleString(), icon: FileText, accent: "#7868f4" },
    { label: "Customers", value: customers.toLocaleString(), icon: Users, accent: "#c4b5e8" },
    { label: "ACH in flight", value: ach.toLocaleString(), icon: RefreshCcw, accent: "#7868f4" },
    { label: "Multi-month", value: multi.toLocaleString(), icon: Layers, accent: "#ffa8cd" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <div key={t.label} className="card-zoca flex items-center gap-3 !py-2.5">
            <div
              className="rounded-md p-1.5 flex items-center justify-center"
              style={{ background: `${t.accent}24`, color: t.accent }}
            >
              <Icon size={14} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.08em] text-zoca-textMuted font-medium">
                {t.label}
              </div>
              <div className="font-mono text-lg font-bold text-zoca-text tabnum mt-0.5 leading-tight">
                {t.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
