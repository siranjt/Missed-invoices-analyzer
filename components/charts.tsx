"use client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend
} from "recharts";
import type { InvoiceRow } from "@/lib/types";

export default function Charts({ rows }: { rows: InvoiceRow[] }) {
  const byAmMap = new Map<string, number>();
  rows.forEach((r) => {
    const k = r.amName || "(unassigned)";
    byAmMap.set(k, (byAmMap.get(k) || 0) + r.amountDue);
  });
  const byAm = Array.from(byAmMap.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const byMonthMap = new Map<string, number>();
  rows.forEach((r) => {
    const k = r.invoiceMonth || "(unknown)";
    byMonthMap.set(k, (byMonthMap.get(k) || 0) + r.amountDue);
  });
  const byMonth = Array.from(byMonthMap.entries()).map(([name, value]) => ({
    name,
    value: Math.round(value)
  }));

  const statusMix = [
    { name: "payment_due", value: rows.filter((r) => r.status === "payment_due").length },
    { name: "not_paid", value: rows.filter((r) => r.status === "not_paid").length }
  ];
  const statusColors = ["#EF9F27", "#E24B4A"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-white border border-gray-200 rounded-lg p-3 h-56">
        <div className="text-xs text-gray-500 mb-1">Outstanding by AM</div>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={byAm} layout="vertical" margin={{ left: 8, right: 8 }}>
            <XAxis type="number" tickFormatter={(v) => "$" + v.toLocaleString()} fontSize={11} />
            <YAxis type="category" dataKey="name" width={90} fontSize={11} />
            <Tooltip formatter={(v: any) => "$" + Number(v).toLocaleString()} />
            <Bar dataKey="value" fill="#378ADD" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3 h-56">
        <div className="text-xs text-gray-500 mb-1">Outstanding by month</div>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={byMonth}>
            <XAxis dataKey="name" fontSize={11} />
            <YAxis tickFormatter={(v) => "$" + v.toLocaleString()} fontSize={11} />
            <Tooltip formatter={(v: any) => "$" + Number(v).toLocaleString()} />
            <Bar dataKey="value" fill="#1D9E75" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3 h-56">
        <div className="text-xs text-gray-500 mb-1">Status mix</div>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie data={statusMix} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
              {statusMix.map((_, i) => (
                <Cell key={i} fill={statusColors[i]} />
              ))}
            </Pie>
            <Legend verticalAlign="bottom" iconSize={10} />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
