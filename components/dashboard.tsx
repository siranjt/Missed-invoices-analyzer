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
import {
  KpiCardsSkeleton,
  ChartsSkeleton,
  FiltersSkeleton,
  InvoicesTableSkeleton
} from "./skeletons";
import { RefreshCw, X } from "lucide-react";

type Tab = "All" | "April" | "March" | "February";
const TABS: Tab[] = ["All", "April", "March", "February"];

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
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(txt || `Failed to load invoices (${r.status})`);
      }
      const ct = r.headers.get("content-type") || "";

      // Streaming NDJSON: progressive partial → complete.
      if (ct.includes("ndjson") && r.body) {
        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let gotAny = false;
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const raw of lines) {
            const line = raw.trim();
            if (!line) continue;
            let msg: any;
            try { msg = JSON.parse(line); } catch { continue; }
            if (msg.type === "partial" || msg.type === "complete") {
              setRows(msg.rows || []);
              if (msg.fetchedAt) setFetchedAt(msg.fetchedAt);
              gotAny = true;
              if (msg.type === "partial") {
                // We have something on screen now — stop the skeleton.
                setLoading(false);
              }
            } else if (msg.type === "error") {
              throw new Error(msg.error || "Stream error");
            }
          }
        }
        if (!gotAny) throw new Error("Empty response from /api/invoices");
        return;
      }

      // Fallback: plain JSON (e.g. unexpected proxy transformation).
      const data = await r.json();
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

  // Show skeletons only on the first paint, when we have no data at all yet.
  // Subsequent refreshes keep the existing UI and rely on the Refresh-button
  // spinner for feedback.
  const firstLoad = loading && rows.length === 0;

  const tabCounts = useMemo(() => {
    const m: Record<Tab, number> = { All: rows.length, April: 0, March: 0, February: 0 };
    for (const r of rows) {
      if (r.invoiceMonth === "April") m.April++;
      else if (r.invoiceMonth === "March") m.March++;
      else if (r.invoiceMonth === "February") m.February++;
    }
    return m;
  }, [rows]);

  // Drill-down: click an AM (in chart or table) to filter to that AM and
  // scroll the table into view.
  const tableRef = useRef<HTMLDivElement>(null);
  function handleAmClick(amName: string) {
    setFilters((f) => ({ ...f, am: amName }));
    requestAnimationFrame(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

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
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[10px] tracking-[0.18em] text-zoca-purple uppercase font-medium">
            Zoca · Finance
          </div>
          <h1 className="display text-[22px] font-semibold text-zoca-text mt-0.5">
            Missed invoice tracker
          </h1>
          <p className="text-[11px] text-zoca-textDim mt-1">
            Live Chargebee + Metabase
            {fetchedAt ? `  ·  last fetch ${new Date(fetchedAt).toLocaleString()}` : ""}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => loadInvoices(true)}
            disabled={refreshing}
            className="btn-ghost"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <ExportButton rows={filtered} annotations={annotations} multiMonthSet={multiMonthSet} />
          <UserMenu />
        </div>
      </header>

      {error && (
        <div
          className="card-zoca text-[12px]"
          style={{
            background: "rgba(248,113,113,0.08)",
            borderColor: "rgba(248,113,113,0.30)",
            color: "#fca5a5"
          }}
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <div
        role="tablist"
        className="inline-flex gap-1 flex-wrap p-1 rounded-full bg-zoca-surface border border-zoca-border w-fit"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={activeTab === t}
            onClick={() => setActiveTab(t)}
            className="tab-pill"
          >
            {t}
            <span className="opacity-70 text-[11px] tabnum">{tabCounts[t]}</span>
          </button>
        ))}
      </div>

      {firstLoad ? (
        <>
          <KpiCardsSkeleton />
          <ChartsSkeleton />
          <FiltersSkeleton />
          <InvoicesTableSkeleton />
        </>
      ) : (
        <>
          <KpiCards rows={filtered} multiMonthSet={multiMonthSet} />
          <Charts rows={filtered} onAmClick={handleAmClick} />
          <Filters value={filters} onChange={setFilters} rows={rows} />
          {filters.am && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-zoca-textMuted">Drilled into AM:</span>
              <span
                className="pill"
                style={{ background: "rgba(120,104,244,0.16)", color: "#c4b5e8" }}
              >
                {filters.am}
              </span>
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, am: "" }))}
                className="inline-flex items-center gap-1 text-zoca-textMuted hover:text-zoca-text transition-colors"
              >
                <X size={11} />
                Clear
              </button>
            </div>
          )}
          <div ref={tableRef}>
            <InvoicesTable
              rows={filtered}
              annotations={annotations}
              onSave={saveAnnotation}
              loading={loading}
              multiMonthSet={multiMonthSet}
              onAmClick={handleAmClick}
            />
          </div>
        </>
      )}
    </div>
  );
}
