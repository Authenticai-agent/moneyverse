import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Unit-test config for pure logic (no database, no API handlers).
 * Used by the Money Tree game engine and other framework-free modules.
 * Runs fast and standalone — unlike the main vitest.config.ts, which boots
 * Postgres via globalSetup for the API/integration suites.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': root,
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['app/lib/moneytree/**/*.test.ts'],
  },
});
