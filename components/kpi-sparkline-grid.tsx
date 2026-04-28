"use client";
import { useMemo } from "react";
import type { InvoiceRow } from "@/lib/types";
import type { FilterState } from "./filters";

function fmtUsd(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

/** Bucket rows into N weekly buckets (most recent last). Returns an array
 * of { week, count, amount } sorted oldest → newest. */
function weeklyBuckets(rows: InvoiceRow[], weeks = 12) {
  const now = Date.now();
  const week = 7 * 24 * 3600 * 1000;
  const buckets: { count: number; amount: number; customers: Set<string>; ach: number }[] = Array.from(
    { length: weeks },
    () => ({ count: 0, amount: 0, customers: new Set(), ach: 0 })
  );
  for (const r of rows) {
    if (!r.invoiceDate) continue;
    const t = new Date(r.invoiceDate).getTime();
    if (!t) continue;
    const ageWeeks = Math.floor((now - t) / week);
    const idx = weeks - 1 - ageWeeks;
    if (idx < 0 || idx >= weeks) continue;
    buckets[idx].count++;
    buckets[idx].amount += r.amountDue || 0;
    if (r.customerId) buckets[idx].customers.add(r.customerId);
    if (r.achStatus === "In Progress") buckets[idx].ach++;
  }
  return buckets.map((b) => ({
    count: b.count,
    amount: b.amount,
    customers: b.customers.size,
    ach: b.ach
  }));
}

function Sparkline({
  values,
  color = "#ffa8cd",
  height = 32
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  if (values.length < 2) {
    return <div className="h-[32px]" />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 200;
  const h = height;
  const stepX = w / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  // Filled area below the line
  const area = `0,${h} ${points} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-[32px] mt-3">
      <polygon points={area} fill={color} opacity="0.12" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function KpiSparklineGrid({
  rows,
  multiMonthSet,
  onCardClick
}: {
  rows: InvoiceRow[];
  multiMonthSet: Set<string>;
  /** Click on any KPI tile fires this with the filter patch the tile represents. */
  onCardClick?: (patch: Partial<FilterState>) => void;
}) {
  const series = useMemo(() => weeklyBuckets(rows, 12), [rows]);

  const outstanding = rows.reduce((s, r) => s + (r.amountDue || 0), 0);
  const total = rows.length;
  const customers = new Set(rows.map((r) => r.customerId)).size;
  const ach = rows.filter((r) => r.achStatus === "In Progress").length;
  const reassigned = new Set(
    rows
      .filter((r) => multiMonthSet.has(r.entityId || r.customerId))
      .map((r) => r.entityId || r.customerId)
  ).size;

  const cards: {
    label: string;
    value: string;
    sub: string;
    spark: number[];
    color: string;
    /** Filter patch applied when this tile is clicked. */
    filter?: Partial<FilterState>;
  }[] = [
    {
      label: "Tickets in window",
      value: total.toLocaleString(),
      sub: `across ${customers} customers`,
      spark: series.map((s) => s.count),
      color: "#a78bfa"
      // No filter — tile is informational only.
    },
    {
      label: "Outstanding",
      value: fmtUsd(outstanding),
      sub: `${total} invoices total`,
      spark: series.map((s) => s.amount),
      color: "#ffa8cd"
    },
    {
      label: "ACH in flight",
      value: ach.toLocaleString(),
      sub: total ? `${Math.round((ach / total) * 100)}% of window` : "0%",
      spark: series.map((s) => s.ach),
      color: "#7868f4",
      filter: { ach: "in_progress" }
    },
    {
      label: "Multi-month",
      value: reassigned.toLocaleString(),
      sub: "customers spanning ≥2 months",
      spark: series.map((s) => s.customers),
      color: "#c4b5e8",
      filter: { multiOnly: true }
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const clickable = !!(c.filter && onCardClick);
        const Tag = clickable ? "button" : "div";
        return (
        <Tag
          key={c.label}
          type={clickable ? ("button" as const) : undefined}
          onClick={clickable ? () => onCardClick!(c.filter!) : undefined}
          className={`rounded-xl p-5 relative overflow-hidden text-left w-full ${
            clickable ? "card-zoca-interactive" : ""
          }`}
          style={{
            background: `linear-gradient(180deg, ${c.color}14 0%, #ffffff 70%)`,
            border: `1px solid ${c.color}33`,
            boxShadow: `0 1px 2px rgba(31,8,67,0.04)`,
            transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease"
          }}
        >
          {/* Colored top accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, ${c.color} 0%, transparent 100%)` }}
          />
          <div className="flex items-start justify-between">
            <div
              className="text-[10px] tracking-[0.14em] uppercase font-medium flex items-center gap-1.5"
              style={{ color: c.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: c.color }}
              />
              {c.label}
            </div>
            <span className="text-zoca-textDim text-[14px] leading-none">→</span>
          </div>
          <div className="font-display text-[32px] font-bold leading-tight mt-3 tabnum">
            {c.value}
          </div>
          <div className="text-[11.5px] text-zoca-textMuted mt-1">{c.sub}</div>
          <Sparkline values={c.spark} color={c.color} />
        </Tag>
        );
      })}
    </div>
  );
}
