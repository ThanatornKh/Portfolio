import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/ibm-plex-sans-thai/300.css';
import '@fontsource/ibm-plex-sans-thai/400.css';
import '@fontsource/ibm-plex-sans-thai/500.css';
import '@fontsource/ibm-plex-sans-thai/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import 'lenis/dist/lenis.css';
import './styles/global.css';
import ampFont from '@fontsource/ibm-plex-sans-thai/files/ibm-plex-sans-thai-latin-500-normal.woff2?url';
import App from './App';

// เครื่องหมาย & ของ Archivo แบบกว้างอ่านเหมือนตัว ε → ใช้ & จาก IBM Plex แทน (unicode-range เฉพาะ U+0026)
try {
  const amp = new FontFace('Amp', `url(${ampFont})`, { unicodeRange: 'U+0026', weight: '100 900' });
  document.fonts.add(amp);
  amp.load().catch(() => undefined);
} catch {
  /* FontFace API ไม่รองรับ — ใช้ & ของ Archivo */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// ประกาศลิขสิทธิ์สำหรับคนที่เปิด DevTools
console.info(
  '%c© 2026 Thanatorn Khwanmankong — All rights reserved.%c\nThe code, design and content of this site may not be copied, reused or used to train AI without written permission.\nโค้ด ดีไซน์ และเนื้อหาของเว็บนี้ห้ามคัดลอก นำไปใช้ต่อ หรือนำไปฝึก AI โดยไม่ได้รับอนุญาต',
  'font: 600 13px system-ui; color: #f2f2ef; background: #050505; padding: 6px 10px;',
  'font: 12px system-ui;',
);
