import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const NOTICE =
  '/*! © 2026 Thanatorn Khwanmankong — All rights reserved. ' +
  'Copying, reusing or redistributing this code, design or content without written permission is prohibited. */\n';

/** ใส่ประกาศลิขสิทธิ์ไว้หัวไฟล์ JS/CSS ที่ build ออกมา (หลัง minify แล้ว จึงไม่ถูกตัดทิ้ง) */
function copyrightBanner(): Plugin {
  return {
    name: 'copyright-banner',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk') file.code = NOTICE + file.code;
        else if (file.fileName.endsWith('.css') && typeof file.source === 'string') file.source = NOTICE + file.source;
      }
    },
  };
}

// base './' → ไฟล์ทั้งหมดอ้างแบบ relative ใช้ได้ทั้ง GitHub Pages (/Portfolio/) และโฮสต์อื่น
export default defineConfig({
  base: './',
  plugins: [react(), copyrightBanner()],
  // build จริง: ไม่มี source map · ตัวย่อโค้ด (oxc) ตัดคอมเมนต์ธรรมดาและ debugger ออกเอง
  // คอมเมนต์ลิขสิทธิ์ของไลบรารี (/*! … */) คงไว้ตามเงื่อนไข license ของไลบรารีนั้น
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
  },
});
