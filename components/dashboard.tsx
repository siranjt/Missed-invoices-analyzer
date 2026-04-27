"use client";
import { useEffect, useMemo, useState } from "react";
import type { InvoiceRow, AnnotationsMap } from "@/lib/types";
import KpiCards from "./kpi-cards";
import Charts from "./charts";
import Filters, { type FilterState } from "./filters";
import InvoicesTable from "./invoices-table";
import ExportButton from "./export-button";
import { RefreshCw } from "lucide-react";

export default function Dashboard() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [annotations, setAnnotations] = useState<AnnotationsMap>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
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
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to load invoices");
      setRows(data.rows || []);
      setFetchedAt(data.fetchedAt || null);
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

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return rows.filter((r) => {
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
  }, [rows, filters, multiMonthSet]);

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

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Missed Invoice Tracker</h1>
          <p className="text-xs text-gray-500">
            Live Chargebee + Metabase
            {fetchedAt ? ` · last fetch ${new Date(fetchedAt).toLocaleString()}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadInvoices(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <ExportButton rows={filtered} annotations={annotations} multiMonthSet={multiMonthSet} />
        </div>
      </header>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-800 text-sm border border-red-200">
          {error}
        </div>
      )}

      <KpiCards rows={filtered} multiMonthSet={multiMonthSet} />
      <Charts rows={filtered} />
      <Filters value={filters} onChange={setFilters} rows={rows} />
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
