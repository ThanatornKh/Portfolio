import { create } from 'zustand';
import type { CategoryId } from '../data/types';
import { createSpin } from './useDragRotate';

interface UIState {
  booted: boolean;
  heroReady: boolean;
  menuOpen: boolean;
  openId: string | null;
  filter: CategoryId | 'all';
  chapter: string;
  setBooted: () => void;
  setHeroReady: () => void;
  setMenu: (open: boolean) => void;
  openWork: (id: string | null) => void;
  setFilter: (f: CategoryId | 'all') => void;
  setChapter: (c: string) => void;
}

export const useUI = create<UIState>(set => ({
  booted: false,
  heroReady: false,
  menuOpen: false,
  openId: null,
  filter: 'all',
  chapter: 'home',
  setBooted: () => set({ booted: true }),
  setHeroReady: () => set({ heroReady: true }),
  setMenu: menuOpen => set({ menuOpen }),
  openWork: openId => set({ openId }),
  setFilter: filter => set({ filter }),
  setChapter: chapter => set({ chapter }),
}));

/** ค่า progress ของฉาก 3D — เขียนจาก ScrollTrigger อ่านใน useFrame (ไม่ผ่าน React state) */
export const sceneProgress = {
  hero: 0,
  pipeline: 0,
  stars: 0,
  pointerX: 0,
  pointerY: 0,
};

/** มุมหมุนจากการลาก (360°) ของแต่ละฉาก 3D */
export const spins = {
  hero: createSpin(),
  pipeline: createSpin(),
  stack: createSpin(),
};
