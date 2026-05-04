import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        zoca: {
          // Primary blue/purple/pink gradient ramp
          blue: "#3b82f6",
          blueDeep: "#2563eb",
          indigo: "#6366f1",
          purple: "#8b5cf6",
          pink: "#ec4899",
          pinkDeep: "#be185d",
          // Surfaces
          bg: "#ffffff",
          surface: "#ffffff",
          surfaceMuted: "#f8fafc",
          stroke: "#e6e8ee",
          strokeStrong: "#cbd5e1",
          // Text
          text: "#0f172a",
          textMuted: "#64748b",
          textDim: "#94a3b8",
          // Semantic
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "Arial", "sans-serif"]
      },
      borderRadius: {
        zoca: "0.625rem"
      },
      boxShadow: {
        zocaCard: "0 1px 3px rgba(15,23,42,0.04)",
        zocaPop: "0 6px 18px rgba(59,130,246,0.12)"
      }
    }
  },
  plugins: []
};

export default config;
