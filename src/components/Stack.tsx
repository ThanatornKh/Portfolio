/* =========================================================
   06 · TECH STACK — กลุ่มดาว 3D + spec sheet + แถบเทคโนโลยีวิ่ง
   คลิกดาว (หรือหัวข้อใน spec sheet) = ล็อกโฟกัสในโมเดล · Esc / คลิกที่ว่าง = ปลด
   ========================================================= */
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { SKILLS } from '../data/content';
import { locSkills, useL } from '../data/localize';
import { TECHS, workById } from '../data/derived';
import { gsap, isNarrow, reduceMotion, scrollToTarget, useGSAP } from '../lib/motion';
import { openWorkById } from '../lib/route';
import { hasWebGL, useInView, usePageHidden } from '../lib/useInView';
import { spins, useUI } from '../lib/store';
import { useDragRotate } from '../lib/useDragRotate';
import SectionHead from './ui/SectionHead';
import './Stack.css';

const StackScene = lazy(() => import('../gl/StackScene'));

const ROW_A = [...TECHS].sort((a, b) => b.works.length - a.works.length);
const ROW_B = [...ROW_A].reverse();

const hubOf = (id: string) => SKILLS.find(s => s.tags.includes(id));

export default function Stack() {
  const L = useL();
  const SKILLS_L = locSkills(L.lang);
  const ref = useRef<HTMLElement>(null);
  const glRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [focusGroup, setFocusGroup] = useState<number | null>(null);
  const [gl] = useState(() => hasWebGL());
  const inView = useInView(glRef, '0px');
  const hidden = usePageHidden();
  useDragRotate(glRef, spins.stack, { touchOnly: true });

  // Esc = ปลดโฟกัส (ถ้าหน้ารายละเอียดผลงาน/เมนูเปิดอยู่ ให้ Esc ปิดสิ่งนั้นก่อน)
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      const ui = useUI.getState();
      if (e.key === 'Escape' && !ui.openId && !ui.menuOpen) setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const focusHub = (key: string) => {
    setSelected(`hub:${key}`);
    if (isNarrow() && glRef.current) scrollToTarget(glRef.current, -80);
  };

  // แผงข้อมูลแสดง: ดาวที่ชี้อยู่ → กลุ่มที่ชี้ใน spec list → ดาวที่ล็อกไว้
  const shown = hover ?? (focusGroup !== null ? `hub:${SKILLS[focusGroup].key}` : selected);
  const hub = shown?.startsWith('hub:') ? SKILLS.find(s => `hub:${s.key}` === shown) : null;
  const tech = shown && !hub ? TECHS.find(t => t.name === shown) : null;
  const techHub = shown && !hub ? hubOf(shown) : null;
  const selLabel = selected?.startsWith('hub:') ? selected.slice(4) : selected;

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
          sub={L.tr(
            `แผนที่ดาวของ ${TECHS.length} เทคโนโลยีที่ใช้จริงในผลงาน — คลิกที่ดาวเพื่อโฟกัสและดูว่าใช้ในงานไหน ลากเพื่อหมุน`,
            `A star map of the ${TECHS.length} technologies used in real projects — click a star to focus on it and see where it is used, drag to rotate`,
          )}
        />
        <div className="stack__grid">
          <div
            className={`stack__gl${selected ? ' is-locked' : ''}`}
            ref={glRef}
            data-cursor
            data-cursor-label={hover && hover !== selected ? 'click · focus' : selected ? 'drag · orbit' : 'drag · 360°'}
          >
            {gl && (
              <p className="spin-badge mono stack__spin" aria-hidden="true">
                <span>⟲</span> {selected ? 'drag · orbit' : 'drag · 360°'}
              </p>
            )}
            {gl ? (
              <Suspense fallback={null}>
                <StackScene active={inView && !hidden} hover={hover} selected={selected} focusGroup={focusGroup} onHover={setHover} onSelect={setSelected} />
              </Suspense>
            ) : (
              <p className="mono stack__nogl">{L.tr('WebGL ไม่พร้อมใช้งาน — ดูรายการทักษะด้านขวา', 'WebGL is not available — see the skills list instead')}</p>
            )}
            <div className="stack__panel glass" aria-live="polite">
              {selected && (
                <div className="stack__lock mono">
                  <span>
                    <i aria-hidden="true" /> focus · <b>{selLabel}</b>
                  </span>
                  <button type="button" onClick={() => setSelected(null)} data-cursor-label="release">
                    {L.tr('ปลดล็อก', 'Release')} <kbd>Esc</kbd>
                  </button>
                </div>
              )}
              {tech ? (
                <>
                  <p className="mono">
                    <b>{tech.name}</b> · {L.tr(`ใช้ใน ${tech.works.length} ผลงาน`, `used in ${tech.works.length} ${tech.works.length === 1 ? 'work' : 'works'}`)}
                    {techHub && <> · {L.tr('กลุ่ม', 'group')} {techHub.key}</>}
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
                    <b>{hub.key}</b> · {hub.tags.length} {L.tr('เทคโนโลยี', 'technologies')}
                  </p>
                  <p className="stack__hubdesc">{SKILLS_L.find(x => x.key === hub.key)?.desc}</p>
                  {selected === shown && (
                    <div className="chips">
                      {hub.tags.map(t => (
                        <button key={t} type="button" className="chip" onClick={() => setSelected(t)}>
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : shown ? (
                <p className="mono">
                  <b>{shown}</b>
                  {techHub && <> · {L.tr('กลุ่ม', 'group')} {techHub.key}</>} · {L.tr('ยังไม่มีในผลงานที่แสดงในหน้านี้', 'not in the works shown on this page yet')}
                </p>
              ) : (
                <p className="mono">
                  click a star to focus · <b>{TECHS.length}</b> technologies · <b>{SKILLS.length}</b> groups
                </p>
              )}
            </div>
          </div>
          <ol className="stack__spec">
            {SKILLS.map((s, i) => (
              <li
                key={s.key}
                className={`${focusGroup === i ? 'is-on' : ''}${selected === `hub:${s.key}` ? ' is-locked' : ''}`}
                onPointerEnter={e => e.pointerType === 'mouse' && setFocusGroup(i)}
                onPointerLeave={() => setFocusGroup(null)}
                onFocus={() => setFocusGroup(i)}
                onBlur={() => setFocusGroup(null)}
                onClick={() => focusHub(s.key)}
                onKeyDown={e => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  focusHub(s.key);
                }}
                tabIndex={0}
                data-cursor
                data-cursor-label="focus"
              >
                <span className="mono stack__no">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{s.key}</h3>
                  <p>{SKILLS_L[i].desc}</p>
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
      <p className="sr-only">{L.tr('เทคโนโลยีทั้งหมด', 'All technologies')}: {TECHS.map(t => `${t.name} (${t.works.map(w => workById.get(w.id)?.name).join(', ')})`).join('; ')}</p>
    </section>
  );
}
