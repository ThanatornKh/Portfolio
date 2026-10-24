import { useEffect, type RefObject } from 'react';
import { finePointer } from './motion';

/** ตั้ง --mx/--my ให้ทุก .spot ใต้ container จาก listener เดียว (การ์ดข้างเคียงสว่างตามด้วย — แบบ Magic Bento) */
export function useSpotlight(ref: RefObject<HTMLElement | null>, selector = '.spot') {
  useEffect(() => {
    const root = ref.current;
    if (!root || !finePointer) return;
    let raf = 0;
    let ev: PointerEvent | null = null;
    const apply = () => {
      raf = 0;
      if (!ev) return;
      root.querySelectorAll<HTMLElement>(selector).forEach(el => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${ev!.clientX - r.left}px`);
        el.style.setProperty('--my', `${ev!.clientY - r.top}px`);
      });
    };
    const onMove = (e: PointerEvent) => {
      ev = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      root.querySelectorAll<HTMLElement>(selector).forEach(el => {
        el.style.setProperty('--mx', '-500px');
        el.style.setProperty('--my', '-500px');
      });
    };
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [ref, selector]);
}

/** ตั้ง --mx/--my ให้ปุ่มเดียว (แสงสะท้อนบนปุ่ม glass) */
export function onButtonGlow(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
}
