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
        sans: ['Inter', 'Outfit', 'sans-serif'], // Clean, modern, highly legible
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'], // Technical, code-like
        display: ['Oswald', 'Bebas Neue', 'sans-serif'], // Tactical, uppercase headers
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Security Mode (Tactical Dark/Red)
        security: {
          bg: "#050505", // Almost pure black, slight warmth
          surface: "#111111", // Elevated dark surface
          surface2: "#1A1A1A", // Higher elevation
          red: "#E11D48", // Tactical Red (Tailwind rose-600)
          "red-hover": "#BE123C", // Deeper red for hover (rose-700)
          "red-glow": "rgba(225, 29, 72, 0.2)",
          border: "rgba(255,255,255,0.08)",
          text: {
            DEFAULT: "#F8FAFC", // Off-white for readability
            muted: "#94A3B8", // Slate-400 for secondary text
          }
        },

        // User Mode (Cobalt Glass / Midnight)
        user: {
          bg: "#020617", // Slate-950 (Deep midnight)
          surface: "#0F172A", // Slate-900 (Elevated surface)
          surface2: "#1E293B", // Slate-800
          cobalt: "#3B82F6", // Blue-500
          "cobalt-hover": "#2563EB", // Blue-600
          "cobalt-glow": "rgba(59, 130, 246, 0.2)",
          indigo: "#6366F1", // Indigo-500
          border: "rgba(255,255,255,0.1)",
          glass: "rgba(255,255,255,0.03)",
          text: {
            DEFAULT: "#F1F5F9", // Slate-100
            muted: "#94A3B8", // Slate-400
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
        }
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "glass-shine": "glass-shine 3s infinite linear",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide'),
    require("tailwindcss-animate")
  ],
}