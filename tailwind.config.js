/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#05070d',
          800: '#0a0e18',
          700: '#0f1422',
          600: '#161c2e',
          500: '#1f2740',
          400: '#2a3556',
        },
        accent: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
        glow: '0 0 24px rgba(56,189,248,0.25)',
        'neon-frame':
          '0 0 0 1px rgba(34,211,238,0.25), 0 0 28px rgba(34,211,238,0.35), 0 0 60px rgba(217,70,239,0.25), 0 10px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        'neon-btn':
          '0 0 18px rgba(34,211,238,0.45), 0 0 36px rgba(217,70,239,0.25), 0 6px 20px rgba(0,0,0,0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'neon-pulse': 'neonPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        neonPulse: {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(34,211,238,0.25), 0 0 28px rgba(34,211,238,0.35), 0 0 60px rgba(217,70,239,0.25), 0 10px 40px rgba(0,0,0,0.6)' },
          '50%': { boxShadow: '0 0 0 1px rgba(34,211,238,0.35), 0 0 40px rgba(34,211,238,0.5), 0 0 80px rgba(217,70,239,0.35), 0 10px 40px rgba(0,0,0,0.6)' },
        },
      },
    },
  },
  plugins: [],
};
