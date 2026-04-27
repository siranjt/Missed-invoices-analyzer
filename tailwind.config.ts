import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        zoca: {
          pink: "#ffa8cd",
          pinkHover: "#f695be",
          pinkSoft: "#ffe0ee",
          purple: "#1f0843",
          purpleDark: "#0b051d",
          purpleSoft: "#f3edfd",
          purpleAccent: "#7868f4",
          neutral0: "#030209",
          neutral40: "#5d5d5d",
          neutral80: "#9b9b9b",
          stroke: "#e7e7e7",
          bg: "#f6f6f6",
          bgWhite: "#ffffff"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Gothic A1", "Inter", "Arial", "sans-serif"]
      },
      borderRadius: {
        zoca: "0.5rem"
      },
      boxShadow: {
        zocaCard: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
        zocaPop: "0 4px 16px rgba(31,8,67,0.08), 0 0 0 1px rgba(0,0,0,0.04)"
      }
    }
  },
  plugins: []
};

export default config;
