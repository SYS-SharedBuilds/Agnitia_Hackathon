/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "1920px",
      "4xl": "2560px",
    },
    extend: {
      colors: {
        // Core Theme & Structural UI Elements
        canvas: "#F8FAFC",
        background: "#F8FAFC",
        card: "#FFFFFF",
        "card-foreground": "#0F172A",
        border: "#E2E8F0",

        // Primary & Secondary Typography
        "text-primary": "#0F172A",
        "text-secondary": "#475569",

        // Status & Workflow State Tones
        status: {
          active: {
            DEFAULT: "#22C55E",
            bg: "#F0FDF4",
          },
          running: {
            DEFAULT: "#2563EB",
            bg: "#EFF6FF",
          },
          retry: {
            DEFAULT: "#EEB930",
            bg: "#FEFCE8",
          },
          failed: {
            DEFAULT: "#ED2C2C",
            bg: "#FEF2F2",
            halo: "#ED2C2CB3",
          },
          compensated: {
            DEFAULT: "#8B7B65",
            bg: "#F5F5F4",
          },
        },

        // Slate & Gray Scale
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },

        // Material / Structural Design Tokens mapped to theme
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#ffffff",
        "surface-container": "#f8fafc",
        "surface-container-high": "#f1f5f9",
        "surface-container-highest": "#e2e8f0",
        surface: "#ffffff",
        "surface-dim": "#f8fafc",
        "surface-bright": "#ffffff",
        "surface-variant": "#f1f5f9",
        "inverse-surface": "#0f172a",
        "inverse-on-surface": "#ffffff",

        // Brand & Interactive Colors
        primary: "#0F172A",
        "primary-container": "#1E293B",
        "primary-fixed": "#F1F5F9",
        "primary-fixed-dim": "#E2E8F0",
        "on-primary": "#FFFFFF",
        "on-primary-container": "#FFFFFF",
        "on-primary-fixed": "#0F172A",
        "on-primary-fixed-variant": "#1E293B",
        "inverse-primary": "#CBD5E1",
        "surface-tint": "#2563EB",

        secondary: "#2563EB",
        "secondary-container": "#EFF6FF",
        "secondary-fixed": "#DBEAFE",
        "secondary-fixed-dim": "#BFDBFE",
        "on-secondary": "#FFFFFF",
        "on-secondary-container": "#1E40AF",
        "on-secondary-fixed": "#1E3A8A",
        "on-secondary-fixed-variant": "#1D4ED8",

        tertiary: "#475569",
        "tertiary-container": "#F1F5F9",
        "tertiary-fixed": "#E2E8F0",
        "tertiary-fixed-dim": "#CBD5E1",
        "on-tertiary": "#FFFFFF",
        "on-tertiary-container": "#0F172A",
        "on-tertiary-fixed": "#0F172A",
        "on-tertiary-fixed-variant": "#334155",

        "on-surface": "#0F172A",
        "on-surface-variant": "#475569",
        "on-background": "#0F172A",
        outline: "#CBD5E1",
        "outline-variant": "#E2E8F0",

        error: "#ED2C2C",
        "on-error": "#FFFFFF",
        "error-container": "#FEF2F2",
        "on-error-container": "#ED2C2C",
      },
      fontFamily: {
        "label-md": ["'JetBrains Mono'", "monospace"],
        "headline-sm": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "label-lg": ["'JetBrains Mono'", "monospace"],
        "headline-xl": ["Inter", "sans-serif"],
        "headline-lg": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "label-sm": ["'JetBrains Mono'", "monospace"],
        "headline-md": ["Inter", "sans-serif"],
      },
      fontSize: {
        "label-md": ["12px", { lineHeight: "16px", fontWeight: "500" }],
        "headline-sm": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-lg": ["14px", { lineHeight: "20px", fontWeight: "500" }],
        "headline-xl": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-lg": ["24px", { lineHeight: "32px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "label-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.02em", fontWeight: "500" }],
        "headline-md": ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
};
