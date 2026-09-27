import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: { NODE_ENV: 'test' },
    globals: false,
    // Real network calls (bcrypt hashing, the live Postgres instance) are
    // slower than the 5s default, especially the first request in a file.
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // These tests share one real database rather than a spun-up-per-run
    // test DB, so files run one at a time to avoid cross-file interference
    // (e.g. two files racing to hit the same rate limiter or the same
    // singleton offer code).
    fileParallelism: false,
    include: ['tests/**/*.test.ts'],
  },
});
