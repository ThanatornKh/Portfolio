/* =========================================================
   CIRCUIT BACKGROUND — พื้นหลังทั้งเว็บ: ลายวงจรบนแผงชิปจาง ๆ + แสงข้อมูลวิ่งตามเส้น
   - เข้าธีมเดียวกับชิป AI ใน Hero
   - เลื่อนหน้า = ลายวงจรเลื่อนช้ากว่าเนื้อหา (parallax) และแสงวิ่งเร็วขึ้นตามความเร็วที่เลื่อน
   - เมาส์ = แสงสปอตจาง ๆ ตามตำแหน่ง
   - ประหยัด: ลายวงจรวาดครั้งเดียวลง canvas แยก แล้วเลื่อนด้วย transform (GPU) · ทุกเฟรมวาดแค่แสงที่วิ่ง
     · จอสัมผัสวาด ~30 เฟรม/วินาทีที่ความละเอียด 1×
     · หยุดเมื่อแท็บซ่อน · ซ่อนทั้งชั้นเมื่อฉาก 3D เต็มจอบังอยู่หรือเปิดหน้ารายละเอียดผลงาน
   - ลดการเคลื่อนไหว: วาดภาพนิ่งครั้งเดียว
   ========================================================= */
import { useEffect, useRef } from 'react';
import { finePointer, reduceMotion } from '../lib/motion';
import { useUI } from '../lib/store';
import './CircuitBackground.css';

interface Trace {
  pts: [number, number][];
  len: number;
  seg: number[];
  speed: number;
  phase: number;
}

const rng = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/** สร้างเส้นวงจรแบบ PCB: วิ่งตามแนวนอน/ตั้ง แล้วหักมุม 45° */
function buildTraces(w: number, h: number, step: number): Trace[] {
  const r = rng(97);
  const snap = (v: number) => Math.round(v / step) * step;
  const count = Math.round((w * h) / 26000);
  const out: Trace[] = [];
  for (let i = 0; i < count; i++) {
    let x = snap(r() * w);
    let y = snap(r() * h);
    const pts: [number, number][] = [[x, y]];
    const legs = 2 + Math.floor(r() * 3);
    let horizontal = r() > 0.5;
    for (let k = 0; k < legs; k++) {
      const d = step * (3 + Math.floor(r() * 9)) * (r() > 0.5 ? 1 : -1);
      if (k % 2 === 1 && r() > 0.45) {
        const e = step * (2 + Math.floor(r() * 4));
        x += Math.sign(d) * e;
        y += (r() > 0.5 ? 1 : -1) * e;
      } else if (horizontal) x += d;
      else y += d;
      horizontal = !horizontal;
      pts.push([x, y]);
    }
    const seg = pts.slice(1).map((p, j) => Math.hypot(p[0] - pts[j][0], p[1] - pts[j][1]));
    out.push({ pts, seg, len: seg.reduce((a, c) => a + c, 0), speed: 40 + r() * 70, phase: r() });
  }
  return out;
}

function pointAt(t: Trace, d: number): [number, number] {
  for (let i = 0; i < t.seg.length; i++) {
    if (d <= t.seg[i]) {
      const k = d / t.seg[i];
      return [t.pts[i][0] + (t.pts[i + 1][0] - t.pts[i][0]) * k, t.pts[i][1] + (t.pts[i + 1][1] - t.pts[i][1]) * k];
    }
    d -= t.seg[i];
  }
  return t.pts[t.pts.length - 1];
}

export default function CircuitBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  const traceRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const g = canvas.getContext('2d')!;
    const root = rootRef.current!;
    const dpr = finePointer ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
    const step = finePointer ? 0 : 1000 / 32;
    const layer = traceRef.current!;
    let W = 0;
    let H = 0;
    let FH = 0; // ความสูงของลายวงจรทั้งผืน (วนซ้ำแนวตั้ง)
    let traces: Trace[] = [];
    let raf = 0;
    let last = 0;
    let lastY = window.scrollY;
    let boost = 0;
    let paused = false;
    const mouse = { x: -9999, y: -9999 };

    let shownOff = NaN;

    // ลายวงจร 2 ผืนต่อกันแนวตั้ง (สูง 2×FH) — เลื่อนขึ้นได้ถึง FH โดยไม่เห็นรอยต่อ · เส้นบางจาง ๆ ใช้ความละเอียด 1× พอ
    const drawLayer = () => {
      const lg = layer.getContext('2d')!;
      layer.width = W;
      layer.height = FH * 2;
      layer.style.height = `${FH * 2}px`;
      shownOff = NaN;
      lg.lineCap = 'round';
      lg.lineJoin = 'round';
      lg.strokeStyle = 'rgba(255,255,255,0.055)';
      lg.fillStyle = 'rgba(255,255,255,0.09)';
      lg.lineWidth = 1;
      for (const dy of [0, FH])
        for (const t of traces) {
          lg.beginPath();
          lg.moveTo(t.pts[0][0], t.pts[0][1] + dy);
          for (const [x, y] of t.pts.slice(1)) lg.lineTo(x, y + dy);
          lg.stroke();
          const [sx, sy] = t.pts[0];
          const [ex, ey] = t.pts[t.pts.length - 1];
          lg.beginPath();
          lg.arc(sx, sy + dy, 2.2, 0, Math.PI * 2);
          lg.fill();
          lg.fillRect(ex - 2.5, ey + dy - 2.5, 5, 5);
        }
    };

    const resize = () => {
      // มือถือ: แถบ URL หด/ขยายเปลี่ยนแค่ความสูง → ปรับขนาด canvas อย่างเดียว ไม่สร้างลายใหม่ (กันกระพริบ)
      if (W === window.innerWidth && traces.length) {
        H = window.innerHeight;
        canvas.height = H * dpr;
        if (reduceMotion) frame(0);
        return;
      }
      W = window.innerWidth;
      H = window.innerHeight;
      FH = Math.ceil(Math.max(H, 700) * 1.6);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      traces = buildTraces(W, FH, W < 600 ? 18 : 24);
      drawLayer();
      if (reduceMotion) frame(0);
    };

    const frame = (now: number) => {
      raf = 0;
      if (step && last && now - last < step) return schedule();
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const y = window.scrollY;
      // ความเร็วการเลื่อน → แสงวิ่งเร็วขึ้น (ค่อย ๆ คืนตัว)
      boost = Math.max(boost * Math.exp(-dt * 3), Math.min(5, Math.abs(y - lastY) / 12));
      lastY = y;

      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      const off = reduceMotion ? 0 : -Math.round((y * 0.12) % FH);
      if (off !== shownOff) {
        shownOff = off;
        layer.style.transform = `translate3d(0, ${off}px, 0)`;
      }

      if (!reduceMotion) {
        g.lineCap = 'round';
        for (const t of traces) {
          t.phase = (t.phase + (dt * t.speed * (1 + boost)) / t.len) % 1;
          const d = t.phase * t.len;
          const [hx, hy] = pointAt(t, d);
          const [tx, ty] = pointAt(t, Math.max(0, d - 46));
          for (const shift of [off, off + FH]) {
            const ay = hy + shift;
            if (ay < -60 || ay > H + 60) continue;
            const grad = g.createLinearGradient(tx, ty + shift, hx, ay);
            grad.addColorStop(0, 'rgba(169,214,232,0)');
            grad.addColorStop(1, 'rgba(169,214,232,0.55)');
            g.strokeStyle = grad;
            g.lineWidth = 1.4;
            g.beginPath();
            g.moveTo(tx, ty + shift);
            g.lineTo(hx, ay);
            g.stroke();
            g.fillStyle = 'rgba(214,237,246,0.8)';
            g.fillRect(hx - 1.2, ay - 1.2, 2.4, 2.4);
          }
        }
      }

      // สปอตไลต์ตามเมาส์ — ลายวงจรใกล้เมาส์สว่างขึ้นเล็กน้อย
      if (finePointer && mouse.x > -999) {
        const spot = g.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 260);
        spot.addColorStop(0, 'rgba(169,214,232,0.06)');
        spot.addColorStop(1, 'rgba(169,214,232,0)');
        g.fillStyle = spot;
        g.fillRect(mouse.x - 260, mouse.y - 260, 520, 520);
      }
      if (!reduceMotion) schedule();
    };

    const schedule = () => {
      if (raf || document.hidden || paused) return;
      raf = requestAnimationFrame(frame);
    };
    const onVis = () => {
      last = 0;
      schedule();
    };

    // ฉาก 3D เต็มจอ (Hero / Data → Deploy) และหน้ารายละเอียดผลงานทับพื้นหลังอยู่แล้ว
    // → ซ่อนทั้งชั้นและหยุดวาด · "เต็มจอ" = ฉากแตะทั้งแถบบนสุดและล่างสุดของจอ (IO 2 ตัว แม่นที่ขอบกว่าใช้ threshold)
    let detailOpen = !!useUI.getState().openId;
    const hits = { top: new Set<Element>(), bottom: new Set<Element>() };
    const update = () => {
      const was = paused;
      paused = detailOpen || [...hits.top].some(el => hits.bottom.has(el));
      root.style.visibility = paused ? 'hidden' : '';
      if (was && !paused) onVis();
    };
    const observers = (['top', 'bottom'] as const).map(
      edge =>
        new IntersectionObserver(
          entries => {
            for (const e of entries) {
              if (e.isIntersecting) hits[edge].add(e.target);
              else hits[edge].delete(e.target);
            }
            update();
          },
          { rootMargin: edge === 'top' ? '0px 0px -99% 0px' : '-99% 0px 0px 0px' },
        ),
    );
    ['#top', '#pipeline'].forEach(s => {
      const el = document.querySelector(s);
      if (el) observers.forEach(o => o.observe(el));
    });
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const unsub = useUI.subscribe(s => {
      if (detailOpen === !!s.openId) return;
      detailOpen = !!s.openId;
      update();
    });

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVis);
    if (finePointer) window.addEventListener('pointermove', onMove, { passive: true });
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      unsub();
      observers.forEach(o => o.disconnect());
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div className="circuit-bg" ref={rootRef} aria-hidden="true">
      <canvas ref={traceRef} className="circuit-bg__traces" />
      <canvas ref={ref} className="circuit-bg__pulses" />
    </div>
  );
}
