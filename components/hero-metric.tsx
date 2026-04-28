"use client";
import type { InvoiceRow } from "@/lib/types";

function fmtUsd(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

/**
 * Hero card — total outstanding is the dominant left-side display number.
 * ACH recovery is minimized to a small chip on the right (compact donut +
 * percentage + ratio).
 */
export default function HeroMetric({
  rows,
  multiMonthSet
}: {
  rows: InvoiceRow[];
  multiMonthSet: Set<string>;
}) {
  const total = rows.length;
  const customers = new Set(rows.map((r) => r.customerId)).size;
  const ach = rows.filter((r) => r.achStatus === "In Progress").length;
  const ratio = total ? ach / total : 0;
  const outstanding = rows.reduce((s, r) => s + (r.amountDue || 0), 0);
  const months = Array.from(new Set(rows.map((r) => r.invoiceMonth).filter(Boolean)));
  const monthsLabel =
    months.length === 0
      ? ""
      : months.length === 1
      ? `· ${months[0]}`
      : `· ${months[0]} → ${months[months.length - 1]}`;

  // Compact donut on the right
  const radius = 22;
  const stroke = 6;
  const C = 2 * Math.PI * radius;
  const dash = C * ratio;

  return (
    <div
      className="rounded-3xl px-8 py-10 md:px-10 md:py-12 relative overflow-hidden hero-glow"
      style={{
        background:
          "linear-gradient(135deg, rgba(120,104,244,0.12) 0%, rgba(255,168,205,0.12) 50%, rgba(77,101,255,0.06) 100%), #ffffff",
        backgroundSize: "200% 200%, 100%",
        border: "1px solid #e9e3f5",
        boxShadow: "0 4px 20px rgba(31,8,67,0.06)"
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-start">
        {/* LEFT — total outstanding (hero) */}
        <div>
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

        {/* RIGHT — minimized ACH recovery chip */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl self-start"
          style={{
            background: "rgba(255,255,255,0.6)",
            border: "1px solid #e9e3f5",
            backdropFilter: "blur(2px)"
          }}
        >
          <div className="relative w-[60px] h-[60px] flex-shrink-0">
            <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
              <circle
                cx="30"
                cy="30"
                r={radius}
                fill="none"
                stroke="#ece6f7"
                strokeWidth={stroke}
              />
              <circle
                cx="30"
                cy="30"
                r={radius}
                fill="none"
                stroke="#7868f4"
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display font-bold text-[14px] tabnum text-zoca-purple">
                {Math.round(ratio * 100)}%
              </span>
            </div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.14em] uppercase text-zoca-textMuted font-medium">
              ACH recovery
            </div>
            <div className="font-display font-bold text-[16px] mt-0.5 tabnum text-zoca-text">
              {ach} <span className="text-zoca-textMuted font-normal">/ {total}</span>
            </div>
            <div className="text-[10px] text-zoca-textMuted mt-0.5">
              invoices in flight
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
