/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm paper neutrals
        canvas: '#F7F6F3',
        surface: '#FFFFFF',
        sunken: '#F1EFEA',
        line: {
          DEFAULT: '#E7E4DD',
          strong: '#D5D1C7',
        },
        ink: {
          DEFAULT: '#1A1917',
          hover: '#33312D',
          2: '#4A4741',
          3: '#6F6B62',
          4: '#A19D93',
        },
        // Semantic tones — used only to convey state
        critical: {
          DEFAULT: '#B42318',
          hover: '#9A1E14',
          soft: '#FBEEEC',
          line: '#F2CDC8',
        },
        warn: {
          DEFAULT: '#8A5A0B',
          soft: '#FAF3E3',
          line: '#EBD9B0',
        },
        ok: {
          DEFAULT: '#2E6A4F',
          soft: '#ECF3EE',
          line: '#C9DDD0',
        },
        info: {
          DEFAULT: '#2F4F7F',
          soft: '#EEF2F7',
          line: '#CDD7E6',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
        display: ['40px', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        title: ['32px', { lineHeight: '1.1', letterSpacing: '-0.005em' }],
      },
      boxShadow: {
        pop: '0 1px 2px rgba(26,25,23,0.04), 0 8px 24px rgba(26,25,23,0.08)',
      },
    },
  },
  plugins: [],
};
