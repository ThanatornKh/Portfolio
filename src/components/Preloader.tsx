/* =========================================================
   PRELOADER — boot แบบเทอร์มินัล
   ความคืบหน้าจริง (ฟอนต์ · ฉาก 3D · หน้าเว็บ), กดข้ามได้, จำกัดเวลา,
   เข้าซ้ำในแท็บเดิมเร็วขึ้น (sessionStorage) — ตาม awwwards preloader rules
   ========================================================= */
import { useTr } from '../lib/i18n';
import { useEffect, useRef, useState } from 'react';
import { gsap, lockScroll, reduceMotion } from '../lib/motion';
import { useUI } from '../lib/store';
import { CATEGORIES } from '../data/content';
import { STATS, WORKS } from '../data/derived';
import './Preloader.css';

const KEY = 'holo-booted';

export default function Preloader() {
  const tr = useTr();
  const [gone, setGone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const setBooted = useUI(s => s.setBooted);

  useEffect(() => {
    let repeat = false;
    try {
      repeat = sessionStorage.getItem(KEY) === '1';
    } catch {
      /* storage blocked */
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {
        /* ignore */
      }
      lockScroll(false);
      setBooted();
      const root = rootRef.current;
      if (!root || reduceMotion) {
        setGone(true);
        return;
      }
      gsap
        .timeline({ onComplete: () => setGone(true) })
        .to(root.querySelector('.boot__core'), { opacity: 0, y: -30, filter: 'blur(8px)', duration: 0.5, ease: 'power2.in' })
        .to(root, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, '-=0.15');
    };

    if (reduceMotion) {
      finish();
      return;
    }
    lockScroll(true);

    const heroReady = new Promise<void>(res => {
      if (useUI.getState().heroReady) return res();
      const unsub = useUI.subscribe(s => {
        if (s.heroReady) {
          unsub();
          res();
        }
      });
      setTimeout(res, 2400);
    });
    const tasks = [
      document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve(),
      heroReady,
      document.readyState === 'complete' ? Promise.resolve() : new Promise<void>(res => window.addEventListener('load', () => res(), { once: true })),
    ];
    let settled = 0;
    tasks.forEach(t => t.then(() => settled++));

    const LINES: [string, string][] = [
      ['mount /projects', `${WORKS.length} found`],
      ['index categories', `${CATEGORIES.length} ok`],
      ['link technologies', `${STATS.techs} nodes`],
      ['load typefaces', 'ready'],
      ['assemble stack core', 'ready'],
      ['calibrate scroll engine', 'lenis ok'],
      ['all systems online', '▲'],
    ];
    const t0 = performance.now();
    const MIN = repeat ? 300 : 1100;
    const MAX = repeat ? 900 : 2600;
    let shown = 0;
    let line = 0;
    let raf = 0;
    const tick = (now: number) => {
      const el = now - t0;
      const real = settled / tasks.length;
      const timeCap = Math.min(0.92, el / MIN);
      const target = settled === tasks.length ? Math.min(1, el / MIN) : Math.min(timeCap, real * 0.9 + 0.08);
      shown += (target - shown) * 0.14;
      if (pctRef.current) pctRef.current.textContent = String(Math.round(shown * 100)).padStart(3, '0');
      if (barRef.current) barRef.current.style.transform = `scaleX(${shown})`;
      while (line < LINES.length && shown >= (line + 1) / (LINES.length + 1)) {
        const [a, b] = LINES[line++];
        const li = document.createElement('li');
        li.innerHTML = `<span>[ <b>ok</b> ]</span> ${a} <em>· ${b}</em>`;
        logRef.current?.appendChild(li);
      }
      if ((settled === tasks.length && el >= MIN && shown > 0.985) || el >= MAX) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // เครื่องช้าจน rAF ห่าง → ปิดตามเวลาจริงเสมอ
    const hard = window.setTimeout(finish, MAX + 400);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hard);
      window.removeEventListener('keydown', onKey);
    };
  }, [setBooted]);

  if (gone) return null;
  return (
    <div className="boot" ref={rootRef} role="status" aria-label={tr('กำลังโหลด', 'Loading')}>
      <div className="boot__core">
        <div className="boot__brand mono">
          <i /> HOLO-OS v2.0 // portfolio of Thanatorn Khwanmankong
        </div>
        <div className="boot__count display">
          <span ref={pctRef}>000</span>
          <small>%</small>
        </div>
        <div className="boot__bar">
          <span ref={barRef} />
        </div>
        <ol className="boot__log mono" ref={logRef} />
      </div>
      <button className="boot__skip mono" type="button" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))}>
        skip intro ↵
      </button>
    </div>
  );
}
