import type { Config } from "tailwindcss";

/**
 * Buku Besar — a personal ledger printed in reverse.
 * Black paper, white ink, oxblood for money out, banker green for money in.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#0D0C0B",
        block: "#171613",
        raised: "#221F1B",
        ink: "#F3F0E9",
        muted: "#B8B0A1",
        faint: "#8A8175",
        rule: {
          hair: "#2C2823",
          dense: "#5A5348",
          strong: "#8A8175",
        },
        deb: {
          DEFAULT: "#D6584A",
          deep: "#B03A2E",
        },
        cre: {
          DEFAULT: "#5FA97A",
          deep: "#3E7F57",
        },
        ult: {
          DEFAULT: "#6E86C8",
          deep: "#4F66A8",
        },
        brass: "#C9A227",
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        md: "3px",
        lg: "4px",
        xl: "6px",
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "Archivo", "Helvetica", "sans-serif"],
        mono: ["var(--font-ledger-mono)", "Spline Sans Mono", "monospace"],
      },
      fontSize: {
        micro: ["10px", { lineHeight: "1.4", letterSpacing: "0.14em", fontWeight: "600" }],
        label: ["11px", { lineHeight: "1.4", letterSpacing: "0.1em", fontWeight: "600" }],
        caption: ["12px", { lineHeight: "1.5", letterSpacing: "0.01em" }],
        note: ["13px", { lineHeight: "1.5" }],
        body: ["14px", { lineHeight: "1.55" }],
        read: ["15px", { lineHeight: "1.6" }],
        lead: ["18px", { lineHeight: "1.45" }],
        figure: ["20px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        total: ["24px", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        figureLg: ["28px", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        head: ["22px", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "700" }],
        title: ["30px", { lineHeight: "1.12", letterSpacing: "-0.02em", fontWeight: "700" }],
        mast: ["38px", { lineHeight: "1.02", letterSpacing: "-0.03em", fontWeight: "700" }],
      },
      keyframes: {
        slip: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        slip: "slip 170ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
