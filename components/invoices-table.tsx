"use client";
import { useMemo, useState } from "react";
import type { InvoiceRow, AnnotationsMap, InvoiceAnnotation } from "@/lib/types";

type SortKey = keyof InvoiceRow | "";
function compare(a: any, b: any, key?: SortKey) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (key === "invoiceDate" || key === "cancellingAt") {
    const da = new Date(String(a)).getTime();
    const db = new Date(String(b)).getTime();
    const va = isNaN(da) ? 0 : da;
    const vb = isNaN(db) ? 0 : db;
    return va - vb;
  }
  return String(a).localeCompare(String(b));
}

function fmt(n: number) { return "$" + Math.round(n).toLocaleString(); }

function StatusPill({ s }: { s: string }) {
  const style: React.CSSProperties =
    s === "payment_due"
      ? { background: "rgba(255,168,205,0.18)", color: "#ffa8cd", border: "1px solid rgba(255,168,205,0.3)" }
      : { background: "rgba(231,82,116,0.18)", color: "#ff7593", border: "1px solid rgba(255,117,147,0.3)" };
  return <span className="pill" style={style}>{s}</span>;
}

function AchPill({ s }: { s: string }) {
  if (!s) return null;
  return <span className="pill" style={{ background: "rgba(120,104,244,0.2)", color: "#9b8df0", border: "1px solid rgba(120,104,244,0.35)" }}>{s}</span>;
}

function callerStyle(v: string): React.CSSProperties {
  if (v === "Shakthi") return { background: "rgba(255,117,147,0.15)", color: "#ff7593", borderColor: "rgba(255,117,147,0.4)" };
  if (v === "Joshi") return { background: "rgba(120,200,140,0.15)", color: "#8de0a3", borderColor: "rgba(120,200,140,0.4)" };
  return {};
}
function connStyle(v: string): React.CSSProperties {
  if (v === "Connected") return { background: "rgba(120,200,140,0.15)", color: "#8de0a3", borderColor: "rgba(120,200,140,0.4)" };
  if (v === "VM") return { background: "rgba(120,104,244,0.18)", color: "#9b8df0", borderColor: "rgba(120,104,244,0.4)" };
  if (v === "Not connected") return { background: "rgba(255,117,147,0.15)", color: "#ff7593", borderColor: "rgba(255,117,147,0.4)" };
  return {};
}

function EditableText({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value || "");
  return (
    <input
      className="w-full min-w-[140px] h-7 px-2 text-xs border border-zoca-stroke rounded-md bg-zoca-surface text-zoca-text focus:ring-1 focus:ring-zoca-pink/30 focus:border-zoca-pink focus:outline-none transition-colors"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && onSave(v)}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    />
  );
}

function EditableSelect({
  value, options, onSave, styleFn
}: { value: string; options: string[]; onSave: (v: string) => void; styleFn?: (v: string) => React.CSSProperties }) {
  return (
    <select
      className="h-7 text-xs border border-zoca-stroke rounded-md bg-zoca-surface text-zoca-text focus:ring-1 focus:ring-zoca-pink/30 focus:outline-none px-1 font-medium transition-colors"
      style={styleFn?.(value) || {}}
      value={value || ""}
      onChange={(e) => onSave(e.target.value)}
    >
      <option value="" style={{ background: "#0f0825", color: "#a89cc6" }}>—</option>
      {options.map((o) => <option key={o} value={o} style={{ background: "#0f0825", color: "#f5f0ff" }}>{o}</option>)}
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
    return [...rows].sort((a, b) => sort.dir * compare(a[k], b[k], sort.key));
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
    <div className="overflow-x-auto card-zoca !p-0">
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
            <tr><td colSpan={21} className="text-center text-zoca-textMuted py-8">Loading…</td></tr>
          )}
          {!loading && sorted.length === 0 && (
            <tr><td colSpan={21} className="text-center text-zoca-textMuted py-8">No invoices match these filters.</td></tr>
          )}
          {sorted.map((r) => {
            const a = annotations[r.invoiceNumber] || {};
            const isMulti = multiMonthSet.has(r.entityId || r.customerId);
            return (
              <tr key={r.invoiceNumber} className={isMulti ? "multi-month" : ""}>
                <td className="font-mono text-[11px] text-zoca-textMuted">{r.customerId}</td>
                <td className="font-mono text-[11px] text-zoca-textMuted">{r.entityId}</td>
                <td className="font-medium text-zoca-text">{r.bizName}</td>
                <td>{r.amName}</td>
                <td>{r.subscriptionStatus}</td>
                <td>{r.cancellingAt}</td>
                <td className="font-mono text-[11px] text-zoca-pink">{r.invoiceNumber}</td>
                <td><AchPill s={r.achStatus} /></td>
                <td>{r.autoDebit}</td>
                <td><EditableText value={a.amComment || ""} onSave={(v) => onSave(r.invoiceNumber, { amComment: v })} /></td>
                <td className="whitespace-nowrap">{r.invoiceDate}</td>
                <td>{r.customerFirstName}</td>
                <td>{r.customerEmail}</td>
                <td className="whitespace-nowrap">{r.phoneNumber}</td>
                <td>{r.customerCompany}</td>
                <td className="text-right tabular-nums whitespace-nowrap">
                  <span className="font-semibold mr-2">{fmt(r.amountDue)}</span>
                  <StatusPill s={r.status} />
                </td>
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
                <td>
                  {r.latestTicket ? (
                    <a
                      href={r.latestTicket.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={r.latestTicket.title}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border transition-colors"
                      style={{
                        background: "rgba(255,168,205,0.12)",
                        color: "#ffa8cd",
                        borderColor: "rgba(255,168,205,0.35)"
                      }}
                    >
                      {r.latestTicket.id}
                      <span style={{ opacity: 0.6 }}>↗</span>
                    </a>
                  ) : (
                    <EditableText
                      value={a.tickets || ""}
                      onSave={(v) => onSave(r.invoiceNumber, { tickets: v })}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
