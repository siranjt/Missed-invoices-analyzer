import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Zoca dark — modern, data-dense
        zoca: {
          // Canvas + surfaces
          canvas: "#0a0613",        // page background
          surface: "#110d24",        // card / table fill
          surfaceHover: "#1a1438",   // row hover
          thead: "#18133a",          // table header
          searchBg: "#0d0820",       // input background
          trackBg: "#221a45",        // chart bar tracks

          // Borders
          border: "#1f1a3d",         // default
          borderStrong: "#2a2451",   // hover / inputs

          // Text
          text: "#f5f0ff",           // primary
          textSecondary: "#cfc4ee",
          textMuted: "#a89cc6",
          textDim: "#6b5b8e",

          // Brand accents (kept from old theme)
          pink: "#ffa8cd",
          pinkHover: "#f695be",
          pinkInk: "#1a0e2e",        // text on pink
          purple: "#7868f4",
          purpleDeep: "#1f0843",
          lavender: "#c4b5e8",

          // Semantic
          green: "#4ade80",
          red: "#f87171",
          amber: "#fb923c"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "Bricolage Grotesque", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        zoca: "0.5rem"
      }
    }
  },
  plugins: []
};

export default config;
