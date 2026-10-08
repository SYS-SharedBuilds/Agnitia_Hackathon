/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ANTI-GRAVITY PALETTE IMPLEMENTATION
        // Primary Background (60%): Arctic Haze (#F2F6FB)
        // Core Structural (30%):    Deep Navy   (#0A1B2E)
        // Accent/Interactive (10%): Blue Slate  (#557392)
        antigravity: {
          arctic: "#F2F6FB",
          navy: "#0A1B2E",
          slate: "#557392",
        },
        navy: {
          50: "#f0f4f9",
          100: "#e1e9f2",
          200: "#c7d6e6",
          300: "#9fbcd6",
          400: "#708dae",
          500: "#557392", // Blue Slate
          600: "#3d5672",
          700: "#273d55",
          800: "#14263b",
          900: "#0A1B2E", // Deep Navy
          950: "#06111f",
        },
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#ffffff",
        "surface-container": "#ffffff",
        "surface-container-high": "#F8FAFC",
        "surface-container-highest": "#F1F5F9",
        surface: "#ffffff",
        background: "#ffffff",
        "surface-dim": "#F8FAFC",
        "surface-bright": "#ffffff",
        "surface-variant": "#F8FAFC",
        "inverse-surface": "#0A1B2E",
        "inverse-on-surface": "#ffffff",

        // Core Structural: Deep Navy (#0A1B2E)
        primary: "#0A1B2E",
        "primary-container": "#14263b",
        "primary-fixed": "#e1e9f2",
        "primary-fixed-dim": "#c7d6e6",
        "on-primary": "#ffffff",
        "on-primary-container": "#ffffff",
        "on-primary-fixed": "#0A1B2E",
        "on-primary-fixed-variant": "#14263b",
        "inverse-primary": "#9fbcd6",
        "surface-tint": "#273d55",

        // Accent / Interactive: Blue Slate (#557392)
        secondary: "#557392",
        "secondary-container": "#3d5672",
        "secondary-fixed": "#e4ecf5",
        "secondary-fixed-dim": "#c7d6e6",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#ffffff",
        "on-secondary-fixed": "#0A1B2E",
        "on-secondary-fixed-variant": "#273d55",

        // Tertiary: Blue Slate Variant
        tertiary: "#557392",
        "tertiary-container": "#708dae",
        "tertiary-fixed": "#eef3f9",
        "tertiary-fixed-dim": "#d6e2f0",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#ffffff",
        "on-tertiary-fixed": "#0A1B2E",
        "on-tertiary-fixed-variant": "#3d5672",

        // Typography & Outlines
        // Main Typography & Headers: Black (#000000) / Deep Navy (#0A1B2E)
        // Borders, Tabs, Active, Metadata: Blue Slate (#557392)
        "on-surface": "#000000",
        "on-surface-variant": "#557392",
        "on-background": "#000000",
        outline: "#557392",
        "outline-variant": "#c7d6e6",

        // Unified status tokens
        error: "#0A1B2E",
        "on-error": "#ffffff",
        "error-container": "#eef3f9",
        "on-error-container": "#0A1B2E",
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
