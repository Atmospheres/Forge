import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    // e2e/ holds Playwright specs (run via `npm run test:e2e`), not Vitest
    // ones -- Vitest's default glob otherwise picks up any *.spec.ts.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      // lcov is what SonarCloud's sonar.javascript.lcov.reportPaths reads.
      reporter: ['text', 'lcov'],
      exclude: [...(configDefaults.coverage.exclude ?? []), 'e2e/**', 'src/routeTree.gen.ts'],
    },
  },
});
