"use client";
import type { InvoiceRow } from "@/lib/types";

/**
 * Editorial hero header — centered subtitle pill, large display heading with
 * second-word accent + sparkle ornament, prose description naming the AMs in
 * scope, and three feature pills.
 */
export default function Hero({ rows }: { rows: InvoiceRow[] }) {
  // Names of AMs we have invoices for (sorted for stability)
  const ams = Array.from(new Set(rows.map((r) => r.amName).filter(Boolean))).sort();
  const namesSentence = ams.length
    ? `for ${ams.slice(0, -1).join(", ")}${ams.length > 1 ? ", and " : ""}${
        ams[ams.length - 1]
      }`
    : "across the Customer Success team";

  return (
    <section className="text-center max-w-3xl mx-auto pt-2 pb-2">
      {/* Subtitle pill */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zoca-surface/70 border border-zoca-border text-[11px] text-zoca-textSecondary">
        <span className="w-1.5 h-1.5 rounded-full bg-zoca-pink" />
        Customer Success · live from Chargebee
      </div>

      {/* Display heading */}
      <h1 className="font-display text-[68px] leading-[1.02] font-bold mt-5 tracking-tight">
        Missed invoice{" "}
        <span className="relative inline-block">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #ffd1e3 0%, #ffa8cd 55%, #d488b1 100%)"
            }}
          >
            Tracker
          </span>
          <Sparkle className="absolute -top-3 -right-7 w-7 h-7 text-zoca-pink" />
        </span>
      </h1>

      {/* Description */}
      <p className="text-[14px] text-zoca-textSecondary mt-5 px-6 leading-[1.55]">
        Who owes what, for how long, and which AM is on the call —{" "}
        <span className="text-zoca-text">{namesSentence}</span>. Refreshes from
        Chargebee + Metabase every time you open this page.
      </p>

      {/* Feature pills */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-[12px] text-zoca-textSecondary">
        <FeaturePill>Full invoice list</FeaturePill>
        <FeaturePill>Per-AM drill-down</FeaturePill>
        <FeaturePill>Multi-month tracking</FeaturePill>
      </div>
    </section>
  );
}

function FeaturePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Sparkle className="w-3 h-3 text-zoca-pink" />
      {children}
    </span>
  );
}

function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2 L13.6 9.4 L21 12 L13.6 14.6 L12 22 L10.4 14.6 L3 12 L10.4 9.4 Z" />
    </svg>
  );
}
