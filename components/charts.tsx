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

const PINK = "#ffa8cd";
const PURPLE = "#7868f4";
const LAVENDER = "#c4b5e8";
const TRACK = "#221a45";
const AXIS = "#a89cc6";

const TOOLTIP_STYLE = {
  background: "#110d24",
  border: "1px solid #2a2451",
  borderRadius: 8,
  color: "#f5f0ff",
  fontSize: 11
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

export default function Charts({
  rows,
  onAmClick
}: {
  rows: InvoiceRow[];
  onAmClick?: (amName: string) => void;
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

  // 3. Status mix
  const statusMix = [
    { name: "payment_due", value: rows.filter((r) => r.status === "payment_due").length },
    { name: "not_paid", value: rows.filter((r) => r.status === "not_paid").length }
  ];

  // 4. ACH split
  const achSplit = [
    { name: "ACH In Progress", value: rows.filter((r) => r.achStatus === "In Progress").length },
    { name: "No ACH", value: rows.filter((r) => !r.achStatus).length }
  ];

  // 5. Auto-debit split
  const autoMix = [
    { name: "Auto debit On", value: rows.filter((r) => r.autoDebit === "On").length },
    { name: "Auto debit Off", value: rows.filter((r) => r.autoDebit === "Off").length },
    { name: "Unknown", value: rows.filter((r) => !r.autoDebit).length }
  ].filter((d) => d.value > 0);

  // 6. Top customers
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      <ChartCard
        title="Outstanding by AM"
        subtitle={onAmClick ? "Top 10 · click a bar to drill" : "Top 10"}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byAm} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"}
              fontSize={10}
              stroke={AXIS}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={70}
              fontSize={10}
              stroke={AXIS}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v: any) => fmtUsd(v)}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL}
              itemStyle={TOOLTIP_ITEM}
              cursor={{ fill: "rgba(120,104,244,0.06)" }}
            />
            <Bar
              dataKey="value"
              fill={PINK}
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
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Outstanding by month" subtitle="Visible rows">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byMonth} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
            <XAxis dataKey="name" fontSize={10} stroke={AXIS} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"}
              fontSize={10}
              stroke={AXIS}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v: any) => fmtUsd(v)}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL}
              itemStyle={TOOLTIP_ITEM}
              cursor={{ fill: "rgba(120,104,244,0.06)" }}
            />
            <Bar dataKey="value" fill={PURPLE} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top customers" subtitle="By amount due">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topCustomers} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"}
              fontSize={10}
              stroke={AXIS}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              fontSize={9}
              stroke={AXIS}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v: any) => fmtUsd(v)}
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL}
              itemStyle={TOOLTIP_ITEM}
              cursor={{ fill: "rgba(120,104,244,0.06)" }}
            />
            <Bar dataKey="value" fill={LAVENDER} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Status mix" subtitle="payment_due vs not_paid">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={statusMix} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={2} stroke="none">
              {statusMix.map((_, i) => (
                <Cell key={i} fill={[PINK, PURPLE][i]} />
              ))}
              <LabelList
                dataKey="value"
                position="outside"
                fill="#cfc4ee"
                fontSize={11}
              />
            </Pie>
            <Legend
              verticalAlign="bottom"
              iconSize={8}
              wrapperStyle={{ fontSize: 10 }}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL}
              itemStyle={TOOLTIP_ITEM}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="ACH status" subtitle="In Progress vs none">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={achSplit} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={2} stroke="none">
              {achSplit.map((_, i) => (
                <Cell key={i} fill={[PURPLE, TRACK][i]} />
              ))}
              <LabelList
                dataKey="value"
                position="outside"
                fill="#cfc4ee"
                fontSize={11}
              />
            </Pie>
            <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Auto-debit split" subtitle="On / Off / Unknown">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={autoMix} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={2} stroke="none">
              {autoMix.map((_, i) => (
                <Cell key={i} fill={[PINK, PURPLE, LAVENDER][i % 3]} />
              ))}
              <LabelList
                dataKey="value"
                position="outside"
                fill="#cfc4ee"
                fontSize={11}
              />
            </Pie>
            <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL} itemStyle={TOOLTIP_ITEM} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
