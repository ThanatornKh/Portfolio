/* =========================================================
   TARGET CURSOR — เป้าเล็ง 4 มุมที่ "ล็อก" เข้ากรอบปุ่ม/การ์ด
   แนวคิดจาก React Bits TargetCursor (spring physics, loop หลับเมื่อไม่ขยับ)
   - เฉพาะเมาส์ (hover + fine pointer) และไม่ทำงานเมื่อ reduced motion
   - เป้าหมาย: a, button, [data-cursor] · ป้ายจาก data-cursor-label
   ========================================================= */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { finePointer, reduceMotion } from '../lib/motion';
import './TargetCursor.css';

type Spring = { x: number; v: number };
const spring = (s: Spring, goal: number, k: number, c: number, dt: number) => {
  const h = dt / 2;
  for (let i = 0; i < 2; i++) {
    s.v += (k * (goal - s.x) - c * s.v) * h;
    s.x += s.v * h;
  }
};
const TARGETS = 'a, button, summary, [data-cursor]';
const SIZE = 30;
const PAD = 8;

export default function TargetCursor() {
  const [enabled] = useState(() => finePointer && !reduceMotion);
  const rootRef = useRef<HTMLDivElement>(null);
  const corners = useRef<(HTMLSpanElement | null)[]>([]);
  const dotRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current!;
    document.documentElement.classList.add('has-target-cursor');
    const p = { x: innerWidth / 2, y: innerHeight / 2, inside: false, down: false };
    const cx = { x: p.x, v: 0 };
    const cy = { x: p.y, v: 0 };
    const hw = { x: SIZE / 2, v: 0 };
    const hh = { x: SIZE / 2, v: 0 };
    const turn = { x: 0, v: 0 };
    const lock = { x: 0, v: 0 };
    const press = { x: 0, v: 0 };
    const presence = { x: 0, v: 0 };
    let target: Element | null = null;
    let quarter = 0;
    let spin = 0;
    let raf = 0;
    let last = 0;

    let labelText = '';
    const showLabel = (text: string) => {
      labelText = text;
      if (labelRef.current && text) labelRef.current.textContent = text;
      root.dataset.label = text ? '1' : '';
    };
    const lockOn = (next: Element | null) => {
      if (next === target) return;
      target = next;
      if (target) quarter = Math.round(turn.x / (Math.PI / 2));
      showLabel(target?.getAttribute('data-cursor-label') ?? '');
    };
    const find = (el: Element | null) => {
      const t = el?.closest(TARGETS) ?? null;
      return t && !t.closest('[data-cursor="none"]') ? t : null;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      if (target && !target.isConnected) lockOn(null);
      // ป้ายเปลี่ยนได้ระหว่างล็อกเป้าเดิม (เช่น ชี้ดาวในกลุ่มดาว → click · focus)
      else if (target) {
        const text = target.getAttribute('data-cursor-label') ?? '';
        if (text !== labelText) showLabel(text);
      }
      const rect = target?.getBoundingClientRect();
      const locked = !!rect && p.inside;
      const w = 4.6 / 0.22;
      const k = w * w;
      const c = 2 * 0.7 * w;
      spring(presence, p.inside ? 1 : 0, 260, 32, dt);
      spring(lock, locked ? 1 : 0, k, 2 * w, dt);
      spring(press, p.down ? 1 : 0, 900, 40, dt);

      let gx = p.x;
      let gy = p.y;
      let gw = SIZE / 2;
      let gh = SIZE / 2;
      if (locked && rect) {
        const mx = rect.left + rect.width / 2;
        const my = rect.top + rect.height / 2;
        gx = mx + (p.x - mx) * 0.08;
        gy = my + (p.y - my) * 0.08;
        const odd = Math.abs(quarter) % 2 === 1;
        const a = rect.width / 2 + PAD;
        const b = rect.height / 2 + PAD;
        gw = odd ? b : a;
        gh = odd ? a : b;
      }
      const follow = locked ? k : 2200;
      const followC = locked ? c : 2 * Math.sqrt(2200);
      spring(cx, gx, follow, followC, dt);
      spring(cy, gy, follow, followC, dt);
      spring(hw, gw, k, c, dt);
      spring(hh, gh, k, c, dt);
      if (locked) spring(turn, quarter * (Math.PI / 2), k, c, dt);
      else {
        spin += ((Math.PI * 2) / 2.6 - spin) * (1 - Math.exp(-dt * 3));
        turn.v = spin;
        turn.x += spin * dt;
      }
      if (locked) spin = 0;

      const squeeze = 1 - press.x * 0.14;
      const cos = Math.cos(turn.x);
      const sin = Math.sin(turn.x);
      const hx = Math.max(0, hw.x) * squeeze;
      const hy = Math.max(0, hh.x) * squeeze;
      const local = [
        [-hx, -hy],
        [hx, -hy],
        [hx, hy],
        [-hx, hy],
      ];
      const deg = (turn.x * 180) / Math.PI;
      let left = Infinity;
      let top = Infinity;
      corners.current.forEach((el, i) => {
        if (!el) return;
        const [lx, ly] = local[i];
        const x = cx.x + lx * cos - ly * sin;
        const y = cy.x + lx * sin + ly * cos;
        left = Math.min(left, x);
        top = Math.min(top, y);
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${(i * 90 + deg).toFixed(2)}deg)`;
      });
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) scale(${(1 - press.x * 0.4).toFixed(3)})`;
      if (labelRef.current) {
        const shown = root.dataset.label ? Math.min(1, Math.max(0, lock.x)) : 0;
        labelRef.current.style.transform = `translate3d(${left.toFixed(1)}px, ${(top - 10).toFixed(1)}px, 0) translateY(-100%) translateY(${((1 - shown) * 4).toFixed(1)}px)`;
        labelRef.current.style.opacity = shown.toFixed(3);
      }
      root.style.setProperty('--lock', Math.min(1, Math.max(0, lock.x)).toFixed(3));
      root.style.opacity = Math.min(1, Math.max(0, presence.x)).toFixed(3);

      const resting = !p.inside && presence.x < 0.002 && Math.abs(lock.x) < 0.002;
      const moving =
        Math.abs(cx.v) + Math.abs(cy.v) + Math.abs(hw.v) + Math.abs(hh.v) > 0.01 ||
        Math.abs(gx - cx.x) + Math.abs(gy - cy.x) > 0.05 ||
        Math.abs(lock.v) + Math.abs(press.v) + Math.abs(presence.v) > 0.001;
      if (!resting && (moving || locked || p.inside)) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      p.x = e.clientX;
      p.y = e.clientY;
      p.inside = true;
      lockOn(find(e.target as Element));
      wake();
    };
    const onDown = () => {
      p.down = true;
      wake();
    };
    const onUp = () => {
      p.down = false;
      wake();
    };
    const onLeave = () => {
      p.inside = false;
      p.down = false;
      lockOn(null);
      wake();
    };
    // เนื้อหาเลื่อนผ่านใต้เมาส์ที่อยู่นิ่ง → หาเป้าใหม่
    const onScroll = () => {
      if (!p.inside) return;
      lockOn(find(document.elementFromPoint(p.x, p.y)));
      wake();
    };
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerdown', onDown, { passive: true });
    addEventListener('pointerup', onUp, { passive: true });
    addEventListener('scroll', onScroll, { passive: true, capture: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    addEventListener('blur', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-target-cursor');
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerdown', onDown);
      removeEventListener('pointerup', onUp);
      removeEventListener('scroll', onScroll, { capture: true });
      document.documentElement.removeEventListener('pointerleave', onLeave);
      removeEventListener('blur', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return createPortal(
    <div className="tcursor" ref={rootRef} aria-hidden="true">
      {[0, 1, 2, 3].map(i => (
        <span key={i} className="tcursor__corner" ref={el => { corners.current[i] = el; }} />
      ))}
      <span className="tcursor__dot" ref={dotRef} />
      <span className="tcursor__label" ref={labelRef} />
    </div>,
    document.body,
  );
}
