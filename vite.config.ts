import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Add base so assets load from the correct subpath on GitHub Pages
export default defineConfig({
  base: '/Article-writer/', // 👈 very important (must match your repo name)
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
});
