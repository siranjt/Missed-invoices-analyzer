import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Zoca light — clean, vibrant, same Bricolage/Inter/JetBrains Mono fonts.
        zoca: {
          // Canvas + surfaces
          canvas: "#faf9fc", // subtle lavender-tinted off-white
          surface: "#ffffff", // pure white card
          surfaceHover: "#f5f1fb",
          thead: "#f5f1fb", // light lavender table header
          searchBg: "#ffffff",
          trackBg: "#ece6f7", // light track for chart bar backgrounds

          // Borders
          border: "#e9e3f5",
          borderStrong: "#d8cef0",

          // Text (dark on light)
          text: "#1a0e2e", // primary
          textSecondary: "#3d2f5e",
          textMuted: "#6b5b8e",
          textDim: "#9b8bc0",

          // Brand accents (kept saturated)
          pink: "#ffa8cd",
          pinkHover: "#f695be",
          pinkInk: "#1a0e2e", // text on pink button
          purple: "#7868f4",
          purpleDeep: "#1f0843",
          lavender: "#c4b5e8",

          // Semantic
          green: "#22c55e",
          red: "#ef4444",
          amber: "#f59e0b",
          cyan: "#06b6d4"
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
