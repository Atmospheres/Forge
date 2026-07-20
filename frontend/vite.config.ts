import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

// Router plugin generates the route tree from src/routes before the React plugin runs.
// routeFileIgnorePattern excludes src/routes/__tests__/ -- those are route *tests*,
// not route files, and the plugin otherwise warns on every one since they don't
// export a Route.
// autoCodeSplitting moves each route's component into its own lazy-loaded chunk
// (e.g. dnd-kit only ships to the task board route, react-hook-form/zod only to
// routes with forms) instead of bundling every route into the single main chunk.
export default defineConfig({
  plugins: [
    tanstackRouter({ routeFileIgnorePattern: '__tests__', autoCodeSplitting: true }),
    react(),
  ],
  server: {
    port: 5173,
  },
});
