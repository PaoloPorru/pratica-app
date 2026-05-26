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
        pratica: {
          bg: "#F8F6F1",
          green: "#A8B8A0",
          "green-dark": "#7A9970",
          "green-light": "#D4E0CF",
          blue: "#6E8296",
          "blue-dark": "#4A6278",
          "blue-light": "#B8C8D8",
          text: "#2C2C2C",
          muted: "#8A8070",
          warm: "#E8E0D0",
          card: "#FFFFFF",
          border: "#E0D8CC",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      animation: {
        "breathe-in": "breatheIn 4s ease-in-out infinite",
        "breathe-out": "breatheOut 6s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "scale-in": "scaleIn 0.3s ease-out forwards",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
        "ripple": "ripple 1.5s ease-out infinite",
      },
      keyframes: {
        breatheIn: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.4)", opacity: "1" },
        },
        breatheOut: {
          "0%, 100%": { transform: "scale(1.4)", opacity: "1" },
          "50%": { transform: "scale(1)", opacity: "0.7" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(168, 184, 160, 0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(168, 184, 160, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        ripple: {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
      },
      backgroundImage: {
        "warm-gradient": "linear-gradient(135deg, #F8F6F1 0%, #EDE8DF 100%)",
        "green-gradient": "linear-gradient(135deg, #A8B8A0 0%, #7A9970 100%)",
        "blue-gradient": "linear-gradient(135deg, #6E8296 0%, #4A6278 100%)",
        "card-gradient": "linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(248,246,241,0.7) 100%)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        "card": "0 2px 20px rgba(44, 44, 44, 0.06), 0 1px 4px rgba(44, 44, 44, 0.04)",
        "card-hover": "0 8px 30px rgba(44, 44, 44, 0.12), 0 2px 8px rgba(44, 44, 44, 0.06)",
        "green": "0 4px 20px rgba(168, 184, 160, 0.4)",
        "blue": "0 4px 20px rgba(110, 130, 150, 0.4)",
        "inner-soft": "inset 0 2px 8px rgba(44, 44, 44, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
