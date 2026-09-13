import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0c0c0e",
          raised: "#141417",
          overlay: "#1a1a1f",
          border: "#27272a",
          "border-subtle": "#1f1f23",
        },
        zinc: {
          950: "#09090b",
          900: "#18181b",
          850: "#1f1f23",
          800: "#27272a",
          700: "#3f3f46",
          600: "#52525b",
          500: "#71717a",
          400: "#a1a1aa",
          300: "#d4d4d8",
          200: "#e4e4e7",
          100: "#f4f4f5",
          50: "#fafafa",
        },
        accent: {
          DEFAULT: "#3b82f6",
          soft: "#60a5fa",
          muted: "#1d4ed8",
          dim: "#1e3a5f",
        },
        chart: {
          blue: "#3b82f6",
          purple: "#8b5cf6",
          orange: "#f97316",
          green: "#22c55e",
          teal: "#2dd4bf",
          pink: "#ec4899",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        card: "0 0 0 1px rgba(255,255,255,0.03), 0 4px 24px rgba(0,0,0,0.35)",
        "card-hover":
          "0 0 0 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.45)",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
