import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Zoca twilight-slate — medium-dark slate-purple. Easier on the eyes
        // than pure black for long sessions; brand colors still pop. Montserrat
        // across the board.
        zoca: {
          // Canvas + surfaces
          canvas: "#1f1a2e",         // page background — slate-purple
          surface: "#2d2841",         // card / table fill
          surfaceHover: "#353050",    // row hover
          thead: "#262134",           // table header (slightly darker than card)
          searchBg: "#1a162a",        // input background
          trackBg: "#3d3658",         // chart bar/donut tracks

          // Borders
          border: "#3d3658",
          borderStrong: "#5a4f7a",

          // Text
          text: "#f5f0ff",            // primary
          textSecondary: "#cfc4ee",
          textMuted: "#b3a7ce",
          textDim: "#7d6f9d",

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
