"use client";
import type { InvoiceRow } from "@/lib/types";

function fmtUsd(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

/**
 * Hero metric card — multi-segment donut showing severity breakdown across the
 * visible window: ACH-in-recovery (pink) / payment_due manual (purple) /
 * not_paid (orange) / multi-month (cyan). Plus four supporting numbers.
 */
export default function HeroMetric({
  rows,
  multiMonthSet
}: {
  rows: InvoiceRow[];
  multiMonthSet: Set<string>;
}) {
  const total = rows.length;

  // Severity buckets — each row falls in exactly one bucket.
  let ach = 0;
  let multi = 0;
  let notPaid = 0;
  let due = 0;
  for (const r of rows) {
    if (r.achStatus === "In Progress") ach++;
    else if (multiMonthSet.has(r.entityId || r.customerId)) multi++;
    else if (r.status === "not_paid") notPaid++;
    else due++;
  }

  const outstanding = rows.reduce((s, r) => s + (r.amountDue || 0), 0);
  const stillManual = total - ach;
  const ratio = total ? ach / total : 0;

  // Donut segments in pixels along the circumference
  const radius = 60;
  const stroke = 14;
  const C = 2 * Math.PI * radius;
  const segs: { color: string; value: number }[] = [
    { color: "#ffa8cd", value: ach }, // pink — ACH recovery
    { color: "#7868f4", value: due }, // purple — payment_due manual
    { color: "#fb923c", value: notPaid }, // orange — not_paid
    { color: "#22d3ee", value: multi } // cyan — multi-month
  ].filter((s) => s.value > 0);

  // Build dasharray + offset chain
  let cumulative = 0;
  const arcs = segs.map((s) => {
    const len = total ? (s.value / total) * C : 0;
    const dasharray = `${len} ${C - len}`;
    const dashoffset = -cumulative;
    cumulative += len;
    return { color: s.color, dasharray, dashoffset };
  });

  return (
    <div
      className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(120,104,244,0.16) 0%, rgba(255,168,205,0.10) 50%, rgba(34,211,238,0.06) 100%), #110d24",
        border: "1px solid #2a2451"
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="text-[11px] tracking-[0.18em] uppercase text-zoca-textMuted font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-zoca-pink mr-2 align-middle" />
          ACH Recovery · severity breakdown
        </div>
        <div className="hidden md:flex items-center gap-3 text-[11px]">
          <Legend color="#ffa8cd" label="ACH" />
          <Legend color="#7868f4" label="Due" />
          <Legend color="#fb923c" label="Unpaid" />
          <Legend color="#22d3ee" label="Multi-month" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto_auto] gap-x-10 gap-y-6 items-center">
        {/* Donut */}
        <div className="relative w-[170px] h-[170px] mx-auto md:mx-0">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#2a2451"
              strokeWidth={stroke}
            />
            {arcs.map((a, i) => (
              <circle
                key={i}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={a.color}
                strokeWidth={stroke}
                strokeDasharray={a.dasharray}
                strokeDashoffset={a.dashoffset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-[44px] font-bold leading-none">
              {Math.round(ratio * 100)}
              <span className="text-[20px] align-top">%</span>
            </div>
            <div className="text-[10px] tracking-[0.18em] uppercase text-zoca-textMuted mt-1 font-medium">
              In ACH
            </div>
          </div>
        </div>

        {/* Headline */}
        <div>
          <div className="font-display text-[34px] font-bold leading-tight tabnum">
            <span style={{ color: "#ffa8cd" }}>{ach.toLocaleString()}</span>{" "}
            <span className="text-zoca-textMuted">/ {total.toLocaleString()}</span>
          </div>
          <div className="text-[12px] text-zoca-textSecondary mt-1">
            invoices currently being collected via ACH
          </div>
        </div>

        <Stat
          label="Still Manual"
          value={stillManual.toLocaleString()}
          sub={`${total ? Math.round((stillManual / total) * 100) : 0}% of window`}
          accent="#7868f4"
        />
        <Stat
          label="Outstanding"
          value={fmtUsd(outstanding)}
          sub="across all visible rows"
          accent="#fb923c"
        />
        <Stat
          label="Multi-month"
          value={
            new Set(
              rows
                .filter((r) => multiMonthSet.has(r.entityId || r.customerId))
                .map((r) => r.entityId || r.customerId)
            ).size.toLocaleString()
          }
          sub="customers spanning ≥2 months"
          accent="#22d3ee"
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="border-l pl-4" style={{ borderColor: `${accent}55` }}>
      <div
        className="text-[10px] tracking-[0.18em] uppercase font-medium"
        style={{ color: accent }}
      >
        {label}
      </div>
      <div className="font-display text-[26px] font-bold leading-tight mt-1 tabnum">
        {value}
      </div>
      <div className="text-[11px] text-zoca-textMuted mt-1">{sub}</div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-zoca-textMuted">
      <span className="w-2 h-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
