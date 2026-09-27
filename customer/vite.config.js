import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // In development the browser talks to /api on port 3000 and Vite forwards it to the backend.
    // (No CORS problems and the login cookie works.) In production set VITE_API_BASE_URL instead.
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
