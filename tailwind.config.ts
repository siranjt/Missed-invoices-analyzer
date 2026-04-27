import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        zoca: {
          blue: "#4472C4",
          softBlue: "#E6F1FB",
          red: "#E24B4A",
          softRed: "#FCEBEB",
          green: "#1D9E75",
          softGreen: "#EAF3DE",
          amber: "#EF9F27",
          softAmber: "#FAEEDA"
        }
      }
    }
  },
  plugins: []
};

export default config;
