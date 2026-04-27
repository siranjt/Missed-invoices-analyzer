"use client";
import { useMemo, useState } from "react";
import type { InvoiceRow, AnnotationsMap, InvoiceAnnotation } from "@/lib/types";

type SortKey = keyof InvoiceRow | "";
function compare(a: any, b: any) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function fmt(n: number) { return "$" + Math.round(n).toLocaleString(); }

function StatusPill({ s }: { s: string }) {
  const cls = s === "payment_due" ? "bg-zoca-softAmber text-amber-800" : "bg-zoca-softRed text-red-800";
  return <span className={`pill ${cls}`}>{s}</span>;
}

function AchPill({ s }: { s: string }) {
  if (!s) return null;
  return <span className="pill bg-zoca-softBlue text-blue-800">{s}</span>;
}

function callerStyle(v: string) {
  if (v === "Shakthi") return "bg-red-50 text-red-800";
  if (v === "Joshi") return "bg-green-50 text-green-800";
  return "";
}
function connStyle(v: string) {
  if (v === "Connected") return "bg-green-50 text-green-800";
  if (v === "VM") return "bg-blue-50 text-blue-800";
  if (v === "Not connected") return "bg-red-50 text-red-800";
  return "";
}

function EditableText({
  value,
  onSave
}: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value || "");
  return (
    <input
      className="w-full min-w-[140px] h-7 px-2 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-zoca-blue focus:outline-none"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && onSave(v)}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    />
  );
}

function EditableSelect({
  value, options, onSave, styleFn
}: { value: string; options: string[]; onSave: (v: string) => void; styleFn?: (v: string) => string }) {
  return (
    <select
      className={`h-7 text-xs border border-gray-200 rounded bg-white focus:ring-1 focus:ring-zoca-blue focus:outline-none ${styleFn?.(value) || ""}`}
      value={value || ""}
      onChange={(e) => onSave(e.target.value)}
    >
      <option value="">—</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function InvoicesTable({
  rows,
  annotations,
  onSave,
  loading,
  multiMonthSet
}: {
  rows: InvoiceRow[];
  annotations: AnnotationsMap;
  onSave: (invoiceNumber: string, patch: InvoiceAnnotation) => void;
  loading: boolean;
  multiMonthSet: Set<string>;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "invoiceDate", dir: -1 });

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const k = sort.key as keyof InvoiceRow;
    return [...rows].sort((a, b) => sort.dir * compare(a[k], b[k]));
  }, [rows, sort]);

  function header(label: string, key: SortKey, extra = "") {
    const active = sort.key === key;
    return (
      <th
        onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }))}
        className={`cursor-pointer select-none ${extra}`}
      >
        {label}{active ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
      </th>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
      <table className="zoca-tbl w-full" style={{ minWidth: 1900 }}>
        <thead>
          <tr>
            {header("Customer Id", "customerId")}
            {header("Entity Id", "entityId")}
            {header("Biz name", "bizName")}
            {header("AM", "amName")}
            {header("Sub status", "subscriptionStatus")}
            {header("Cancelling at", "cancellingAt")}
            {header("Invoice #", "invoiceNumber")}
            {header("ACH", "achStatus")}
            {header("Auto debit", "autoDebit")}
            <th>AM Comment</th>
            {header("Date", "invoiceDate")}
            {header("First Name", "customerFirstName")}
            {header("Email", "customerEmail")}
            {header("Phone", "phoneNumber")}
            {header("Company", "customerCompany")}
            {header("Amount Due", "amountDue", "text-right")}
            <th>Caller</th>
            <th>Connection</th>
            <th>Comments</th>
            <th>Old comments</th>
            <th>Tickets</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={21} className="text-center text-gray-400 py-6 text-sm">Loading…</td></tr>
          )}
          {!loading && sorted.length === 0 && (
            <tr><td colSpan={21} className="text-center text-gray-400 py-6 text-sm">No invoices match these filters.</td></tr>
          )}
          {sorted.map((r) => {
            const a = annotations[r.invoiceNumber] || {};
            const isMulti = multiMonthSet.has(r.entityId || r.customerId);
            return (
              <tr key={r.invoiceNumber} className={isMulti ? "bg-amber-50/40" : ""}>
                <td className="font-mono text-[11px]">{r.customerId}</td>
                <td className="font-mono text-[11px] text-gray-500">{r.entityId}</td>
                <td>{r.bizName}</td>
                <td>{r.amName}</td>
                <td>{r.subscriptionStatus}</td>
                <td>{r.cancellingAt}</td>
                <td className="font-mono text-[11px]">{r.invoiceNumber}</td>
                <td><AchPill s={r.achStatus} /></td>
                <td>{r.autoDebit}</td>
                <td><EditableText value={a.amComment || ""} onSave={(v) => onSave(r.invoiceNumber, { amComment: v })} /></td>
                <td className="whitespace-nowrap">{r.invoiceDate}</td>
                <td>{r.customerFirstName}</td>
                <td>{r.customerEmail}</td>
                <td className="whitespace-nowrap">{r.phoneNumber}</td>
                <td>{r.customerCompany}</td>
                <td className="text-right tabular-nums">{fmt(r.amountDue)}{" "}<StatusPill s={r.status} /></td>
                <td>
                  <EditableSelect
                    value={a.caller || ""}
                    options={["Shakthi", "Joshi"]}
                    onSave={(v) => onSave(r.invoiceNumber, { caller: v as any })}
                    styleFn={callerStyle}
                  />
                </td>
                <td>
                  <EditableSelect
                    value={a.connectionStatus || ""}
                    options={["Connected", "VM", "Not connected"]}
                    onSave={(v) => onSave(r.invoiceNumber, { connectionStatus: v as any })}
                    styleFn={connStyle}
                  />
                </td>
                <td><EditableText value={a.comments || ""} onSave={(v) => onSave(r.invoiceNumber, { comments: v })} /></td>
                <td><EditableText value={a.oldComments || ""} onSave={(v) => onSave(r.invoiceNumber, { oldComments: v })} /></td>
                <td><EditableText value={a.tickets || ""} onSave={(v) => onSave(r.invoiceNumber, { tickets: v })} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
