import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',     // 👈 This makes it accessible on your LAN IP
    port: 5173,          // 👈 Optional: lock to port 3000
    strictPort: true     // 👈 Optional: crash if port 3000 is taken instead of using a random one
  }
});
