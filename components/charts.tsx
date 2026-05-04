"use client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from "recharts";
import type { InvoiceRow } from "@/lib/types";

function fmtUsd(v: number | string) {
  const n = typeof v === "string" ? Number(v) : v;
  return "$" + Math.round(n).toLocaleString();
}
function fmtUsdShort(v: number) {
  return "$" + (v / 1000).toFixed(v >= 10000 ? 0 : 1) + "k";
}

function ChartCard({ title, pillClass, pillText, height = 220, children }: any) {
  return (
    <div className="surface" style={{ padding: 18 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-zoca-text">{title}</div>
        {pillText && <span className={pillClass} style={{ fontSize: 10 }}>{pillText}</span>}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

const tickStyle = { fill: "#64748b", fontSize: 11 };
const gridStyle = { stroke: "#e6e8ee", strokeDasharray: "3 3" };
const tooltipProps = {
  contentStyle: {
    borderRadius: 8,
    background: "#ffffff",
    border: "1px solid #e6e8ee",
    color: "#0f172a",
    boxShadow: "0 4px 12px rgba(15,23,42,0.08)"
  },
  cursor: { fill: "rgba(59,130,246,0.06)" }
};

function ageBucket(invoiceDate: string): "0-30d" | "31-60d" | "61-90d" | "90d+" | null {
  if (!invoiceDate) return null;
  const t = new Date(invoiceDate).getTime();
  if (isNaN(t)) return null;
  const days = Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  if (days <= 30) return "0-30d";
  if (days <= 60) return "31-60d";
  if (days <= 90) return "61-90d";
  return "90d+";
}

export default function Charts({ rows }: { rows: InvoiceRow[] }) {
  // Outstanding by AM
  const byAmMap = new Map<string, number>();
  rows.forEach((r) => {
    const k = r.amName || "(unassigned)";
    byAmMap.set(k, (byAmMap.get(k) || 0) + r.amountDue);
  });
  const byAm = Array.from(byAmMap.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Outstanding by month
  const monthOrder = ["March", "April", "May"];
  const byMonthMap = new Map<string, number>();
  rows.forEach((r) => {
    const k = r.invoiceMonth || "(unknown)";
    byMonthMap.set(k, (byMonthMap.get(k) || 0) + r.amountDue);
  });
  const byMonth = monthOrder
    .filter((m) => byMonthMap.has(m))
    .map((name) => ({ name, value: Math.round(byMonthMap.get(name) || 0) }));
  byMonthMap.forEach((value, name) => {
    if (!monthOrder.includes(name)) byMonth.push({ name, value: Math.round(value) });
  });

  // Aging buckets
  const buckets: Record<string, number> = { "0-30d": 0, "31-60d": 0, "61-90d": 0, "90d+": 0 };
  rows.forEach((r) => {
    const b = ageBucket(r.invoiceDate);
    if (b) buckets[b]++;
  });
  const aging = Object.entries(buckets).map(([name, value]) => ({ name, value }));
  const agingColors = ["#10b981", "#ec4899", "#94a3b8", "#cbd5e1"];

  // Subscription status
  const subMap = new Map<string, number>();
  rows.forEach((r) => {
    const k = r.subscriptionStatus || "(unknown)";
    subMap.set(k, (subMap.get(k) || 0) + 1);
  });
  const subStatus = Array.from(subMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const subColorByName: Record<string, string> = {
    active: "#10b981",
    in_trial: "#a855f7",
    non_renewing: "#8b5cf6",
    cancelled: "#ec4899",
    paused: "#6366f1"
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <ChartCard title="Outstanding by AM" pillClass="pill-blue" pillText="TOP 10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byAm} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid {...gridStyle} horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => fmtUsdShort(v)} tick={tickStyle} stroke="#e6e8ee" />
            <YAxis type="category" dataKey="name" width={110} tick={tickStyle} stroke="#e6e8ee" />
            <Tooltip formatter={(v: any) => fmtUsd(v)} {...tooltipProps} />
            <defs>
              <linearGradient id="grad-am" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <Bar dataKey="value" fill="url(#grad-am)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Outstanding by month" pillClass="pill-pink" pillText="VISIBLE">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byMonth}>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis dataKey="name" tick={tickStyle} stroke="#e6e8ee" />
            <YAxis tickFormatter={(v) => fmtUsdShort(v)} tick={tickStyle} stroke="#e6e8ee" />
            <Tooltip formatter={(v: any) => fmtUsd(v)} {...tooltipProps} />
            <defs>
              <linearGradient id="grad-month" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <Bar dataKey="value" fill="url(#grad-month)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Aging buckets" pillClass="pill-amber" pillText="DAYS OVERDUE">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={aging}>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis dataKey="name" tick={tickStyle} stroke="#e6e8ee" />
            <YAxis tick={tickStyle} stroke="#e6e8ee" allowDecimals={false} />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {aging.map((_, i) => <Cell key={i} fill={agingColors[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Subscription status" pillClass="pill-green" pillText="VISIBLE">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={subStatus} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid {...gridStyle} horizontal={false} />
            <XAxis type="number" tick={tickStyle} stroke="#e6e8ee" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={110} tick={tickStyle} stroke="#e6e8ee" />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {subStatus.map((d, i) => (
                <Cell key={i} fill={subColorByName[d.name] || "#94a3b8"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
