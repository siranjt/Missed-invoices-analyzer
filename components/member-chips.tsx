"use client";
import { useMemo } from "react";
import type { InvoiceRow } from "@/lib/types";

/**
 * One pill per AM, each with its own deterministic accent color.
 * Click toggles the AM filter.
 *
 * Color is hashed from the AM name so Joshi is always the same green, etc.
 */
const PALETTE = [
  "#f87171", // red
  "#fb923c", // orange
  "#facc15", // yellow
  "#4ade80", // green
  "#22d3ee", // cyan
  "#60a5fa", // blue
  "#a78bfa", // violet
  "#f472b6", // pink
  "#34d399", // teal
  "#e879f9", // fuchsia
  "#fbbf24", // amber
  "#818cf8", // indigo
  "#a3e635", // lime
  "#2dd4bf", // emerald
  "#fb7185" // rose
];

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export default function MemberChips({
  rows,
  activeAm,
  onSelect
}: {
  rows: InvoiceRow[];
  activeAm: string;
  onSelect: (am: string) => void;
}) {
  const ams = useMemo(
    () => Array.from(new Set(rows.map((r) => r.amName).filter(Boolean))).sort(),
    [rows]
  );
  if (ams.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {ams.map((am) => {
        const c = colorFor(am);
        const active = activeAm === am;
        return (
          <button
            key={am}
            onClick={() => onSelect(active ? "" : am)}
            className="chip-zoca inline-flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full border text-[12.5px] font-semibold transition-colors"
            style={{
              borderColor: active ? c : `${c}55`,
              color: c,
              background: active ? `${c}1a` : "transparent"
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: c }}
            />
            {am}
          </button>
        );
      })}
    </div>
  );
}

export { colorFor };
