import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050914",
        panel: "#0d1424",
        "panel-soft": "#121d32",
        "panel-glass": "rgba(13, 20, 36, 0.74)",
        line: "rgba(148, 163, 184, 0.16)",
        mint: "#2dd4bf",
        cyan: "#38bdf8",
        violet: "#8b5cf6",
        gold: "#f8c14a",
        coral: "#fb7185"
      },
      boxShadow: {
        glow: "0 0 34px rgba(56, 189, 248, 0.16), 0 0 18px rgba(45, 212, 191, 0.12)",
        premium: "0 0 42px rgba(248, 193, 74, 0.16), 0 18px 60px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
        panel: "0 18px 60px rgba(0, 0, 0, 0.24)"
      },
      keyframes: {
        sheen: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" }
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        sheen: "sheen 2.8s ease-in-out infinite",
        rise: "rise 360ms ease-out both"
      }
    }
  },
  plugins: []
};

export default config;
