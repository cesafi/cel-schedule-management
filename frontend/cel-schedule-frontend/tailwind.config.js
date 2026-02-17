/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="night"]'],
  theme: {
    extend: {
      colors: {
        // Memoria Design System - Monochromatic Scale
        neutral: {
          950: '#0a0a0a',
          900: '#171717',
          800: '#262626',
          700: '#404040',
          600: '#525252',
          500: '#737373',
          400: '#a3a3a3',
          300: '#d4d4d4',
          200: '#e5e5e5',
          100: '#f5f5f5',
          50: '#fafafa',
        },
        // Theme-based colors (will adapt based on data-theme attribute)
        theme: {
          base: 'var(--color-bg-base, #0a0a0a)',
          container: 'var(--color-bg-container, #171717)',
          elevated: 'var(--color-bg-elevated, #262626)',
          overlay: 'var(--color-bg-overlay, rgba(23, 23, 23, 0.6))',
          border: 'var(--color-border, #404040)',
          borderSecondary: 'var(--color-border-secondary, rgba(64, 64, 64, 0.6))',
          text: 'var(--color-text, #ffffff)',
          textSecondary: 'var(--color-text-secondary, #d4d4d4)',
          textTertiary: 'var(--color-text-tertiary, #a3a3a3)',
          textQuaternary: 'var(--color-text-quaternary, #737373)',
        },
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      letterSpacing: {
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'blur-in': 'blurIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blurIn: {
          '0%': { filter: 'blur(10px)', opacity: '0' },
          '100%': { filter: 'blur(0px)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
