import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**', 'src/test/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 75,
        lines: 80,
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        'src/test/**',
        '**/*.config.*',
        'eslint.config.js',
        'src/main.ts',
        'src/pwa/**',
        'src/app/**',
        'src/rendering/**',
        'src/input/**',
        'src/audio/**',
        'public/**',
      ],
    },
  },
});
