import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' → ไฟล์ทั้งหมดอ้างแบบ relative ใช้ได้ทั้ง GitHub Pages (/Portfolio/) และโฮสต์อื่น
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
  },
});
