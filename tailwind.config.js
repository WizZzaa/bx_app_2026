/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bx: {
          bg: 'rgb(var(--bx-bg-rgb) / <alpha-value>)',
          surface: 'rgb(var(--bx-surface-rgb) / <alpha-value>)',
          'surface-2': 'rgb(var(--bx-surface-2-rgb) / <alpha-value>)',
          border: 'rgb(var(--bx-border-rgb) / <alpha-value>)',
          'border-2': 'rgb(var(--bx-border-2-rgb) / <alpha-value>)',
          text: 'rgb(var(--bx-text-rgb) / <alpha-value>)',
          muted: 'rgb(var(--bx-muted-rgb) / <alpha-value>)',
          accent: 'rgb(var(--bx-accent-rgb) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};
