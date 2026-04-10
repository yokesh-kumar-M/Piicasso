/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
        display: ['Oswald', 'Bebas Neue', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Premium Brand Colors (Blueprint: Refined Color Palette)
        premium: {
          dark: '#0A0F1C',      // Deepest background
          surface: '#111827',   // Card background
          surface2: '#1F2937',  // Elevated surface
          primary: '#1E40AF',   // Trust Blue
          'primary-hover': '#1E3A8A',
          accent: '#0D9488',    // Secure Teal
          highlight: '#38BDF8', // CTA Light Blue
          glow: 'rgba(56, 189, 248, 0.15)',
        },
        
        // Security Mode (Tactical Dark/Red)
        security: {
          bg: "#050505",
          surface: "#111111",
          surface2: "#1A1A1A",
          red: "#E11D48",
          "red-hover": "#BE123C",
          "red-glow": "rgba(225, 29, 72, 0.2)",
          border: "rgba(255,255,255,0.08)",
          text: {
            DEFAULT: "#F8FAFC",
            muted: "#94A3B8",
          }
        },

        // User Mode (Cobalt Glass / Midnight)
        user: {
          bg: "#020617",
          surface: "#0F172A",
          surface2: "#1E293B",
          cobalt: "#3B82F6",
          "cobalt-hover": "#2563EB",
          "cobalt-glow": "rgba(59, 130, 246, 0.2)",
          indigo: "#6366F1",
          border: "rgba(255,255,255,0.1)",
          glass: "rgba(255,255,255,0.03)",
          text: {
            DEFAULT: "#F1F5F9",
            muted: "#94A3B8",
          }
        },

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
        'tactical-gradient': 'linear-gradient(to bottom, #111111 0%, #050505 100%)',
        'cobalt-gradient': 'radial-gradient(circle at top right, #0F172A 0%, #020617 100%)',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #1E40AF 0deg, #0D9488 180deg, #1E40AF 360deg)',
        'gradient-brand': 'linear-gradient(135deg, #1E40AF 0%, #0D9488 100%)',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(56, 189, 248, 0.15)',
        'glow-lg': '0 0 60px rgba(56, 189, 248, 0.2)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.5)',
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        "glass-shine": {
          "0%": { left: "-100%" },
          "100%": { left: "200%" }
        },
        "pulse-glow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.6 }
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" }
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        },
        "scan": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" }
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "glass-shine": "glass-shine 3s infinite linear",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "scan": "scan 2s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
    require("tailwindcss-animate")
  ],
}
