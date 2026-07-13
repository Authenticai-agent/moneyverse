import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': root,
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    globalSetup: './tests/global-setup.ts',
    globals: true,
    fileParallelism: false,
  },
});
