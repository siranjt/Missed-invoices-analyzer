"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList
} from "recharts";
import type { InvoiceRow } from "@/lib/types";
import { colorFor } from "./member-chips";
import type { FilterState } from "./filters";

const PINK = "#ffa8cd";
const PURPLE = "#7868f4";
const LAVENDER = "#c4b5e8";
const TRACK = "#221a45"; // dark track for donuts
const AXIS = "#a89cc6"; // muted purple-gray on dark
const CYAN = "#22d3ee";
const ORANGE = "#fb923c";
const GREEN = "#4ade80";
const AMBER = "#facc15";
const RED = "#f87171";

const TOOLTIP_STYLE = {
  background: "#110d24",
  border: "1px solid #2a2451",
  borderRadius: 10,
  color: "#f5f0ff",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.40)"
};
const TOOLTIP_LABEL = { color: "#cfc4ee", fontWeight: 500 };
const TOOLTIP_ITEM = { color: "#f5f0ff" };

function fmtUsd(v: number | string) {
  const n = typeof v === "string" ? Number(v) : v;
  return "$" + Math.round(n).toLocaleString();
}

function ChartCard({
  title,
  subtitle,
  height = 200,
  children
}: {
  title: string;
  subtitle?: string;
  height?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="card-zoca">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-[12px] font-medium text-zoca-text">{title}</div>
        {subtitle && <div className="text-[10px] text-zoca-textDim">{subtitle}</div>}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

/** Number of days between an ISO/Date-string and today. */
function daysOverdue(invoiceDate: string): number {
  const t = new Date(invoiceDate).getTime();
  if (!t) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / (24 * 3600 * 1000)));
}

export default function Charts({
  rows,
  onAmClick,
  onFilterClick,
  onMonthClick
}: {
  rows: InvoiceRow[];
  onAmClick?: (amName: string) => void;
  onFilterClick?: (patch: Partial<FilterState>) => void;
  onMonthClick?: (month: string) => void;
}) {
  // 1. Outstanding by AM (top 10)
  const byAmMap = new Map<string, number>();
  rows.forEach((r) => {
    const k = r.amName || "(unassigned)";
    byAmMap.set(k, (byAmMap.get(k) || 0) + r.amountDue);
  });
  const byAm = Array.from(byAmMap.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // 2. By month
  const byMonthMap = new Map<string, number>();
  rows.forEach((r) => {
    const k = r.invoiceMonth || "(unknown)";
    byMonthMap.set(k, (byMonthMap.get(k) || 0) + r.amountDue);
  });
  const byMonth = Array.from(byMonthMap.entries()).map(([name, value]) => ({
    name,
    value: Math.round(value)
  }));

  // 3. Top customers
  const byBizMap = new Map<string, number>();
  rows.forEach((r) => {
    const k = r.bizName || r.customerCompany || r.customerId || "(unknown)";
    byBizMap.set(k, (byBizMap.get(k) || 0) + r.amountDue);
  });
  const topCustomers = Array.from(byBizMap.entries())
    .map(([name, value]) => ({
      name: name.length > 22 ? name.slice(0, 22) + "…" : name,
      value: Math.round(value)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // 4. NEW — Aging buckets
  const buckets = { "0–30d": 0, "31–60d": 0, "61–90d": 0, "90d+": 0 };
  rows.forEach((r) => {
    const d = daysOverdue(r.invoiceDate);
    if (d <= 30) buckets["0–30d"]++;
    else if (d <= 60) buckets["31–60d"]++;
    else if (d <= 90) buckets["61–90d"]++;
    else buckets["90d+"]++;
  });
  const aging = Object.entries(buckets).map(([name, value]) => ({ name, value }));
  const agingColors = [GREEN, AMBER, ORANGE, RED];

  // 5. NEW — Subscription status mix
  const subMap = new Map<string, number>();
  rows.forEach((r) => {
    const s = r.subscriptionStatus || "unknown";
    subMap.set(s, (subMap.get(s) || 0) + 1);
  });
  const subStatusColor: Record<string, string> = {
    active: GREEN,
    non_renewing: AMBER,
    cancelled: RED,
    paused: CYAN,
    unknown: "#6b5b8e"
  };
  const subMix = Array.from(subMap.entries())
    .map(([name, value]) => ({ name, value, color: subStatusColor[name] || PURPLE }))
    .sort((a, b) => b.value - a.value);

  // 7. Status mix
  const statusMix = [
    { name: "payment_due", value: rows.filter((r) => r.status === "payment_due").length },
    { name: "not_paid", value: rows.filter((r) => r.status === "not_paid").length }
  ];

  // 8. ACH split
  const achSplit = [
    { name: "ACH In Progress", value: rows.filter((r) => r.achStatus === "In Progress").length },
    { name: "No ACH", value: rows.filter((r) => !r.achStatus).length }
  ];

  // 9. Auto-debit split
  const autoMix = [
    { name: "Auto debit On", value: rows.filter((r) => r.autoDebit === "On").length },
    { name: "Auto debit Off", value: rows.filter((r) => r.autoDebit === "Off").length },
    { name: "Unknown", value: rows.filter((r) => !r.autoDebit).length }
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {/* Row 1 */}
      <ChartCard
        title="Outstanding by AM"
        subtitle={onAmClick ? "click a bar to drill" : "Top 10"}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byAm} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
            <XAxis type="number" tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} fontSize={10} stroke={AXIS} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={96}
              fontSize={11}
              stroke={AXIS}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <Tooltip formatter={(v: any) => fmtUsd(v)} contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} cursor={{ fill: "rgba(120,104,244,0.06)" }} />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              cursor={onAmClick ? "pointer" : undefined}
              onClick={
                onAmClick
                  ? (d: any) => {
                      const name = d?.name || d?.payload?.name;
                      if (name && name !== "(unassigned)") onAmClick(name);
                    }
                  : undefined
              }
            >
              {byAm.map((d, i) => (
                <Cell key={i} fill={d.name === "(unassigned)" ? "#6b5b8e" : colorFor(d.name)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Outstanding by month" subtitle={onMonthClick ? "click to switch tab" : "visible rows"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byMonth} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
            <XAxis dataKey="name" fontSize={10} stroke={AXIS} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} fontSize={10} stroke={AXIS} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => fmtUsd(v)} contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} cursor={{ fill: "rgba(120,104,244,0.06)" }} />
            <Bar
              dataKey="value"
              fill={CYAN}
              radius={[4, 4, 0, 0]}
              cursor={onMonthClick ? "pointer" : undefined}
              onClick={
                onMonthClick
                  ? (d: any) => {
                      const name = d?.name || d?.payload?.name;
                      if (name) onMonthClick(name);
                    }
                  : undefined
              }
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Aging buckets" subtitle="Days since invoice date">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={aging} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
            <XAxis dataKey="name" fontSize={10} stroke={AXIS} axisLine={false} tickLine={false} />
            <YAxis fontSize={10} stroke={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} cursor={{ fill: "rgba(120,104,244,0.06)" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {aging.map((_, i) => (
                <Cell key={i} fill={agingColors[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row 2 */}
      <ChartCard title="Top customers" subtitle="By amount due">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topCustomers} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
            <XAxis type="number" tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} fontSize={10} stroke={AXIS} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              fontSize={10}
              stroke={AXIS}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <Tooltip formatter={(v: any) => fmtUsd(v)} contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} cursor={{ fill: "rgba(120,104,244,0.06)" }} />
            <Bar dataKey="value" fill={ORANGE} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Subscription status" subtitle="Across visible invoices">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={subMix} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={2} stroke="none">
              {subMix.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
              <LabelList dataKey="value" position="outside" fill="#cfc4ee" fontSize={11} />
            </Pie>
            <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row 3 */}
      <ChartCard title="Status mix" subtitle={onFilterClick ? "click a slice to filter" : "payment_due vs not_paid"}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusMix}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={72}
              paddingAngle={2}
              stroke="none"
              cursor={onFilterClick ? "pointer" : undefined}
              onClick={onFilterClick ? (d: any) => onFilterClick({ status: d?.name }) : undefined}
            >
              {statusMix.map((_, i) => (
                <Cell key={i} fill={[PINK, ORANGE][i]} />
              ))}
              <LabelList dataKey="value" position="outside" fill="#cfc4ee" fontSize={11} />
            </Pie>
            <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      </div>

      {/* Last row — 2 donuts in a wider 2-up grid so the layout reads as
          intentional rather than a half-empty 3-up row. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <ChartCard title="ACH status" subtitle={onFilterClick ? "click a slice to filter" : "In Progress vs none"}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={achSplit}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={72}
              paddingAngle={2}
              stroke="none"
              cursor={onFilterClick ? "pointer" : undefined}
              onClick={
                onFilterClick
                  ? (d: any) => {
                      const name = d?.name;
                      if (name === "ACH In Progress") onFilterClick({ ach: "in_progress" });
                      else if (name === "No ACH") onFilterClick({ ach: "none" });
                    }
                  : undefined
              }
            >
              {achSplit.map((_, i) => (
                <Cell key={i} fill={[CYAN, TRACK][i]} />
              ))}
              <LabelList dataKey="value" position="outside" fill="#cfc4ee" fontSize={11} />
            </Pie>
            <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Auto-debit split" subtitle={onFilterClick ? "click a slice to filter" : "On / Off / Unknown"}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={autoMix}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={72}
              paddingAngle={2}
              stroke="none"
              cursor={onFilterClick ? "pointer" : undefined}
              onClick={
                onFilterClick
                  ? (d: any) => {
                      const name = d?.name;
                      if (name === "Auto debit On") onFilterClick({ autoDebit: "On" });
                      else if (name === "Auto debit Off") onFilterClick({ autoDebit: "Off" });
                    }
                  : undefined
              }
            >
              {autoMix.map((_, i) => (
                <Cell key={i} fill={[GREEN, RED, LAVENDER][i % 3]} />
              ))}
              <LabelList dataKey="value" position="outside" fill="#cfc4ee" fontSize={11} />
            </Pie>
            <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      </div>
    </div>
  );
}
