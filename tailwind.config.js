/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bx: {
          bg: 'var(--bx-bg)',
          surface: 'var(--bx-surface)',
          'surface-2': 'var(--bx-surface-2)',
          border: 'var(--bx-border)',
          'border-2': 'var(--bx-border-2)',
          text: 'var(--bx-text)',
          muted: 'var(--bx-muted)',
          accent: 'var(--bx-accent)',
        },
      },
    },
  },
  plugins: [],
};
