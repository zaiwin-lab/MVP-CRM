/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm neutral ramp — replaces Tailwind's cool `slate` everywhere the
        // app already uses it. Low chroma toward hue ~70 keeps it a true
        // neutral (not cream/sand), just warm enough to read human, not clinical.
        slate: {
          50: "#faf9f7",
          100: "#f3f1ee",
          200: "#e7e4de",
          300: "#d4cfc6",
          400: "#a8a299",
          500: "#78736b",
          600: "#565049",
          700: "#403b35",
          800: "#292623",
          900: "#1a1815",
        },
        // Primary accent — a deep, slightly indigo cobalt. Confident and
        // credible against the warm neutrals; not the stock SaaS blue.
        brand: {
          50: "#eef1ff",
          100: "#e0e5ff",
          200: "#c6ceff",
          300: "#a1adff",
          400: "#7b83fb",
          500: "#5a5cf2",
          600: "#4741e0",
          700: "#3a32c2",
          800: "#312c9c",
          900: "#2c2a7b",
        },
      },
      fontFamily: {
        sans: [
          "Hanken Grotesk",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,24,21,0.04), 0 1px 3px rgba(26,24,21,0.06)",
        pop: "0 12px 32px -8px rgba(26,24,21,0.18)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "modal-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 160ms cubic-bezier(0.22,1,0.36,1)",
        "modal-in": "modal-in 200ms cubic-bezier(0.22,1,0.36,1)",
        "toast-in": "toast-in 220ms cubic-bezier(0.22,1,0.36,1)",
      },
    },
  },
  plugins: [],
};
