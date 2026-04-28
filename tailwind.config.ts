import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Zoca dark — modern, vibrant, spacious. Montserrat across the board.
        zoca: {
          // Canvas + surfaces
          canvas: "#0a0613",         // page background
          surface: "#110d24",         // card / table fill
          surfaceHover: "#1a1438",    // row hover
          thead: "#18133a",           // table header
          searchBg: "#0d0820",        // input background
          trackBg: "#221a45",         // chart bar/donut tracks

          // Borders
          border: "#1f1a3d",
          borderStrong: "#2a2451",

          // Text
          text: "#f5f0ff",            // primary on dark
          textSecondary: "#cfc4ee",
          textMuted: "#a89cc6",
          textDim: "#6b5b8e",

          // Brand accents (sourced from zoca.com)
          pink: "#ffa8cd",
          pinkHover: "#f695be",
          pinkInk: "#1a0e2e",         // text on pink button
          purple: "#7868f4",
          purpleDeep: "#1f0843",
          lavender: "#c4b5e8",
          blue: "#4d65ff",            // zoca.com focus state blue

          // Semantic
          green: "#4ade80",
          red: "#f87171",
          amber: "#facc15",
          orange: "#fb923c",
          cyan: "#22d3ee"
        }
      },
      fontFamily: {
        // Montserrat across the board, matching zoca.com.
        sans: ["var(--font-montserrat)", "Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-montserrat)", "Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"]
      },
      borderRadius: {
        zoca: "0.5rem"
      }
    }
  },
  plugins: []
};

export default config;
