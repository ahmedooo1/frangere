/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './composables/**/*.ts'
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1B2A4A',
          50: '#EEF1F6',
          100: '#D6DCE8',
          200: '#AEB9D1',
          400: '#4C5F87',
          600: '#233A63',
          800: '#1B2A4A',
          900: '#121D33'
        },
        paper: {
          DEFAULT: '#F6EFE0',
          50: '#FCFAF4',
          100: '#F6EFE0',
          200: '#EDE1C7'
        },
        stamp: {
          DEFAULT: '#A83A32',
          50: '#FBEBEA',
          400: '#C4534A',
          600: '#A83A32',
          800: '#7A2A24'
        },
        guichet: {
          DEFAULT: '#2F6B52',
          50: '#E9F3EE',
          400: '#3F8567',
          600: '#2F6B52',
          800: '#204A39'
        },
        slate: {
          DEFAULT: '#5B6472'
        },
        line: '#D8CBB0'
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        arabic: ['Cairo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'arabic-serif': ['"Noto Naskh Arabic"', 'ui-serif', 'serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace']
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")"
      },
      boxShadow: {
        dossier: '0 1px 0 rgba(27,42,74,0.04), 0 8px 24px -12px rgba(27,42,74,0.18)'
      }
    }
  },
  plugins: []
}
