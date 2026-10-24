/* =========================================================
   05 · TECH STACK — กลุ่มดาว 3D + spec sheet + แถบเทคโนโลยีวิ่ง
   ========================================================= */
import { lazy, Suspense, useRef, useState } from 'react';
import { SKILLS } from '../data/content';
import { TECHS, workById } from '../data/derived';
import { gsap, reduceMotion, useGSAP } from '../lib/motion';
import { openWorkById } from '../lib/route';
import { hasWebGL, useInView, usePageHidden } from '../lib/useInView';
import { spins } from '../lib/store';
import { useDragRotate } from '../lib/useDragRotate';
import SectionHead from './ui/SectionHead';
import './Stack.css';

const StackScene = lazy(() => import('../gl/StackScene'));

const ROW_A = [...TECHS].sort((a, b) => b.works.length - a.works.length);
const ROW_B = [...ROW_A].reverse();

export default function Stack() {
  const ref = useRef<HTMLElement>(null);
  const glRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [focusGroup, setFocusGroup] = useState<number | null>(null);
  const [gl] = useState(() => hasWebGL());
  const inView = useInView(glRef, '0px');
  const hidden = usePageHidden();
  useDragRotate(glRef, spins.stack, { touchOnly: true });

  const tech = hover && !hover.startsWith('hub:') ? TECHS.find(t => t.name === hover) : null;
  const hubKey = hover?.startsWith('hub:') ? hover.slice(4) : focusGroup !== null ? SKILLS[focusGroup].key : null;
  const hub = hubKey ? SKILLS.find(s => s.key === hubKey) : null;

  useGSAP(
    () => {
      if (reduceMotion) return;
      gsap.from('.stack__spec li', { opacity: 0, x: 30, stagger: 0.06, duration: 0.9, scrollTrigger: { trigger: '.stack__spec', start: 'top 80%', once: true } });
      gsap.from('.stack__gl', { opacity: 0, scale: 0.9, duration: 1.4, scrollTrigger: { trigger: '.stack__gl', start: 'top 80%', once: true } });
    },
    { scope: ref },
  );

  return (
    <section id="stack" className="section stack" ref={ref}>
      <div className="wrap">
        <SectionHead
          id="stack"
          title={
            <>
              Everything, <span className="grad">connected.</span>
            </>
          }
          sub={`แผนที่ดาวของ ${TECHS.length} เทคโนโลยีที่ใช้จริงในผลงาน — เลื่อนเมาส์ไปที่ดาวเพื่อดูว่าใช้ในงานไหน ลากเพื่อหมุน`}
        />
        <div className="stack__grid">
          <div className="stack__gl" ref={glRef} data-cursor data-cursor-label="drag · 360°">
            {gl && (
              <p className="spin-badge mono stack__spin" aria-hidden="true">
                <span>⟲</span> drag · 360°
              </p>
            )}
            {gl ? (
              <Suspense fallback={null}>
                <StackScene active={inView && !hidden} hover={hover} focusGroup={focusGroup} onHover={setHover} />
              </Suspense>
            ) : (
              <p className="mono stack__nogl">WebGL ไม่พร้อมใช้งาน — ดูรายการทักษะด้านขวา</p>
            )}
            <div className="stack__panel glass" aria-live="polite">
              {tech ? (
                <>
                  <p className="mono">
                    <b>{tech.name}</b> · ใช้ใน {tech.works.length} ผลงาน
                  </p>
                  <div className="chips">
                    {tech.works.map(w => (
                      <button key={w.id} type="button" className="chip chip--accent" onClick={() => openWorkById(w.id)}>
                        {w.code} {w.name}
                      </button>
                    ))}
                  </div>
                </>
              ) : hub ? (
                <>
                  <p className="mono">
                    <b>{hub.key}</b>
                  </p>
                  <p className="stack__hubdesc">{hub.desc}</p>
                </>
              ) : (
                <p className="mono">
                  hover a star · <b>{TECHS.length}</b> technologies · <b>{SKILLS.length}</b> groups
                </p>
              )}
            </div>
          </div>
          <ol className="stack__spec">
            {SKILLS.map((s, i) => (
              <li
                key={s.key}
                className={focusGroup === i ? 'is-on' : ''}
                onPointerEnter={() => setFocusGroup(i)}
                onPointerLeave={() => setFocusGroup(null)}
                onFocus={() => setFocusGroup(i)}
                onBlur={() => setFocusGroup(null)}
                tabIndex={0}
              >
                <span className="mono stack__no">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{s.key}</h3>
                  <p>{s.desc}</p>
                  <div className="chips">
                    {s.tags.map(t => (
                      <span key={t} className="chip">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="marquee" aria-hidden="true">
        {[ROW_A, ROW_B].map((row, r) => (
          <div className={`marquee__row${r ? ' is-rev' : ''}`} key={r}>
            {[0, 1].map(k => (
              <div className="marquee__track" key={k}>
                {row.map(t => (
                  <span key={t.name} className="marquee__item">
                    <i>✦</i> {t.name} <sup>{t.works.length}</sup>
                  </span>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="sr-only">เทคโนโลยีทั้งหมด: {TECHS.map(t => `${t.name} (${t.works.map(w => workById.get(w.id)?.name).join(', ')})`).join('; ')}</p>
    </section>
  );
}
