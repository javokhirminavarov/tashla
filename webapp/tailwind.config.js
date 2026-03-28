/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sigaret: "#F97316",
        nos: "#8B5CF6",
        alkogol: "#3b82f6",
        brand: {
          DEFAULT: "#1fc762",
          dark: "#17a34a",
          light: "#34d876",
        },
        bg: {
          DEFAULT: "#122017",
          deep: "#0d1a12",
          card: "#1a2c22",
          surface: "#23352b",
          raised: "#2d4436",
        },
        text: {
          primary: "#F1F5F2",
          secondary: "#94A3A1",
          muted: "#5C716A",
        },
        border: "rgba(255,255,255,0.06)",
        danger: "#EF4444",
        warning: "#FBBF24",
      },
      fontFamily: {
        display: ["Lexend", "sans-serif"],
        body: ["Lexend", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1rem",
        full: "9999px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.25)",
        soft: "0 0 30px rgba(31,199,98,0.12)",
        elevated: "0 4px 24px rgba(0,0,0,0.35)",
        glow: "0 0 30px rgba(31,199,98,0.15)",
      },
      fontSize: {
        hero: [
          "56px",
          { lineHeight: "1", fontWeight: "300", letterSpacing: "-0.02em" },
        ],
      },
      keyframes: {
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "streak-pop": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in-up": "fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "streak-pop": "streak-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
