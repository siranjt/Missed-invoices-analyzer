"use client";
import { useEffect, useMemo, useState } from "react";
import type { InvoiceRow, AnnotationsMap } from "@/lib/types";
import KpiCards from "./kpi-cards";
import Charts from "./charts";
import Filters, { type FilterState } from "./filters";
import InvoicesTable from "./invoices-table";
import ExportButton from "./export-button";
import { RefreshCw } from "lucide-react";

type Tab = "All" | "May" | "April" | "March";
const TABS: Tab[] = ["All", "May", "April", "March"];

export default function Dashboard() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [annotations, setAnnotations] = useState<AnnotationsMap>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [filters, setFilters] = useState<FilterState>({
    q: "",
    am: "",
    status: "",
    month: "",
    ach: "",
    autoDebit: "",
    multiOnly: false
  });

  async function loadInvoices(refresh = false) {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/invoices${refresh ? "?refresh=1" : ""}`);
      if (!r.ok) {
        let errMsg = `HTTP ${r.status}`;
        try {
          const txt = await r.text();
          try { const j = JSON.parse(txt); errMsg = j?.error || errMsg; }
          catch { errMsg = txt.slice(0, 200) || errMsg; }
        } catch {}
        throw new Error(errMsg);
      }

      const ct = r.headers.get("content-type") || "";

      if (ct.includes("ndjson") || ct.includes("text/plain")) {
        if (!r.body) throw new Error("Empty response body");
        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let gotAnyRows = false;

        const handleLine = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          let msg: any;
          try { msg = JSON.parse(trimmed); } catch { return; }
          if (msg.type === "error") throw new Error(msg.error || "Server error");
          if (msg.type === "partial" || msg.type === "complete") {
            if (Array.isArray(msg.rows)) { setRows(msg.rows); gotAnyRows = true; }
            if (msg.fetchedAt) setFetchedAt(msg.fetchedAt);
            setLoading(false);
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl;
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            handleLine(line);
          }
        }
        if (buffer.trim()) handleLine(buffer);
        if (!gotAnyRows) throw new Error("Stream ended with no rows");
      } else {
        const data = await r.json();
        if (data?.error) throw new Error(data.error);
        setRows(data.rows || []);
        setFetchedAt(data.fetchedAt || null);
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadAnnotations() {
    try {
      const r = await fetch("/api/annotations");
      const data = await r.json();
      setAnnotations(data.annotations || {});
    } catch {}
  }

  useEffect(() => {
    loadInvoices();
    loadAnnotations();
  }, []);

  const multiMonthSet = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const r of rows) {
      const key = r.entityId || r.customerId;
      if (!key) continue;
      if (!m.has(key)) m.set(key, new Set());
      if (r.invoiceMonth) m.get(key)!.add(r.invoiceMonth);
    }
    const out = new Set<string>();
    for (const [k, s] of m) if (s.size >= 2) out.add(k);
    return out;
  }, [rows]);

  const tabFiltered = useMemo(() => {
    if (activeTab === "All") return rows;
    return rows.filter((r) => r.invoiceMonth === activeTab);
  }, [rows, activeTab]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return tabFiltered.filter((r) => {
      if (q) {
        const blob = `${r.bizName} ${r.amName} ${r.customerId} ${r.invoiceNumber} ${r.customerEmail} ${r.customerCompany}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      if (filters.am && r.amName !== filters.am) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.month && r.invoiceMonth !== filters.month) return false;
      if (filters.ach === "in_progress" && r.achStatus !== "In Progress") return false;
      if (filters.ach === "none" && r.achStatus) return false;
      if (filters.autoDebit && r.autoDebit !== filters.autoDebit) return false;
      if (filters.multiOnly) {
        const key = r.entityId || r.customerId;
        if (!multiMonthSet.has(key)) return false;
      }
      return true;
    });
  }, [tabFiltered, filters, multiMonthSet]);

  const tabCounts = useMemo(() => {
    const m: Record<Tab, number> = { All: rows.length, May: 0, April: 0, March: 0 };
    for (const r of rows) {
      if (r.invoiceMonth === "May") m.May++;
      else if (r.invoiceMonth === "April") m.April++;
      else if (r.invoiceMonth === "March") m.March++;
    }
    return m;
  }, [rows]);

  async function saveAnnotation(invoiceNumber: string, patch: any) {
    setAnnotations((prev) => ({
      ...prev,
      [invoiceNumber]: { ...(prev[invoiceNumber] || {}), ...patch }
    }));
    try {
      await fetch("/api/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceNumber, patch })
      });
    } catch {}
  }

  const lastFetchLabel = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="space-y-5">
      {/* Top wordmark */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg display font-extrabold text-zoca-purpleDark"
            style={{ background: "linear-gradient(135deg, #ffa8cd, #ff8eb8)", fontSize: 16 }}
          >Z</span>
          <span className="text-sm font-semibold tracking-wider">ZOCA</span>
          <span className="text-zoca-strokeStrong">·</span>
          <span className="text-sm text-zoca-textMuted">Missed Invoice Tracker</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-zoca-textMuted">
          <span className="flex items-center gap-1.5">
            <span className="live-dot inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#8de0a3", boxShadow: "0 0 6px #8de0a3" }} />
            Live data
          </span>
          <span className="opacity-40">·</span>
          <span>Chargebee + Metabase + Linear</span>
        </div>
      </div>

      {/* Hero */}
      <div className="text-center pt-10 pb-6">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] mb-5"
          style={{ background: "rgba(31,22,69,0.6)", border: "1px solid #3d2c7d", color: "#c4b5e8", backdropFilter: "blur(10px)" }}
        >
          <span className="live-dot inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#8de0a3", boxShadow: "0 0 6px #8de0a3" }} />
          Finance ops · refresh on demand
        </div>
        <h1 className="display font-extrabold leading-none mb-4" style={{ fontSize: 60, letterSpacing: "-0.025em" }}>
          Missed Invoice <span className="gradient-title">Tracker</span>
          <span className="sparkle ml-1.5 align-top text-zoca-pink" style={{ fontSize: 28 }}>✦</span>
        </h1>
        <p className="text-base text-zoca-textMuted max-w-[640px] mx-auto leading-relaxed mb-5">
          Unpaid Chargebee invoices, enriched with AM ownership and live Linear ticket
          matching — so the team always knows who owes what and who's already on it.
        </p>
        <div className="flex justify-center gap-7 text-xs text-zoca-textMuted">
          <span className="flex items-center gap-1.5"><span className="text-zoca-pink">✱</span>Live</span>
          <span className="flex items-center gap-1.5"><span style={{ color: "#7868f4" }}>✱</span>Streaming pipeline</span>
          <span className="flex items-center gap-1.5"><span style={{ color: "#8de0a3" }}>✱</span>Persisted annotations</span>
        </div>
      </div>

      {error && (
        <div className="card-zoca text-sm" style={{ background: "rgba(58,20,42,0.6)", borderColor: "#7d2052", color: "#ffd6e7" }}>
          {error}
        </div>
      )}

      <Filters value={filters} onChange={setFilters} rows={rows} />

      {/* Status row */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-1">
        <div className="text-[11px] uppercase tracking-[0.12em] text-zoca-textMuted">
          Showing <span className="text-emerald-300 font-bold">{filtered.length}</span> / {rows.length}
          {lastFetchLabel && (<> · Last refresh <span className="text-zoca-text font-semibold">{lastFetchLabel}</span></>)}
        </div>
        <div className="flex gap-2">
          <ExportButton rows={filtered} annotations={annotations} multiMonthSet={multiMonthSet} />
          <button
            onClick={() => loadInvoices(true)}
            disabled={refreshing}
            className="btn-zoca"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh live data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="card-zoca !rounded-full !p-1.5 inline-flex gap-1 flex-wrap w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={activeTab === t}
            onClick={() => setActiveTab(t)}
            className="tab-pill"
          >
            {t} <span className="opacity-70 ml-1 text-[11px]">({tabCounts[t]})</span>
          </button>
        ))}
      </div>

      <KpiCards rows={filtered} multiMonthSet={multiMonthSet} annotations={annotations} />
      <Charts rows={filtered} />
      <InvoicesTable
        rows={filtered}
        annotations={annotations}
        onSave={saveAnnotation}
        loading={loading}
        multiMonthSet={multiMonthSet}
      />
    </div>
  );
}
