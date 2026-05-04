"use client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from "recharts";
import type { InvoiceRow } from "@/lib/types";

function fmtUsd(v: number | string) {
  const n = typeof v === "string" ? Number(v) : v;
  return "$" + Math.round(n).toLocaleString();
}

function ChartCard({ title, subtitle, height = 220, children }: any) {
  return (
    <div className="card-zoca">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-sm font-semibold text-zoca-text">{title}</div>
        {subtitle && <div className="text-[11px] text-zoca-textDim">{subtitle}</div>}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

const tickStyle = { fill: "#a89cc6", fontSize: 11 };
const gridStyle = { stroke: "#2a1d5a", strokeDasharray: "3 3" };
const tooltipProps = {
  contentStyle: {
    borderRadius: 8,
    background: "#0f0825",
    border: "1px solid #2a1d5a",
    color: "#f5f0ff"
  },
  cursor: { fill: "rgba(255,168,205,0.06)" }
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
  // Outstanding by AM (top 10)
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
  const agingColors = ["#8de0a3", "#ffa8cd", "#9b8df0", "#ff7593"];

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
    active: "#8de0a3",
    in_trial: "#c4b5e8",
    non_renewing: "#9b8df0",
    cancelled: "#ff7593",
    paused: "#7868f4"
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <ChartCard title="Outstanding by AM" subtitle="Top 10 account managers">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byAm} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid {...gridStyle} horizontal={false} />
            <XAxis type="number" tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} tick={tickStyle} stroke="#2a1d5a" />
            <YAxis type="category" dataKey="name" width={100} tick={tickStyle} stroke="#2a1d5a" />
            <Tooltip formatter={(v: any) => fmtUsd(v)} {...tooltipProps} />
            <defs>
              <linearGradient id="grad-am" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffa8cd" />
                <stop offset="100%" stopColor="#ff8eb8" />
              </linearGradient>
            </defs>
            <Bar dataKey="value" fill="url(#grad-am)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Outstanding by month" subtitle="Visible invoices">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byMonth}>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis dataKey="name" tick={tickStyle} stroke="#2a1d5a" />
            <YAxis tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} tick={tickStyle} stroke="#2a1d5a" />
            <Tooltip formatter={(v: any) => fmtUsd(v)} {...tooltipProps} />
            <defs>
              <linearGradient id="grad-month" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7868f4" />
                <stop offset="100%" stopColor="#5d4ed1" />
              </linearGradient>
            </defs>
            <Bar dataKey="value" fill="url(#grad-month)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Aging buckets" subtitle="Days since invoice date">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={aging}>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis dataKey="name" tick={tickStyle} stroke="#2a1d5a" />
            <YAxis tick={tickStyle} stroke="#2a1d5a" allowDecimals={false} />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {aging.map((_, i) => <Cell key={i} fill={agingColors[i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Subscription status" subtitle="Across visible invoices">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={subStatus} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid {...gridStyle} horizontal={false} />
            <XAxis type="number" tick={tickStyle} stroke="#2a1d5a" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={100} tick={tickStyle} stroke="#2a1d5a" />
            <Tooltip {...tooltipProps} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {subStatus.map((d, i) => (
                <Cell key={i} fill={subColorByName[d.name] || "#c4b5e8"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
