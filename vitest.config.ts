import { defineConfig } from 'vitest/config'

// Юнит-тесты рендерера. environment jsdom — чтобы работали и чистые
// функции, и будущие компонентные тесты (@testing-library/react).
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
