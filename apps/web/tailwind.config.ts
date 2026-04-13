import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "var(--ink)",
          secondary: "var(--ink-secondary)",
          tertiary: "var(--ink-tertiary)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          subtle: "var(--accent-subtle)",
        },
        success: "var(--success)",
        danger: {
          DEFAULT: "var(--danger)",
          subtle: "var(--danger-subtle)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "Georgia", "serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
