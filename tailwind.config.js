/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          300: '#8fa3f5',
          400: '#5c77ee',
          500: '#3b5bea',
          600: '#2b4bdb',
          700: '#2340b8',
          800: '#1d3391',
        },
        ink: {
          950: '#0b0c10',
          900: '#101218',
          800: '#161923',
          700: '#1f2330',
          600: '#2a2f40',
        },
        accent: {
          red: '#c81e3c',
          yellow: '#f5c518',
        },
        // Cores da logo do ScoreComps
        canary: '#ffdf00', // amarelo canarinho
        navy: '#14235e', // azul escuro
        // Tokens semânticos de tema (definidos como CSS vars em index.css)
        'app-bg': 'var(--bg)',
        'app-surface': 'var(--surface)',
        'app-surface-2': 'var(--surface-2)',
        'app-surface-3': 'var(--surface-3)',
        'app-fg': 'var(--fg)',
        'app-muted': 'var(--muted)',
        'app-faint': 'var(--faint)',
        'app-border': 'var(--border)',
        'app-border-strong': 'var(--border-strong)',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
