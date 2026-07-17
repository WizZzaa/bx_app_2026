/** @type {import('tailwindcss').Config} */
module.exports = {
  // dark:-варианты управляются классом .dark (applyTheme в lib/theme.ts),
  // а не темой ОС — иначе hover-стили в светлой теме брали тёмные значения.
  darkMode: 'class',
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Нестандартные значения spacing, которые уже используются в разметке
      // (p-4.5, w-4.5, w-68 и т.п.). Без них классы были no-op — карточки
      // «прилипали к краям», сайдбары теряли ширину.
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '18': '4.5rem',
        '34': '8.5rem',
        '68': '17rem',
      },
      colors: {
        // Базовая шкала акцента остаётся синей в стандартных темах,
        // а тема .lime переопределяет RGB-токены без ручной перекраски страниц.
        blue: {
          50: 'rgb(var(--bx-blue-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--bx-blue-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--bx-blue-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--bx-blue-300-rgb) / <alpha-value>)',
          400: 'rgb(var(--bx-blue-400-rgb) / <alpha-value>)',
          500: 'rgb(var(--bx-blue-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--bx-blue-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--bx-blue-700-rgb) / <alpha-value>)',
          800: 'rgb(var(--bx-blue-800-rgb) / <alpha-value>)',
          900: 'rgb(var(--bx-blue-900-rgb) / <alpha-value>)',
          950: 'rgb(var(--bx-blue-950-rgb) / <alpha-value>)',
        },
        bx: {
          bg: 'rgb(var(--bx-bg-rgb) / <alpha-value>)',
          surface: 'rgb(var(--bx-surface-rgb) / <alpha-value>)',
          'surface-2': 'rgb(var(--bx-surface-2-rgb) / <alpha-value>)',
          border: 'rgb(var(--bx-border-rgb) / <alpha-value>)',
          'border-2': 'rgb(var(--bx-border-2-rgb) / <alpha-value>)',
          text: 'rgb(var(--bx-text-rgb) / <alpha-value>)',
          muted: 'rgb(var(--bx-muted-rgb) / <alpha-value>)',
          accent: 'rgb(var(--bx-accent-rgb) / <alpha-value>)',
          'on-accent': 'rgb(var(--bx-on-accent-rgb) / <alpha-value>)',
          'on-accent-muted': 'rgb(var(--bx-on-accent-muted-rgb) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
