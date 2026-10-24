/* =========================================================
   MOTION CORE — GSAP + Lenis ใช้นาฬิกาเดียวกัน (gsap.ticker)
   - register plugin ครั้งเดียวที่นี่ (ตาม gsap-react skill)
   - Lenis ส่ง scroll ให้ ScrollTrigger.update ทุกเฟรม
   ========================================================= */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { Flip } from 'gsap/Flip';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, Flip, useGSAP);
gsap.defaults({ ease: 'expo.out', duration: 1 });

export { gsap, ScrollTrigger, SplitText, Flip, useGSAP };

export const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isNarrow = () => window.innerWidth < 900;

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

export function initSmoothScroll() {
  if (reduceMotion || lenis) return lenis;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(time => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function lockScroll(locked: boolean) {
  if (lenis) (locked ? lenis.stop() : lenis.start());
  document.documentElement.classList.toggle('is-locked', locked);
}

/** เลื่อนไปยัง element / ตำแหน่ง — ใช้ Lenis ถ้ามี */
export function scrollToTarget(target: string | HTMLElement | number, offset = 0) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  if (el === null) return;
  if (lenis) {
    lenis.scrollTo(el, { offset, duration: 1.4, easing: t => 1 - Math.pow(1 - t, 4) });
    return;
  }
  const y = typeof el === 'number' ? el : el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
}

/** damping ที่ไม่ขึ้นกับ framerate (จาก awwwards-3d skill) */
export const damp = (current: number, target: number, ease: number, dt: number) =>
  current + (target - current) * (1 - Math.pow(1 - ease, dt * 60));

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** แปลง progress รวม → progress ของช่วง [a, b] */
export const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
