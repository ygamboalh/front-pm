/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#070D1A',
          deep: '#040810',
        },
        surface: {
          DEFAULT: '#0D1526',
          raised: '#121D33',
          hover: '#17233B',
        },
        line: '#1F2B45',
        ink: {
          DEFAULT: '#E8EEF9',
          soft: '#C3CFE2',
          muted: '#8FA1BE',
          faint: '#64748B',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        price: '#FBBF24',
        gain: '#34D399',
        percent: '#A78BFA',
        danger: '#FB7185',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.35), 0 18px 44px -28px rgb(0 0 0 / 0.9)',
        glow: '0 0 0 1px rgb(59 130 246 / 0.25), 0 0 24px -6px rgb(59 130 246 / 0.35)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'scale-in': 'scale-in 160ms ease-out',
      },
    },
  },
  plugins: [],
};
