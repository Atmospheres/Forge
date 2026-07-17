import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

// Router plugin generates the route tree from src/routes before the React plugin runs
export default defineConfig({
  plugins: [tanstackRouter(), react()],
  server: {
    port: 5173,
  },
});
