/* =========================================================
   LOCALIZE — เลือกเนื้อหาตามภาษา
   โครงสร้าง/ลำดับ/รหัสผลงานมาจาก content.ts เสมอ ภาษาอังกฤษทับเฉพาะ "ข้อความ"
   ========================================================= */
import { useMemo } from 'react';
import { AI_ACTS, CATEGORIES, EXPERIENCE, FAQ, PROCESS, PROFILE, SKILLS } from './content';
import { AI_ACTS_EN, CATEGORIES_EN, EXPERIENCE_EN, FAQ_EN, LINK_EN, PROCESS_EN, PROFILE_EN, PROJECTS_EN, SKILLS_EN } from './content.en';
import type { Category, Project } from './types';
import { useLang, useTr, yearIn, type Lang } from '../lib/i18n';

const cache = new WeakMap<object, object>();

export function locCategory(c: Category, lang: Lang): Category {
  return lang === 'en' ? { ...c, ...CATEGORIES_EN[c.id] } : c;
}

/** ผลงาน (หรือ Work ที่มี category) ในภาษาที่เลือก — ภาษาไทยคืนอ็อบเจกต์เดิม */
export function locWork<T extends Project & { category?: Category }>(w: T, lang: Lang): T {
  if (lang === 'th') return w;
  const hit = cache.get(w) as T | undefined;
  if (hit) return hit;
  const out = {
    ...w,
    ...PROJECTS_EN[w.id],
    year: w.year && yearIn(w.year, lang),
    links: w.links?.map(l => ({ ...l, label: LINK_EN[l.label] ?? l.label })),
    ...(w.category ? { category: locCategory(w.category, lang) } : {}),
  } as T;
  cache.set(w, out);
  return out;
}

export function locProfile(lang: Lang) {
  return lang === 'en' ? { ...PROFILE, ...PROFILE_EN } : PROFILE;
}

export const locProcess = (lang: Lang) => (lang === 'en' ? PROCESS.map((p, i) => ({ ...p, desc: PROCESS_EN[i] ?? p.desc })) : PROCESS);
export const locActs = (lang: Lang) => (lang === 'en' ? AI_ACTS.map((a, i) => ({ ...a, desc: AI_ACTS_EN[i] ?? a.desc })) : AI_ACTS);
export const locFaq = (lang: Lang) => (lang === 'en' ? FAQ_EN : FAQ);
export const locSkills = (lang: Lang) => (lang === 'en' ? SKILLS.map(s => ({ ...s, desc: SKILLS_EN[s.key] ?? s.desc })) : SKILLS);
export const locExperience = (lang: Lang) => (lang === 'en' ? EXPERIENCE_EN : EXPERIENCE);
export const locCategories = (lang: Lang) => CATEGORIES.map(c => locCategory(c, lang));

/** ตัวช่วยในคอมโพเนนต์: const L = useL(); L.tr('ไทย', 'English') · L.w(work) · L.profile */
export function useL() {
  const lang = useLang(s => s.lang);
  const tr = useTr();
  return useMemo(
    () => ({
      lang,
      tr,
      w: <T extends Project & { category?: Category }>(w: T) => locWork(w, lang),
      cat: (c: Category) => locCategory(c, lang),
      year: (y: string) => yearIn(y, lang),
      profile: locProfile(lang),
    }),
    [lang, tr],
  );
}
