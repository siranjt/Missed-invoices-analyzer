"use client";
import type { InvoiceRow } from "@/lib/types";

function fmtUsd(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

/**
 * Hero card — total outstanding is the dominant display number, with the
 * invoice / customer count + month range as a subline. Nothing else lives
 * here; the ACH-recovery story is told in the KPI sparkline grid below.
 */
export default function HeroMetric({
  rows
}: {
  rows: InvoiceRow[];
  /** kept on the prop signature for backwards compat with dashboard.tsx */
  multiMonthSet?: Set<string>;
}) {
  const total = rows.length;
  const customers = new Set(rows.map((r) => r.customerId)).size;
  const outstanding = rows.reduce((s, r) => s + (r.amountDue || 0), 0);
  const months = Array.from(new Set(rows.map((r) => r.invoiceMonth).filter(Boolean)));
  const monthsLabel =
    months.length === 0
      ? ""
      : months.length === 1
      ? `· ${months[0]}`
      : `· ${months[0]} → ${months[months.length - 1]}`;

  return (
    <div
      className="rounded-3xl px-8 py-10 md:px-10 md:py-12 relative overflow-hidden hero-glow"
      style={{
        background:
          "linear-gradient(135deg, rgba(120,104,244,0.16) 0%, rgba(255,168,205,0.12) 50%, rgba(77,101,255,0.10) 100%), #2d2841",
        backgroundSize: "200% 200%, 100%",
        border: "1px solid #3d3658",
        boxShadow: "0 8px 28px rgba(0,0,0,0.25)"
      }}
    >
      <div className="text-[11px] tracking-[0.18em] uppercase text-zoca-textMuted font-medium flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-zoca-pink" />
        Total outstanding
      </div>
      <div
        className="font-display font-extrabold leading-none tabnum mt-4"
        style={{ fontSize: "clamp(52px, 7vw, 80px)", letterSpacing: "-0.03em" }}
      >
        {fmtUsd(outstanding)}
      </div>
      <div className="text-[14px] text-zoca-textSecondary mt-4">
        across{" "}
        <span className="text-zoca-text font-medium">
          {total.toLocaleString()} invoices
        </span>{" "}
        ·{" "}
        <span className="text-zoca-text font-medium">
          {customers.toLocaleString()} customers
        </span>{" "}
        <span className="text-zoca-textMuted">{monthsLabel}</span>
      </div>
    </div>
  );
}
