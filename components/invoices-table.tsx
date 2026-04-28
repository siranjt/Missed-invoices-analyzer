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

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

function StatusPill({ s }: { s: string }) {
  const style: React.CSSProperties =
    s === "payment_due"
      ? { background: "rgba(255,168,205,0.12)", color: "#ffa8cd" }
      : { background: "rgba(248,113,113,0.12)", color: "#f87171" };
  return (
    <span className="pill" style={style}>
      {s}
    </span>
  );
}

function AchPill({ s }: { s: string }) {
  if (!s) return null;
  return (
    <span className="pill" style={{ background: "rgba(120,104,244,0.16)", color: "#c4b5e8" }}>
      {s}
    </span>
  );
}

function SubPill({ s }: { s: string }) {
  if (!s) return null;
  const isActive = s === "active";
  const style: React.CSSProperties = isActive
    ? { background: "rgba(74,222,128,0.10)", color: "#4ade80" }
    : { background: "rgba(251,146,60,0.10)", color: "#fb923c" };
  return (
    <span className="pill" style={style}>
      {s}
    </span>
  );
}

function callerStyle(v: string): React.CSSProperties {
  if (v === "Shakthi")
    return { background: "rgba(248,113,113,0.10)", color: "#f87171", borderColor: "rgba(248,113,113,0.30)" };
  if (v === "Joshi")
    return { background: "rgba(74,222,128,0.10)", color: "#4ade80", borderColor: "rgba(74,222,128,0.30)" };
  return {};
}
function connStyle(v: string): React.CSSProperties {
  if (v === "Connected")
    return { background: "rgba(74,222,128,0.10)", color: "#4ade80", borderColor: "rgba(74,222,128,0.30)" };
  if (v === "VM")
    return { background: "rgba(120,104,244,0.16)", color: "#c4b5e8", borderColor: "rgba(120,104,244,0.30)" };
  if (v === "Not connected")
    return { background: "rgba(248,113,113,0.10)", color: "#f87171", borderColor: "rgba(248,113,113,0.30)" };
  return {};
}

function EditableText({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value || "");
  return (
    <input
      className="w-full min-w-[140px] input-zoca !h-7 !text-[11px]"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && onSave(v)}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}

function EditableSelect({
  value,
  options,
  onSave,
  styleFn
}: {
  value: string;
  options: string[];
  onSave: (v: string) => void;
  styleFn?: (v: string) => React.CSSProperties;
}) {
  return (
    <select
      className="input-zoca !h-7 !text-[11px] !pr-6 font-medium"
      style={styleFn?.(value) || {}}
      value={value || ""}
      onChange={(e) => onSave(e.target.value)}
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export default function InvoicesTable({
  rows,
  annotations,
  onSave,
  loading,
  multiMonthSet,
  onAmClick
}: {
  rows: InvoiceRow[];
  annotations: AnnotationsMap;
  onSave: (invoiceNumber: string, patch: InvoiceAnnotation) => void;
  loading: boolean;
  multiMonthSet: Set<string>;
  onAmClick?: (amName: string) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "invoiceDate",
    dir: -1
  });

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const k = sort.key as keyof InvoiceRow;
    return [...rows].sort((a, b) => sort.dir * compare(a[k], b[k]));
  }, [rows, sort]);

  function header(label: string, key: SortKey, extra = "") {
    const active = sort.key === key;
    return (
      <th
        onClick={() =>
          setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }))
        }
        className={`cursor-pointer select-none ${extra}`}
      >
        {label}
        {active ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
      </th>
    );
  }

  return (
    <div
      className="overflow-auto card-zoca !p-0"
      style={{ maxHeight: "calc(100vh - 220px)", minHeight: 320 }}
    >
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
            <tr>
              <td colSpan={21} className="text-center text-zoca-textDim py-8">
                Loading…
              </td>
            </tr>
          )}
          {!loading && sorted.length === 0 && (
            <tr>
              <td colSpan={21} className="text-center text-zoca-textDim py-8">
                No invoices match these filters.
              </td>
            </tr>
          )}
          {sorted.map((r) => {
            const a = annotations[r.invoiceNumber] || {};
            const isMulti = multiMonthSet.has(r.entityId || r.customerId);
            return (
              <tr key={r.invoiceNumber} className={isMulti ? "multi-month" : ""}>
                <td className="font-mono text-[11px] text-zoca-textMuted tabnum">{r.customerId}</td>
                <td className="font-mono text-[11px] text-zoca-textMuted tabnum">{r.entityId}</td>
                <td className="font-medium text-zoca-text">{r.bizName}</td>
                <td>
                  {onAmClick && r.amName ? (
                    <button
                      type="button"
                      onClick={() => onAmClick(r.amName)}
                      className="text-zoca-pink hover:text-zoca-pinkHover hover:underline underline-offset-2 transition-colors"
                      title={`Filter by ${r.amName}`}
                    >
                      {r.amName}
                    </button>
                  ) : (
                    <span className="text-zoca-pink">{r.amName}</span>
                  )}
                </td>
                <td><SubPill s={r.subscriptionStatus} /></td>
                <td className="text-zoca-textMuted">{r.cancellingAt}</td>
                <td className="font-mono text-[11px] tabnum">{r.invoiceNumber}</td>
                <td>{r.achStatus ? <AchPill s={r.achStatus} /> : <span className="text-zoca-textDim">—</span>}</td>
                <td className={r.autoDebit === "On" ? "text-zoca-text" : "text-zoca-textMuted"}>
                  {r.autoDebit || "—"}
                </td>
                <td>
                  <EditableText
                    value={a.amComment || ""}
                    onSave={(v) => onSave(r.invoiceNumber, { amComment: v })}
                  />
                </td>
                <td className="whitespace-nowrap font-mono text-[11px] tabnum">{r.invoiceDate}</td>
                <td>{r.customerFirstName}</td>
                <td className="text-zoca-textMuted">{r.customerEmail}</td>
                <td className="whitespace-nowrap text-zoca-textMuted">{r.phoneNumber}</td>
                <td className="text-zoca-textMuted">{r.customerCompany}</td>
                <td className="text-right tabular-nums whitespace-nowrap">
                  <span className="font-mono font-bold mr-2">{fmt(r.amountDue)}</span>
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
                <td>
                  <EditableText
                    value={a.comments || ""}
                    onSave={(v) => onSave(r.invoiceNumber, { comments: v })}
                  />
                </td>
                <td>
                  <EditableText
                    value={a.oldComments || ""}
                    onSave={(v) => onSave(r.invoiceNumber, { oldComments: v })}
                  />
                </td>
                <td>
                  <div className="flex flex-col gap-1.5 min-w-[200px]">
                    {r.latestTicket ? (
                      <a
                        href={r.latestTicket.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={r.latestTicket.title}
                        className="inline-flex items-center gap-2 px-2 py-1 rounded-md text-[11px] font-medium transition-colors group"
                        style={{
                          background: "rgba(120, 104, 244, 0.12)",
                          border: "1px solid rgba(120, 104, 244, 0.30)",
                          color: "#5d4fd4"
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: "#7868f4" }}
                        />
                        <span className="font-mono font-semibold whitespace-nowrap">
                          {r.latestTicket.id}
                        </span>
                        <span className="truncate max-w-[160px] text-zoca-text group-hover:underline underline-offset-2">
                          {r.latestTicket.title}
                        </span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-zoca-textDim italic px-1">
                        no active ticket
                      </span>
                    )}
                    <EditableText
                      value={a.tickets || ""}
                      onSave={(v) => onSave(r.invoiceNumber, { tickets: v })}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
