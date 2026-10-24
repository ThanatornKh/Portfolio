/* =========================================================
   DRAG ROTATE — ลากเพื่อหมุนฉาก 3D ได้ 360° (มีแรงเฉื่อยหลังปล่อย)
   - เมาส์: ลากซ้าย/ขวา = หมุนรอบแกน Y ไม่จำกัด, ขึ้น/ลง = เอียงเล็กน้อย
   - ทัชสกรีน: ปัดแนวนอน = หมุน, ปัดแนวตั้ง = เลื่อนหน้าตามปกติ (touch-action: pan-y)
   - ดับเบิลคลิก = กลับมุมเริ่มต้น
   ค่าหมุนเก็บในอ็อบเจกต์ธรรมดา ให้ useFrame อ่าน (ไม่ผ่าน React state)
   ========================================================= */
import { useEffect, type RefObject } from 'react';
import { gsap, reduceMotion } from './motion';

export interface Spin {
  angle: number;
  vel: number;
  tilt: number;
  dragging: boolean;
}

export const createSpin = (): Spin => ({ angle: 0, vel: 0, tilt: 0, dragging: false });

/** เรียกทุกเฟรม: แรงเฉื่อย + คืนค่าเอียงช้า ๆ */
export function stepSpin(s: Spin, dt: number) {
  if (s.dragging) return;
  s.angle += s.vel * dt;
  s.vel *= Math.exp(-dt * 2.4);
  if (Math.abs(s.vel) < 0.001) s.vel = 0;
  s.tilt *= Math.exp(-dt * 1.5);
}

const IGNORE = 'a, button, input, textarea, summary, [data-no-drag]';

export function useDragRotate(ref: RefObject<HTMLElement | null>, spin: Spin, { tilt = true, touchOnly = false } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let id: number | null = null;
    let lx = 0;
    let ly = 0;
    let lt = 0;
    const down = (e: PointerEvent) => {
      if ((e.target as Element).closest(IGNORE) || e.button > 0) return;
      if (touchOnly && e.pointerType === 'mouse') return;
      id = e.pointerId;
      lx = e.clientX;
      ly = e.clientY;
      lt = performance.now();
      spin.dragging = true;
      spin.vel = 0;
      el.classList.add('is-dragging');
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      const now = performance.now();
      const dt = Math.max(1, now - lt) / 1000;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      const da = dx * 0.0085;
      spin.angle += da;
      spin.vel = spin.vel * 0.6 + (da / dt) * 0.4;
      if (tilt && e.pointerType === 'mouse') spin.tilt = Math.max(-0.45, Math.min(0.45, spin.tilt + dy * 0.004));
      lx = e.clientX;
      ly = e.clientY;
      lt = now;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = null;
      spin.dragging = false;
      if (reduceMotion) spin.vel = 0;
      el.classList.remove('is-dragging');
    };
    const reset = (e: MouseEvent) => {
      if ((e.target as Element).closest(IGNORE)) return;
      const full = Math.PI * 2;
      gsap.to(spin, { angle: Math.round(spin.angle / full) * full, tilt: 0, vel: 0, duration: 1.2, ease: 'expo.out' });
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    el.addEventListener('dblclick', reset);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.removeEventListener('dblclick', reset);
    };
  }, [ref, spin, tilt, touchOnly]);
}
