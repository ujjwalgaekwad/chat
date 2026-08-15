/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pine: {
          50: "#eef5f2",
          100: "#d3e6df",
          200: "#a7cdbf",
          300: "#7bb39f",
          400: "#4f9a80",
          500: "#2f6f5e",
          600: "#265a4c",
          700: "#1e4639",
          800: "#163327",
          900: "#0e2018",
        },
        amber: {
          50: "#fdf6ea",
          100: "#f9e6c2",
          200: "#f3ce8b",
          300: "#edb454",
          400: "#e8a33d",
          500: "#d68a1f",
          600: "#b06f16",
        },
        ink: {
          50: "#f7f8f6",
          100: "#eceeea",
          200: "#d8dbd5",
          300: "#b7bcb3",
          400: "#8b9187",
          500: "#636960",
          600: "#484d45",
          700: "#333731",
          800: "#20221f",
          900: "#14171a",
          950: "#0c0e0f",
        },
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(14, 32, 24, 0.06), 0 1px 1px rgba(14, 32, 24, 0.04)",
      },
      keyframes: {
        "typing-bounce": {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "40%": { transform: "translateY(-3px)", opacity: "1" },
        },
        "presence-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(232, 163, 61, 0.55)" },
          "100%": { boxShadow: "0 0 0 6px rgba(232, 163, 61, 0)" },
        },
      },
      animation: {
        "typing-bounce": "typing-bounce 1.2s infinite ease-in-out",
        "presence-pulse": "presence-pulse 1.4s ease-out infinite",
      },
    },
  },
  plugins: [],
};
