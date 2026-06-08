import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Mono", "monospace"],
      },
      colors: {
        bg: "#030303",
        surface: "#0d0d10",
        "surface-2": "#111116",
        border: "#1c1c24",
        "border-bright": "#2a2a38",
        purple: {
          DEFAULT: "#a855f7",
          dim: "rgba(168,85,247,0.15)",
          glow: "rgba(168,85,247,0.4)",
        },
        cyan: {
          DEFAULT: "#22d3ee",
          dim: "rgba(34,211,238,0.12)",
        },
        green: {
          DEFAULT: "#4ade80",
          dim: "rgba(74,222,128,0.12)",
        },
        yellow: {
          DEFAULT: "#fbbf24",
          dim: "rgba(251,191,36,0.12)",
        },
      },
      animation: {
        "gradient-x": "gradient-x 8s ease infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "spin-slow": "spin 20s linear infinite",
      },
      keyframes: {
        "gradient-x": {
          "0%,100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { "background-position": "-200% 0" },
          "100%": { "background-position": "200% 0" },
        },
      },
      backgroundSize: {
        "300%": "300%",
      },
    },
  },
  plugins: [],
} satisfies Config;
