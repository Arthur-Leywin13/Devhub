/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0E14',
        surface: {
          DEFAULT: '#111620',
          raised: '#161C28',
          hover: '#1D2432',
        },
        line: '#232B3A',
        accent: {
          blue: '#3B7DFB',
          bluedark: '#2E63D6',
        },
        text: {
          hi: '#F2F4F8',
          mid: '#8D96A8',
          low: '#5C6578',
        },
        state: {
          success: '#34D399',
          danger: '#F87171',
          warning: '#FBBF24',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #3B7DFB 0%, #2E63D6 100%)',
        'grid-fade': 'radial-gradient(circle at 50% 0%, rgba(59,125,251,0.10), transparent 60%)',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(59,125,251,0.15), 0 8px 30px rgba(59,125,251,0.08)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
