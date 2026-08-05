import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./app/test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'build/',
        'app/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/.{react-router,vscode}/**',
      ],
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './app'),
    },
  },
});
