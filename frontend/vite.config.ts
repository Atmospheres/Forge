import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

// Router plugin generates the route tree from src/routes before the React plugin runs.
// routeFileIgnorePattern excludes src/routes/__tests__/ -- those are route *tests*,
// not route files, and the plugin otherwise warns on every one since they don't
// export a Route.
export default defineConfig({
  plugins: [tanstackRouter({ routeFileIgnorePattern: '__tests__' }), react()],
  server: {
    port: 5173,
  },
});
