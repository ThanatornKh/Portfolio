import { CATEGORIES, PROJECTS } from './content';
import type { Category, CategoryId, Work } from './types';

export const pad = (n: number, len = 2) => String(n).padStart(len, '0');

const catById = new Map<CategoryId, Category>(CATEGORIES.map(c => [c.id, c]));

/** ผลงานเรียงตามลำดับหมวด แล้วให้รหัส เช่น FS-01 */
export const WORKS: Work[] = CATEGORIES.flatMap(cat =>
  PROJECTS.filter(p => p.cat === cat.id).map((p, i) => ({ ...p, code: `${cat.code}-${pad(i + 1)}`, no: 0, category: cat })),
).map((w, i) => ({ ...w, no: i + 1 }));

export const workById = new Map(WORKS.map(w => [w.id, w]));
export const getWork = (id: string) => workById.get(id);
export const countIn = (cat: CategoryId) => WORKS.filter(w => w.cat === cat).length;
export const categoryOf = (id: CategoryId) => catById.get(id)!;

export const FEATURED = WORKS.filter(w => w.featured);

/** เทคโนโลยีทั้งหมด → ผลงานที่ใช้ และหมวดที่พบบ่อยที่สุด */
export interface Tech {
  name: string;
  works: Work[];
  cat: CategoryId;
}
export const TECHS: Tech[] = (() => {
  const map = new Map<string, Work[]>();
  WORKS.forEach(w => w.stack.forEach(s => map.set(s, [...(map.get(s) ?? []), w])));
  return [...map.entries()].map(([name, works]) => {
    const tally = new Map<CategoryId, number>();
    works.forEach(w => tally.set(w.cat, (tally.get(w.cat) ?? 0) + 1));
    const cat = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
    return { name, works, cat };
  });
})();

export const STATS = {
  works: WORKS.length,
  categories: CATEGORIES.length,
  techs: TECHS.length,
  year: 3,
};
