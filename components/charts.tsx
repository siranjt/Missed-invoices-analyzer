"use client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, LabelList
} from "recharts";
import type { InvoiceRow } from "@/lib/types";

const ZOCA_COLORS = ["#ffa8cd", "#1f0843", "#7868f4", "#0b051d", "#5d5d5d", "#9b9b9b", "#f695be", "#3b1e7a"];

function fmtUsd(v: number | string) {
  const n = typeof v === "string" ? Number(v) : v;
  return "$" + Math.round(n).toLocaleString();
}

function ChartCard({ title, subtitle, height = 240, children }: any) {
  return (
    <div className="card-zoca">
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-zoca-purpleDark">{title}</div>
          {subtitle && <div className="text-[11px] text-zoca-neutral40">{subtitle}</div>}
        </div>
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

export default function Charts({ rows }: { rows: InvoiceRow[] }) {
  // 1. Outstanding by AM (top 10, horizontal bar)
  const byAmMap = new Map<string, number>();
  rows.forEach((r) => {
    const k = r.amName || "(unassigned)";
    byAmMap.set(k, (byAmMap.get(k) || 0) + r.amountDue);
  });
  const byAm = Array.from(byAmMap.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // 2. Outstanding by month
  const byMonthMap = new Map<string, number>();
  rows.forEach((r) => {
    const k = r.invoiceMonth || "(unknown)";
    byMonthMap.set(k, (byMonthMap.get(k) || 0) + r.amountDue);
  });
  const byMonth = Array.from(byMonthMap.entries()).map(([name, value]) => ({
    name, value: Math.round(value)
  }));

  // 3. Status mix (donut)
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
    { name: "Auto debit On",  value: rows.filter((r) => r.autoDebit === "On").length },
    { name: "Auto debit Off", value: rows.filter((r) => r.autoDebit === "Off").length },
    { name: "Unknown",        value: rows.filter((r) => !r.autoDebit).length }
  ].filter((d) => d.value > 0);

  // 6. Top 10 customers by amount due
  const byBizMap = new Map<string, number>();
  rows.forEach((r) => {
    const k = r.bizName || r.customerCompany || r.customerId || "(unknown)";
    byBizMap.set(k, (byBizMap.get(k) || 0) + r.amountDue);
  });
  const topCustomers = Array.from(byBizMap.entries())
    .map(([name, value]) => ({ name: name.length > 22 ? name.slice(0, 22) + "…" : name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <ChartCard title="Outstanding by AM" subtitle="Top 10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byAm} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} fontSize={11} stroke="#5d5d5d" />
            <YAxis type="category" dataKey="name" width={90} fontSize={11} stroke="#5d5d5d" />
            <Tooltip formatter={(v: any) => fmtUsd(v)} contentStyle={{ borderRadius: 8, border: "1px solid #e7e7e7" }} />
            <Bar dataKey="value" fill="#ffa8cd" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Outstanding by month" subtitle="Across visible invoices">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byMonth}>
            <XAxis dataKey="name" fontSize={11} stroke="#5d5d5d" />
            <YAxis tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} fontSize={11} stroke="#5d5d5d" />
            <Tooltip formatter={(v: any) => fmtUsd(v)} contentStyle={{ borderRadius: 8, border: "1px solid #e7e7e7" }} />
            <Bar dataKey="value" fill="#7868f4" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Top 10 customers" subtitle="By outstanding amount">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topCustomers} layout="vertical" margin={{ left: 8, right: 16 }}>
            <XAxis type="number" tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} fontSize={11} stroke="#5d5d5d" />
            <YAxis type="category" dataKey="name" width={130} fontSize={10} stroke="#5d5d5d" />
            <Tooltip formatter={(v: any) => fmtUsd(v)} contentStyle={{ borderRadius: 8, border: "1px solid #e7e7e7" }} />
            <Bar dataKey="value" fill="#1f0843" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Status mix" subtitle="payment_due vs not_paid">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={statusMix} dataKey="value" nameKey="name" innerRadius={42} outerRadius={78} paddingAngle={2}>
              {statusMix.map((_, i) => (
                <Cell key={i} fill={[ "#ffa8cd", "#1f0843" ][i]} />
              ))}
              <LabelList dataKey="value" position="outside" />
            </Pie>
            <Legend verticalAlign="bottom" iconSize={10} formatter={(v: any) => <span className="text-[11px] text-zoca-neutral40">{v}</span>} />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="ACH status" subtitle="In Progress vs none">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={achSplit} dataKey="value" nameKey="name" innerRadius={42} outerRadius={78} paddingAngle={2}>
              {achSplit.map((_, i) => (
                <Cell key={i} fill={[ "#7868f4", "#e7e7e7" ][i]} />
              ))}
              <LabelList dataKey="value" position="outside" />
            </Pie>
            <Legend verticalAlign="bottom" iconSize={10} formatter={(v: any) => <span className="text-[11px] text-zoca-neutral40">{v}</span>} />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Auto-debit split" subtitle="On / Off / Unknown">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={autoMix} dataKey="value" nameKey="name" innerRadius={42} outerRadius={78} paddingAngle={2}>
              {autoMix.map((_, i) => (
                <Cell key={i} fill={ZOCA_COLORS[i % ZOCA_COLORS.length]} />
              ))}
              <LabelList dataKey="value" position="outside" />
            </Pie>
            <Legend verticalAlign="bottom" iconSize={10} formatter={(v: any) => <span className="text-[11px] text-zoca-neutral40">{v}</span>} />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
