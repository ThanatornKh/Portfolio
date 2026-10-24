/* =========================================================
   01 · INSIDE THE CORE — มุดเข้าไปในชิป AI ตัวเดียวกับใน Hero แล้ว "อ่านข้อมูล" ข้างใน
   ฉากปักหมุด: ผลงานแต่ละชิ้น = หน่วยความจำบน die · ข้อมูลไหลผ่านบัสเข้า tensor core
   HUD แสดง memory dump ของผลงานที่กำลังอ่าน (hex จริงจากข้อมูลผลงาน + ค่าที่ถอดแล้ว)
   ไม่ได้เลือก = วนอ่านทีละก้อนเอง · คลิกก้อน/ปุ่มรหัส = ล็อกอ่านก้อนนั้น
   ========================================================= */
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { WORKS } from '../data/derived';
import { useL } from '../data/localize';
import { gsap, isNarrow, reduceMotion, ScrollTrigger, useGSAP } from '../lib/motion';
import { openWorkById } from '../lib/route';
import { coreFrame, sceneProgress, spins } from '../lib/store';
import { useDragRotate } from '../lib/useDragRotate';
import { hasWebGL, useInView, usePageHidden } from '../lib/useInView';
import SectionHead from './ui/SectionHead';
import './Core.css';

const CoreScene = lazy(() => import('../gl/CoreScene'));

const hex = (n: number, d = 2) => n.toString(16).toUpperCase().padStart(d, '0');

/** ไบต์จริงของผลงาน (ชื่อ · สถานะ · รหัส) จัดเป็นแถวละ 8 ไบต์แบบ hexdump */
function dumpRows(text: string, base: number, rows: number) {
  const bytes = [...new TextEncoder().encode(text)];
  return Array.from({ length: rows }, (_, r) => {
    const chunk = bytes.slice(r * 8, r * 8 + 8);
    while (chunk.length < 8) chunk.push(0);
    return {
      addr: `0x${hex(base + r * 8, 4)}`,
      hex: chunk.map(b => hex(b)).join(' '),
      ascii: chunk.map(b => (b >= 32 && b < 127 ? String.fromCharCode(b) : '·')).join(''),
    };
  });
}

const STAGES = [
  ['die', '10 memory banks'],
  ['bus', 'data in flight'],
  ['tensor core', 'inference'],
] as const;

export default function Core() {
  const L = useL();
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [gl] = useState(() => hasWebGL());
  const inView = useInView(ref, '0px');
  const hidden = usePageHidden();
  const [stage, setStage] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const [locked, setLocked] = useState<string | null>(null);
  const [cycle, setCycle] = useState(0);
  useDragRotate(stageRef, spins.core);

  // ไม่มีการเลือก → อ่านหน่วยความจำวนไปทีละก้อน (หยุดเมื่ออยู่นอกจอ / ลดการเคลื่อนไหว)
  useEffect(() => {
    if (locked || hover || reduceMotion || !inView || hidden) return;
    const id = window.setInterval(() => setCycle(c => (c + 1) % WORKS.length), 2600);
    return () => window.clearInterval(id);
  }, [locked, hover, inView, hidden]);

  // วัดพื้นที่ว่างระหว่างหัวข้อกับ HUD (จอกว้าง: HUD อยู่ขวา · จอแคบ: HUD อยู่ล่าง) ให้กล้องจัดชิปไว้กลางพื้นที่นั้น
  // ใช้ offset* (ไม่โดน transform ของ GSAP/CSS) · หัวข้อ mount ใหม่เมื่อเปลี่ยนภาษา จึงวัดใหม่ตาม lang
  useEffect(() => {
    const stage = stageRef.current!;
    const inner = stage.querySelector<HTMLElement>('.core__inner')!;
    const dump = stage.querySelector<HTMLElement>('.core__dump')!;
    const head = inner.querySelector<HTMLElement>('.sec-head');
    if (!head) return;
    const measure = () => {
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const stacked = dump.offsetTop > H / 2;
      const nav = parseFloat(getComputedStyle(stage).getPropertyValue('--nav-h')) || 64;
      Object.assign(coreFrame, {
        stacked,
        left: stacked ? 0 : inner.offsetLeft + head.offsetLeft + head.offsetWidth,
        right: stacked ? W : dump.offsetLeft,
        top: stacked ? inner.offsetTop + head.offsetTop + head.offsetHeight : 0,
        topAfter: stacked ? nav : 0,
        bottom: stacked ? dump.offsetTop : H,
      });
      coreFrame.redraw?.();
    };
    measure();
    const ro = new ResizeObserver(measure);
    [stage, head, dump].forEach(el => ro.observe(el));
    return () => ro.disconnect();
  }, [L.lang]);

  const activeId = hover ?? locked ?? WORKS[cycle].id;
  const idx = WORKS.findIndex(w => w.id === activeId);
  const w = L.w(WORKS[idx]);
  const base = 0x1000 + idx * 0x100;
  const rows = dumpRows(`${WORKS[idx].name}\0${w.status ?? ''}\0${w.code}`, base, isNarrow() ? 3 : 5);

  useGSAP(
    () => {
      if (reduceMotion) return;
      const root = ref.current!;
      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: s => {
          sceneProgress.core = s.progress;
          root.style.setProperty('--p', s.progress.toFixed(4));
          const st = Math.min(STAGES.length - 1, Math.floor(s.progress * STAGES.length));
          setStage(prev => (prev === st ? prev : st));
        },
      });
      gsap.from('.core__dump', { opacity: 0, x: 40, duration: 1.2, scrollTrigger: { trigger: root, start: 'top 60%', once: true } });
    },
    { scope: ref },
  );

  const select = (id: string) => setLocked(prev => (prev === id ? null : id));

  return (
    <section id="core" className={`core${reduceMotion ? ' core--static' : ''}`} ref={ref}>
      <div className="core__stage" ref={stageRef}>
        <p className="sr-only" id="core-film-desc">
          {L.tr(
            'ฉาก 3 มิติภายในชิป AI: ผลงาน 10 ชิ้นเป็นหน่วยความจำบน die ข้อมูลวิ่งผ่านบัสเข้า tensor core ขนาด 8×8 ที่ทำงานเป็นคลื่น และมีโฮโลแกรม hex dump ลอยอยู่ด้านบน ลากเพื่อหมุนได้ 360 องศา',
            '3D scene inside the AI chip: the 10 works are memory banks on the die, data runs over the bus into an 8×8 tensor core pulsing in waves, with a hex-dump hologram above it. Drag to rotate 360 degrees.',
          )}
        </p>
        <div className="gl-layer core__gl" role="img" aria-describedby="core-film-desc" data-cursor data-cursor-label="drag · inspect">
          {gl && (
            <Suspense fallback={null}>
              <CoreScene active={activeId} live={inView && !hidden} onHover={setHover} onSelect={select} />
            </Suspense>
          )}
        </div>
        <div className="core__shade" aria-hidden="true" />

        <div className="wrap core__inner">
          <SectionHead
            id="core"
            title={
              <>
                Inside the <span className="grad">core.</span>
              </>
            }
            sub={L.tr(
              'ซูมเข้าไปในชิป AI ตัวเดียวกับข้างบน — ผลงานทั้ง 10 ชิ้นเก็บอยู่ในหน่วยความจำบนชิป ข้อมูลไหลผ่านบัสเข้า tensor core คลิกที่หน่วยความจำเพื่ออ่านข้อมูลข้างใน',
              "Zoom into the same AI chip — all 10 works live in on-chip memory banks, and their data flows over the bus into the tensor core. Click a bank to read what's inside.",
            )}
          />
          <ol className="core__stages mono" aria-hidden="true">
            {STAGES.map(([k, v], i) => (
              <li key={k} className={i <= stage ? 'is-done' : ''}>
                <i />
                {String(i + 1).padStart(2, '0')} {k} <em>· {v}</em>
              </li>
            ))}
          </ol>
        </div>

        <aside className="core__dump glass" aria-label={L.tr('ข้อมูลในหน่วยความจำ', 'Memory bank readout')} data-no-drag>
          {/* อ่านออกเสียงเฉพาะก้อนที่ผู้ใช้เลือก — ไม่ใช่ทุกครั้งที่วนอ่านเอง */}
          <p className="sr-only" aria-live="polite">
            {locked ? `${w.name} — ${w.type}${w.status ? ` · ${w.status}` : ''}` : ''}
          </p>
          <div className="core__dump-bar mono">
            <span>
              <i className={locked ? 'is-locked' : ''} /> {locked ? 'locked' : hover ? 'probe' : 'reading'} · bank {w.code}
            </span>
            <span>
              0x{hex(base, 4)}–0x{hex(base + 0xff, 4)}
            </span>
          </div>
          <div className="core__hex mono" key={activeId}>
            {rows.map((r, i) => (
              <p key={r.addr} style={{ ['--i' as string]: i }}>
                <span className="a">{r.addr}</span>
                <span className="h">{r.hex}</span>
                <span className="c">{r.ascii}</span>
              </p>
            ))}
          </div>
          <dl className="core__fields" key={`f-${activeId}-${L.lang}`}>
            <div>
              <dt className="mono">name</dt>
              <dd>{w.name}</dd>
            </div>
            <div>
              <dt className="mono">type</dt>
              <dd>{w.type}</dd>
            </div>
            <div>
              <dt className="mono">status</dt>
              <dd className="mono">
                {w.status ?? '—'}
                {w.year ? ` · ${w.year}` : ''}
              </dd>
            </div>
            <div>
              <dt className="mono">stack</dt>
              <dd className="mono">
                {w.stack.slice(0, 3).join(' · ')}
                {w.stack.length > 3 ? ` +${w.stack.length - 3}` : ''}
              </dd>
            </div>
            {w.metrics?.[0] && (
              <div>
                <dt className="mono">metric</dt>
                <dd className="mono">
                  {w.metrics
                    .slice(0, 2)
                    .map(([k, v]) => `${k} ${v}`)
                    .join(' · ')}
                </dd>
              </div>
            )}
          </dl>
          <div className="core__banks" role="group" aria-label={L.tr('เลือกหน่วยความจำ (ผลงาน)', 'Pick a memory bank (project)')}>
            {WORKS.map(x => (
              <button
                key={x.id}
                type="button"
                className={`mono${x.id === activeId ? ' is-on' : ''}`}
                aria-pressed={locked === x.id}
                onClick={() => select(x.id)}
                title={x.name}
                data-cursor-label="read"
              >
                {x.code}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn--solid core__open" onClick={() => openWorkById(w.id)} data-cursor-label="open">
            {L.tr('เปิดผลงานนี้', 'Open this project')} · {w.code} <span className="arrow">→</span>
          </button>
        </aside>

        {gl && (
          <p className="spin-badge mono core__spin" aria-hidden="true">
            <span>⟲</span> drag · 360°
          </p>
        )}
      </div>
    </section>
  );
}
