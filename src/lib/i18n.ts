/* =========================================================
   I18N — สลับภาษา TH / EN (เริ่มที่ TH ทุกครั้งที่เข้าเว็บใหม่)
   - จำภาษาที่เลือกไว้ในแท็บเดิม (sessionStorage) รีเฟรชแล้วไม่เด้งกลับ
   - ข้อความสั้นในคอมโพเนนต์ใช้ tr('ไทย', 'English') วางคู่กันในที่เดียว
   - เนื้อหาผลงาน/FAQ/ทักษะ แปลไว้ใน data/content.en.ts แล้วเลือกผ่าน data/localize.ts
   ========================================================= */
import { useCallback } from 'react';
import { create } from 'zustand';

export type Lang = 'th' | 'en';

const KEY = 'tk-lang';

const initial = (): Lang => {
  try {
    return sessionStorage.getItem(KEY) === 'en' ? 'en' : 'th';
  } catch {
    return 'th';
  }
};

export const useLang = create<{ lang: Lang; setLang: (lang: Lang) => void }>(set => ({
  lang: initial(),
  setLang: lang => {
    try {
      sessionStorage.setItem(KEY, lang);
    } catch {
      /* โหมดส่วนตัว/บล็อก storage — ใช้ได้ต่อแค่ไม่จำ */
    }
    set({ lang });
  },
}));

/** เลือกข้อความตามภาษาปัจจุบัน: tr('ดูผลงาน', 'View work') */
export function useTr() {
  const lang = useLang(s => s.lang);
  return useCallback((th: string, en: string) => (lang === 'en' ? en : th), [lang]);
}

/** ปี พ.ศ. → ค.ศ. เมื่อเป็นภาษาอังกฤษ ('2569' → '2026') */
export const yearIn = (year: string, lang: Lang) => (lang === 'en' && /^25\d\d$/.test(year) ? String(Number(year) - 543) : year);
