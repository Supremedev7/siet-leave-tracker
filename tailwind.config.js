/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ['Montserrat', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          dark:       "hsl(var(--primary-dark))",
          light:      "hsl(var(--primary-light))",
          foreground: "hsl(var(--primary-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          dark:       "hsl(var(--accent-dark))",
          foreground: "hsl(var(--accent-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          bg:         "hsl(var(--destructive-bg))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          bg:      "hsl(var(--success-bg))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          bg:      "hsl(var(--warning-bg))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // SIET Sidebar tokens
        sidebar: {
          bg:     "var(--sidebar-bg)",
          text:   "var(--sidebar-text)",
          muted:  "var(--sidebar-muted)",
          active: "var(--sidebar-active)",
          hover:  "var(--sidebar-hover)",
          accent: "var(--sidebar-accent)",
          border: "var(--sidebar-border)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        'card':    '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)',
        'card-lg': '0 4px 24px rgba(0,0,0,0.10)',
        'primary': '0 4px 16px hsl(0 68% 32% / 0.30)',
        'accent':  '0 4px 16px hsl(33 93% 54% / 0.35)',
        'glass':   '0 4px 24px rgba(139,26,26,0.07), 0 1px 4px rgba(0,0,0,0.06)',
        'sidebar': '4px 0 20px rgba(0,0,0,0.15)',
      },
      animation: {
        "slide-in":   "slideInLeft 0.35s ease-out",
        "fade-up":    "fadeInUp 0.4s ease-out",
        "fade-in":    "fadeIn 0.3s ease-out",
        "scale-in":   "scaleIn 0.3s ease-out",
        "shimmer":    "shimmer 1.6s ease-in-out infinite",
        "spin-slow":  "spin 2s linear infinite",
        "bounce-in":  "bounceIn 0.45s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "count-up":   "countUp 0.5s ease-out",
        "pulse-ring": "pulse-ring 1.5s ease-in-out infinite",
      },
      keyframes: {
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-18px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '60%':  { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 hsl(0 68% 32% / 0.35)' },
          '50%':      { boxShadow: '0 0 0 6px hsl(0 68% 32% / 0)' },
        },
      },
      backgroundImage: {
        'gradient-maroon': 'linear-gradient(135deg, #8B1A1A 0%, #6B1414 100%)',
        'gradient-gold':   'linear-gradient(135deg, #F7941D 0%, #E07B0A 100%)',
        'gradient-hero':   'linear-gradient(135deg, #8B1A1A 0%, #5A1010 60%, #3D0A0A 100%)',
        'gradient-card':   'linear-gradient(135deg, rgba(139,26,26,0.04) 0%, rgba(247,148,29,0.04) 100%)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
