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
  core: 0,
  pointerX: 0,
  pointerY: 0,
};

/** พื้นที่ว่างของฉาก Inside the core (px บน canvas) ที่ไม่ทับหัวข้อ/HUD — วัดจาก DOM แล้วกล้องเลื่อนภาพให้ชิปอยู่กลางพื้นที่นี้
 *  stacked = จอแคบ (HUD อยู่ล่าง หัวข้อจางหายตอนเลื่อน: ขอบบนเลื่อนจาก top → topAfter)
 *  redraw = ฉากตั้งไว้ให้ (frameloop demand ตอนลดการเคลื่อนไหว ต้องสั่งวาดใหม่เมื่อวัดได้ค่าใหม่) */
export const coreFrame = { left: 0, right: 0, top: 0, topAfter: 0, bottom: 0, stacked: false, redraw: null as null | (() => void) };

/** มุมหมุนจากการลาก (360°) ของแต่ละฉาก 3D */
export const spins = {
  hero: createSpin(),
  pipeline: createSpin(),
  stack: createSpin(),
  core: createSpin(),
};
