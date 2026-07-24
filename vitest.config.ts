import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**', 'src/test/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        'src/test/**',
        '**/*.config.*',
        'eslint.config.js',
      ],
    },
  },
});
