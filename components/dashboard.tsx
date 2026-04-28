"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { InvoiceRow, AnnotationsMap } from "@/lib/types";
import KpiCards from "./kpi-cards";
import Charts from "./charts";
import Filters, { type FilterState } from "./filters";
import InvoicesTable from "./invoices-table";
import ExportButton from "./export-button";
import UserMenu from "./user-menu";
import { RefreshCw } from "lucide-react";

type Tab = "All" | "April" | "March" | "February";
const TABS: Tab[] = ["All", "April", "March", "February"];

const DEFAULT_FILTERS: FilterState = {
  q: "",
  am: "",
  status: "",
  month: "",
  ach: "",
  autoDebit: "",
  multiOnly: false
};

function parseTab(v: string | null): Tab {
  return v === "April" || v === "March" || v === "February" ? v : "All";
}

function parseFilters(sp: URLSearchParams): FilterState {
  return {
    q: sp.get("q") || "",
    am: sp.get("am") || "",
    status: sp.get("status") || "",
    month: sp.get("month") || "",
    ach: sp.get("ach") || "",
    autoDebit: sp.get("autoDebit") || "",
    multiOnly: sp.get("multiOnly") === "1"
  };
}

function buildSearchString(tab: Tab, filters: FilterState): string {
  const sp = new URLSearchParams();
  if (tab !== "All") sp.set("tab", tab);
  if (filters.q) sp.set("q", filters.q);
  if (filters.am) sp.set("am", filters.am);
  if (filters.status) sp.set("status", filters.status);
  if (filters.month) sp.set("month", filters.month);
  if (filters.ach) sp.set("ach", filters.ach);
  if (filters.autoDebit) sp.set("autoDebit", filters.autoDebit);
  if (filters.multiOnly) sp.set("multiOnly", "1");
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [annotations, setAnnotations] = useState<AnnotationsMap>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  // Initial state hydrated from the URL so shared/bookmarked links open with
  // the same view. After mount, state changes flow back into the URL.
  const [activeTab, setActiveTab] = useState<Tab>(() =>
    parseTab(searchParams.get("tab"))
  );
  const [filters, setFilters] = useState<FilterState>(() => parseFilters(searchParams));

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

  // Sync state → URL (replace, don't push, so we don't pollute history).
  const lastSearchRef = useRef<string>("");
  useEffect(() => {
    const next = buildSearchString(activeTab, filters);
    if (next === lastSearchRef.current) return;
    lastSearchRef.current = next;
    router.replace(`${pathname}${next}`, { scroll: false });
  }, [activeTab, filters, pathname, router]);

  // Sync URL → state on browser back/forward (popstate). The router doesn't
  // re-fire useState initializers, so we reconcile manually.
  useEffect(() => {
    const fromUrl = searchParams.toString();
    if (fromUrl === lastSearchRef.current.replace(/^\?/, "")) return;
    setActiveTab(parseTab(searchParams.get("tab")));
    setFilters(parseFilters(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  // Apply tab month filter first, then user filters
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
    const m: Record<Tab, number> = { All: rows.length, April: 0, March: 0, February: 0 };
    for (const r of rows) {
      if (r.invoiceMonth === "April") m.April++;
      else if (r.invoiceMonth === "March") m.March++;
      else if (r.invoiceMonth === "February") m.February++;
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

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="display text-2xl font-bold text-zoca-purpleDark">Missed Invoice Tracker</h1>
          <p className="text-xs text-zoca-neutral40 mt-1">
            Live Chargebee + Metabase
            {fetchedAt ? ` · last fetch ${new Date(fetchedAt).toLocaleString()}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadInvoices(true)}
            disabled={refreshing}
            className="btn-ghost"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <ExportButton rows={filtered} annotations={annotations} multiMonthSet={multiMonthSet} />
          <UserMenu />
        </div>
      </header>

      {error && (
        <div className="card-zoca text-sm" style={{ background: "#fff0f3", borderColor: "#ffd6e1", color: "#9b1d3b" }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div role="tablist" className="flex gap-1 flex-wrap card-zoca !p-1.5 inline-flex w-fit">
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
