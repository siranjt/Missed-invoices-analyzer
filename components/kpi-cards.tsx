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
    rows.filter((r) => multiMonthSet.has(r.entityId || r.customerId)).map((r) => r.entityId || r.customerId)
  ).size;

  const tiles = [
    { label: "Outstanding", value: fmt(outstanding), icon: Wallet, accent: "#ffa8cd" },
    { label: "Invoices", value: rows.length.toLocaleString(), icon: FileText, accent: "#7868f4" },
    { label: "Customers", value: customers.toLocaleString(), icon: Users, accent: "#1f0843" },
    { label: "ACH in progress", value: ach.toLocaleString(), icon: RefreshCcw, accent: "#5d5d5d" },
    { label: "Multi-month", value: multi.toLocaleString(), icon: Layers, accent: "#0b051d" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <div key={t.label} className="card-zoca flex items-center gap-3">
            <div
              className="rounded-xl p-2.5 flex items-center justify-center"
              style={{ background: `${t.accent}1a`, color: t.accent }}
            >
              <Icon size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-zoca-neutral40 font-medium">{t.label}</div>
              <div className="display text-2xl font-bold text-zoca-purpleDark mt-0.5">{t.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
